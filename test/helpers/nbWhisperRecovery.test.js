const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const WhisperServerManager = require("../../src/helpers/whisperServer");
const { isSilentPcm16Wav, slicePcm16Wav } = require("../../src/helpers/nbAudioChunks");

function wav(seconds, amplitude) {
  const data = Buffer.alloc(Math.round(seconds * 32000));
  for(let i=0;i<data.length/2;i++) data.writeInt16LE(Math.round(amplitude*Math.sin(i/17)),i*2);
  const header=Buffer.alloc(44);
  header.write("RIFF");header.writeUInt32LE(36+data.length,4);header.write("WAVEfmt ",8);
  header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);
  header.writeUInt32LE(16000,24);header.writeUInt32LE(32000,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);
  header.write("data",36);header.writeUInt32LE(data.length,40);
  return Buffer.concat([header,data]);
}

async function fixture(t, { model="ggml-nb-large-full.bin", first=" <|nocaptions|>\n" }={}) {
  const requests=[];
  const server=http.createServer((req,res)=>{
    const chunks=[];req.on("data",chunk=>chunks.push(chunk));req.on("end",()=>{
      const body=Buffer.concat(chunks);requests.push(body);
      const suppress=body.includes(Buffer.from('name="suppress_nst"\r\n\r\ntrue\r\n'));
      res.writeHead(200,{"Content-Type":"application/json"});
      res.end(JSON.stringify({text:suppress?"Dette er gjenopprettet tale.":first}));
    });
  });
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const manager=new WhisperServerManager();
  Object.assign(manager,{ready:true,hostname:"127.0.0.1",port:server.address().port,canConvert:true,process:{},modelPath:"/models/"+model});
  manager._convertToWav=async buffer=>buffer;
  return {manager,requests};
}

test("clear NB speech is retried once with suppress_nst while preserving language, prompt and audio",async t=>{
  const {manager,requests}=await fixture(t);const audio=wav(1,3000);
  const result=await manager.transcribe(audio,{language:"nn",initialPrompt:"DSSA",skipDecoderThresholds:true});
  assert.equal(result.text,"Dette er gjenopprettet tale.");assert.equal(requests.length,2);
  assert.equal(requests[0].includes(Buffer.from('name="suppress_nst"')),false);
  assert.equal(requests[1].includes(Buffer.from('name="suppress_nst"\r\n\r\ntrue\r\n')),true);
  for(const body of requests){
    assert.equal(body.includes(audio),true);
    assert.equal(body.includes(Buffer.from('name="language"\r\n\r\nnn\r\n')),true);
    assert.equal(body.includes(Buffer.from('name="prompt"\r\n\r\nDSSA\r\n')),true);
    assert.equal(body.includes(Buffer.from('name="entropy_thold"')),false);
  }
});

test("silent and very quiet NB clips keep the non-speech result without hallucination-prone retry",async t=>{
  const {manager,requests}=await fixture(t);
  for(const amplitude of [0,10]){
    const audio=wav(1,amplitude);assert.equal(isSilentPcm16Wav(audio),true);
    assert.match((await manager.transcribe(audio,{language:"no"})).text,/nocaptions/);
  }
  assert.equal(requests.length,2);
  assert.ok(requests.every(body=>!body.includes(Buffer.from('name="suppress_nst"'))));
});

test("other models and successful NB transcripts never receive recovery suppression",async t=>{
  const other=await fixture(t,{model:"ggml-large-v3.bin"});
  await other.manager.transcribe(wav(1,3000),{language:"no"});assert.equal(other.requests.length,1);
  const normal=await fixture(t,{first:"Vanlig norsk tekst."});
  assert.equal((await normal.manager.transcribe(wav(1,3000),{})).text,"Vanlig norsk tekst.");
  assert.equal(normal.requests.length,1);
});

test("NB q5 recovery remains bounded to the existing 28-second windows",async t=>{
  const {manager,requests}=await fixture(t,{model:"ggml-nb-large-q5_0.bin"});
  const audio=wav(29,3000);const result=await manager.transcribe(audio,{language:"no"});
  assert.equal(requests.length,4);
  assert.equal(result.text,"Dette er gjenopprettet tale. Dette er gjenopprettet tale.");
  const first=slicePcm16Wav(audio,0,28),last=slicePcm16Wav(audio,28,29);
  assert.ok(requests[0].includes(first));assert.ok(requests[1].includes(first));
  assert.ok(requests[2].includes(last));assert.ok(requests[3].includes(last));
});

test("audio validation fails closed and invalid window lengths cannot loop forever",()=>{
  const {splitPcm16Wav}=require("../../src/helpers/nbAudioChunks");
  assert.throws(()=>isSilentPcm16Wav(Buffer.from("not audio")));
  for(const duration of [0,-1,NaN,Infinity])assert.throws(()=>splitPcm16Wav(wav(1,0),duration));
});

test("NB long uploads normalize once and send every original PCM sample without reconverting windows",async t=>{
  const {manager,requests}=await fixture(t,{first:"God norsk tekst."});
  const normalized=wav(57,2000);
  const upload=Buffer.from("opaque uploaded MP3 fixture");
  let conversions=0;
  manager._convertToWav=async input=>{conversions++;assert.equal(input,upload);return normalized;};
  const result=await manager.transcribe(upload,{language:"nn",initialPrompt:"Nasjonalbiblioteket",skipDecoderThresholds:true});
  assert.equal(conversions,1);
  assert.equal(requests.length,3);
  assert.equal(result.text,"God norsk tekst. God norsk tekst. God norsk tekst.");
  const {splitPcm16Wav}=require("../../src/helpers/nbAudioChunks");
  splitPcm16Wav(normalized).forEach((chunk,index)=>{
    assert.ok(requests[index].includes(chunk));
    assert.ok(requests[index].includes(Buffer.from('name="language"\r\n\r\nnn\r\n')));
    assert.ok(requests[index].includes(Buffer.from("Nasjonalbiblioteket")));
    assert.ok(!requests[index].includes(Buffer.from('name="entropy_thold"')));
  });
});

test("public WAV inputs still normalize, including stereo and other sample rates",async t=>{
  const {manager,requests}=await fixture(t,{first:"Hei."});
  const normalized=wav(1,2000);
  const stereo=Buffer.from(normalized);stereo.writeUInt16LE(2,22);stereo.writeUInt32LE(48000,24);
  const inputs=[normalized,stereo];let conversions=0;
  manager._convertToWav=async input=>{assert.equal(input,inputs[conversions++]);return normalized;};
  for(const input of inputs)await manager.transcribe(input,{language:"no"});
  assert.equal(conversions,2);assert.equal(requests.length,2);
});

test("cancellation after normalization prevents any chunk request",async t=>{
  const {manager,requests}=await fixture(t);
  const controller=new AbortController();
  manager._convertToWav=async()=>{controller.abort();return wav(57,2000);};
  await assert.rejects(manager.transcribe(Buffer.from("upload"),{signal:controller.signal}),{name:"AbortError"});
  assert.equal(requests.length,0);
});

test("cancellation between normalized windows stops the remaining requests",async t=>{
  const {manager,requests}=await fixture(t,{first:"Hei."});
  const controller=new AbortController();
  const post=manager._postInference.bind(manager);
  manager._postInference=async(...args)=>{const response=await post(...args);controller.abort();return response;};
  await assert.rejects(manager.transcribe(wav(57,2000),{signal:controller.signal}),{name:"AbortError"});
  assert.equal(requests.length,1);
});

test("actual server path uses exact precomputed window only after final normalization and decodes tail",async t=>{
 const {NbDictationPrecompute}=require('../../src/helpers/nbDictationPrecompute');
 const {manager,requests}=await fixture(t,{first:'Final tail.'});
 const input=wav(29,3000),identity={model:manager.modelPath,language:'no',decoder:{prompt:'DSSA'}};
 let normalization=0;manager._convertToWav=async()=>{normalization++;return input;};
 const cache=new NbDictationPrecompute({normalize:async()=>input,transcribe:async()=>({text:'Cached first window.'})});
 const token=cache.begin(identity);cache.offer(token,Buffer.from('original complete WebM'));await cache.idle();cache.finish(token);
 const result=await manager.transcribe(Buffer.from('final complete WebM'),{language:'no',nbIdentity:identity,nbCacheLookup:(w,s)=>cache.lookup(token,w,s)});
 assert.equal(normalization,1);assert.equal(result.text,'Cached first window. Final tail.');assert.equal(requests.length,1);assert.ok(requests[0].includes(slicePcm16Wav(input,28,29)));
 await manager.transcribe(input,{language:'nn',nbIdentity:{...identity,language:'nn'},nbCacheLookup:(w,s)=>cache.lookup(token,w,s)});assert.equal(requests.length,3,'changed settings decode both windows normally');
 const changed=Buffer.from(input);changed[100]^=1;manager._convertToWav=async()=>changed;
 await manager.transcribe(input,{language:'no',nbIdentity:identity,nbCacheLookup:(w,s)=>cache.lookup(token,w,s)});assert.equal(requests.length,5,'changed final samples decode both windows normally');
});
