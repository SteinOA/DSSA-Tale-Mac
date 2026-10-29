const test = require('node:test');
const assert = require('node:assert/strict');
const { NbDictationPrecompute } = require('../../src/helpers/nbDictationPrecompute');
const { slicePcm16Wav } = require('../../src/helpers/nbAudioChunks');
function wav(seconds, byte = 1) {
 const data=Buffer.alloc(seconds*32000,byte), h=Buffer.alloc(44);
 h.write('RIFF');h.writeUInt32LE(data.length+36,4);h.write('WAVEfmt ',8);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(1,22);h.writeUInt32LE(16000,24);h.writeUInt32LE(32000,28);h.writeUInt16LE(2,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(data.length,40);return Buffer.concat([h,data]);
}
const settings={model:'nb-large-full:sha256-model',language:'no',decoder:{prompt:'',entropy:2.8,logprob:-1.25}};
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
test('exact full windows only; trailing margin, PCM/settings identity, defensive result copies',async()=>{
 let calls=0;const c=new NbDictationPrecompute({normalize:async b=>b,transcribe:async()=>({text:'tekst',n:++calls})});const token=c.begin(settings);
 c.offer(token,wav(28));await c.idle();assert.equal(calls,0);
 c.offer(token,wav(29));await c.idle();assert.equal(calls,1);
 const chunk=wav(28);assert.equal((await c.lookup(token,chunk,settings)).text,'tekst');
 const result=await c.lookup(token,chunk,settings);result.text='changed';assert.equal((await c.lookup(token,chunk,settings)).text,'tekst');
 for(const [audio,config]of [[wav(27),settings],[wav(28,2),settings],[chunk,{...settings,language:'nn'}],[chunk,{...settings,model:'other'}],[chunk,{...settings,decoder:{...settings.decoder,prompt:'changed'}}]]) assert.equal(await c.lookup(token,audio,config),undefined);
 c.offer(token,wav(57));await c.idle();assert.equal(calls,1); // identical PCM windows safely share result
});
test('finish preserves and awaits exact in-flight inference; unrelated lookup never waits',async()=>{
 const gate=deferred(),started=deferred();let signal;const c=new NbDictationPrecompute({normalize:async b=>b,transcribe:async(b,s,o)=>{signal=o.signal;started.resolve();return gate.promise;}});const t=c.begin(settings);c.offer(t,wav(29));await started.promise;c.finish(t);assert.equal(signal.aborted,false);assert.equal(c.offer(t,wav(30)),false);
 assert.equal(await c.lookup(t,wav(28,2),settings),undefined);
 const match=c.lookup(t,wav(28),settings);gate.resolve({text:'done'});assert.equal((await match).text,'done');await c.idle();c.cancel(t);assert.equal(await c.lookup(t,wav(28),settings),undefined);
});
test('coalesces cumulative snapshots and never overlaps sessions even if callback ignores abort',async()=>{
 const gate=deferred(),started=deferred();let active=0,max=0;const inputs=[];const c=new NbDictationPrecompute({normalize:async b=>{inputs.push(b[0]);active++;max=Math.max(max,active);if(inputs.length===1){started.resolve();await gate.promise;}active--;return wav(29,b[0]);},transcribe:async()=>({text:'ok'})});
 const old=c.begin(settings);c.offer(old,Buffer.from([1]));await started.promise;c.offer(old,Buffer.from([2]));c.offer(old,Buffer.from([3]));const next=c.begin(settings);c.offer(next,Buffer.from([4]));c.offer(next,Buffer.from([5]));gate.resolve();await c.idle();assert.deepEqual(inputs,[1,5]);assert.equal(max,1);assert.equal(await c.lookup(old,wav(28),settings),undefined);assert.equal((await c.lookup(next,wav(28,5),settings)).text,'ok');
});
test('failure is cache miss, snapshot/entry limits bound work, cancellation rejects stale results',async()=>{
 let fail=true;const c=new NbDictationPrecompute({maxEntries:1,maxSnapshotBytes:2000000,normalize:async b=>b,transcribe:async()=>{if(fail)throw Error('failed');return {text:'ok'};}});const t=c.begin(settings);assert.equal(c.offer(t,Buffer.alloc(2000001)),false);c.offer(t,wav(29));await c.idle();assert.equal(await c.lookup(t,wav(28),settings),undefined);fail=false;c.offer(t,wav(29));await c.idle();c.offer(t,wav(29,2));await c.idle();assert.equal(await c.lookup(t,wav(28,2),settings),undefined);
 const gate=deferred(),start=deferred();const d=new NbDictationPrecompute({normalize:async b=>b,transcribe:async()=>{start.resolve();return gate.promise;}});const old=d.begin(settings);d.offer(old,wav(29));await start.promise;const pending=d.lookup(old,wav(28),settings);d.cancel(old);gate.resolve({text:'stale'});assert.equal(await pending,undefined);await d.idle();
});
test('seal during normalization does not launch a new inference competing with final decode',async()=>{
 const gate=deferred(),started=deferred();let calls=0;const c=new NbDictationPrecompute({normalize:async()=>{started.resolve();return gate.promise;},transcribe:async()=>{calls++;return {text:'unexpected'};}});const t=c.begin(settings);c.offer(t,wav(29));await started.promise;c.finish(t);gate.resolve(wav(29));await c.idle();assert.equal(calls,0);assert.equal(await c.lookup(t,wav(28),settings),undefined);
});
test('distinct completed windows retain every sample and settings; final tail always misses',async()=>{
 const input=wav(57);input.fill(2,44+28*32000,44+56*32000);input.fill(3,44+56*32000);
 const chunks=[];const c=new NbDictationPrecompute({normalize:async()=>input,transcribe:async(b,s)=>{assert.deepEqual(s,settings);chunks.push(b);return {text:String(chunks.length)};}});const t=c.begin(settings);c.offer(t,Buffer.from('original webm header and all chunks'));await c.idle();assert.equal(chunks.length,2);assert.deepEqual(Buffer.concat(chunks.map(b=>b.subarray(44))),input.subarray(44,44+56*32000));assert.equal((await c.lookup(t,slicePcm16Wav(input,28,56),settings)).text,'2');assert.equal(await c.lookup(t,slicePcm16Wav(input,56,57),settings),undefined);
});
