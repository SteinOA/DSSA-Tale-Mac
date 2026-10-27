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
