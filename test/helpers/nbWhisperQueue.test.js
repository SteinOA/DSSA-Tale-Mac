const test=require('node:test'),assert=require('node:assert/strict');
const WhisperManager=require('../../src/helpers/whisper');
const {NbWhisperQueue}=require('../../src/helpers/nbWhisperQueue');
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};}
function wav(seconds){const b=Buffer.alloc(44+32000*seconds);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(16000,24);b.writeUInt32LE(32000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(b.length-44,40);return b;}
function fixture(gate){
 let active=false,model,starts=0,decodes=0,normalized=0;const calls=[];
 const m=new WhisperManager();m._verifyNbModel=async()=>{};m.getModelPath=name=>name==='nb-large-full'?__filename:require.resolve('../../src/helpers/whisper');m.resolveGpuStartOptions=()=>({useCuda:false,useVulkan:false});m.getVadModelPath=()=>'/silero';
 m.serverManager={isAvailable:()=>true,_convertToWav:async b=>{normalized++;return b;},start:async(p,o)=>{assert.equal(active,false,'start/model switch cannot overlap a decode');model=p;starts++;calls.push(['start',p,o]);},stop:async()=>{assert.equal(active,false);calls.push(['stop']);},_transcribeNormalizedWav:async(b,o)=>{assert.equal(active,false);active=true;const n=++decodes;calls.push(['decode',model,o,b.length]);if(n===1&&gate)await gate.promise;active=false;return {text:o.language==='nn'?'nynorsk':'bokmål'};}};
 return {m,calls,counts:()=>({starts,decodes,normalized})};
}
test('manager serializes model+VAD+decode, prioritizes dictation between background windows, normalizes only once',async()=>{
 const gate=deferred(),{m,calls,counts}=fixture(gate);
 const background=m.transcribeViaServer(wav(57),'nb-large-full','no','bakgrunn',{priority:'background',vadEnabled:true,vadConfig:{threshold:.5}});
 await new Promise(setImmediate);const interactive=m.transcribeViaServer(wav(2),'nb-large','nn','ordliste',{priority:'interactive',vadEnabled:false});await new Promise(setImmediate);assert.equal(counts().decodes,1);gate.resolve();
 const [b,i]=await Promise.all([background,interactive]);assert.equal(b.text,'bokmål bokmål bokmål');assert.equal(i.text,'nynorsk');const requests=calls.filter(c=>c[0]==='decode');assert.deepEqual(requests.map(c=>c[2].language),['no','nn','no','no']);assert.deepEqual(requests.map(c=>c[2].initialPrompt),['bakgrunn','ordliste','bakgrunn','bakgrunn']);assert.equal(counts().normalized,2);assert.deepEqual(requests.map(c=>(c[3]-44)/32000),[28,2,28,1]);assert.equal(m._transcribing,false);
});
test('exact in-flight precompute lookup outside queue avoids deadlock and duplicate decode',async()=>{
 const gate=deferred(),{m,counts}=fixture(gate);const blocker=m.transcribeNormalizedWhisperWindow(wav(1),{model:'nb-large',language:'no'});await new Promise(setImmediate);
 const precompute=m.transcribeNormalizedWhisperWindow(wav(28),{model:'nb-large-full',language:'no'});
 const final=m.transcribeViaServer(wav(28),'nb-large-full','no',null,{nbNormalized:true,nbCacheLookup:()=>precompute});gate.resolve();await blocker;assert.equal((await final).text,'bokmål');assert.equal(counts().decodes,2);
});
test('active cancellation keeps physical engine locked; pending cancellation never starts',async()=>{
 const gate=deferred(),{m,calls,counts}=fixture(gate),controller=new AbortController(),waiting=new AbortController();
 const active=m.transcribeNormalizedWhisperWindow(wav(1),{language:'no',signal:controller.signal});const rejected=assert.rejects(active,{name:'AbortError'});await new Promise(setImmediate);controller.abort();const cancelled=m.transcribeNormalizedWhisperWindow(wav(1),{signal:waiting.signal});waiting.abort();await assert.rejects(cancelled,{name:'AbortError'});
 const next=m.transcribeNormalizedWhisperWindow(wav(1),{language:'nn'});await new Promise(setImmediate);assert.equal(counts().starts,1);assert.equal(calls.find(c=>c[0]==='decode')[2].signal,undefined);gate.resolve();await rejected;assert.equal((await next).text,'nynorsk');assert.equal(counts().starts,2);
});
test('explicit startup and stop wait until active decode completes',async()=>{
 const gate=deferred(),{m,calls}=fixture(gate);const active=m.transcribeNormalizedWhisperWindow(wav(1),{});await new Promise(setImmediate);const start=m.startServer('nb-large');const stop=m.stopServer();await new Promise(setImmediate);assert.equal(calls.length,2);gate.resolve();await Promise.all([active,start,stop]);assert.ok(calls.some(c=>c[0]==='stop'));
});
test('silent window returns raw empty result; malformed or oversized PCM never reaches queue',async()=>{
 const {m,counts}=fixture();m.serverManager._transcribeNormalizedWav=async()=>({text:''});assert.deepEqual(await m.transcribeNormalizedWhisperWindow(wav(1),{}),{text:''});await assert.rejects(m.transcribeNormalizedWhisperWindow(wav(29),{}),/at most/);await assert.rejects(m.transcribeNormalizedWhisperWindow(Buffer.from('bad'),{}));assert.equal(counts().starts,1);
});
test('queue failures release next job and preserve FIFO inside each priority',async()=>{
 const q=new NbWhisperQueue(),gate=deferred(),order=[];const first=q.run(()=>gate.promise);const a=q.run(()=>{order.push('b1');throw Error('failed');},{priority:'background'});const rejected=assert.rejects(a,/failed/);const b=q.run(()=>order.push('b2'),{priority:'background'});const c=q.run(()=>order.push('dictation'));gate.resolve();await Promise.all([first,rejected,b,c]);assert.deepEqual(order,['dictation','b1','b2']);
});
test('legacy remote connect also cannot replace shared manager during local decoding',async()=>{
 const gate=deferred(),{m,counts}=fixture(gate);let connected=false;m.serverManager.connectRemote=async()=>{connected=true;};m.serverManager.transcribe=async()=>({text:'remote'});
 const local=m.transcribeNormalizedWhisperWindow(wav(1),{});await new Promise(setImmediate);const remote=m.transcribeViaLan(wav(1),'http://localhost:9000',{});await new Promise(setImmediate);assert.equal(connected,false);gate.resolve();await local;assert.equal((await remote).text,'remote');assert.equal(counts().decodes,1);
});
