const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {importAudioFile,FORMAT,mergeText,wrapPcmWav}=require('../../src/helpers/nbFileImport');
const {getPcm16WavData}=require('../../src/helpers/nbAudioChunks');
async function setup(t,seconds=65){const root=await fs.mkdtemp(path.join(os.tmpdir(),'nb-file-test-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));const file=path.join(root,'source.mp3');await fs.writeFile(file,'Original source');return {root,file,convert:async(_src,dest)=>fs.writeFile(dest,wrapPcmWav(Buffer.alloc(seconds*32000,1))),modelIdentity:{model:{sha256:'a'.repeat(64),stat:{size:1,mtimeMs:1,ino:1}},decoder:{prompt:'Keep names'}}};}
const options={model:'nb-large-full',language:'nn'};
test('65 seconds is decoded in bounded overlapping windows, with real progress and unchanged source',async t=>{
 const h=await setup(t),calls=[],events=[];const original=await fs.readFile(h.file);
 const result=await importAudioFile(h.file,options,{...h,tempRoot:h.root,onProgress:e=>events.push(e),decode:async(wav,o)=>{calls.push(getPcm16WavData(wav).length/32000);assert.equal(o.priority,'background');assert.equal(o.language,'nn');return {text:'Del '+calls.length};}});
 assert.deepEqual(calls,[28,28,10]);assert.equal(result.text,'Del 1 Del 2 Del 3');assert.equal(result.totalSeconds,65);
 assert.deepEqual(events.filter(x=>x.phase==='transcribing').map(x=>x.completedChunks),[0,1,2,3]);assert.equal(events.at(-1).completedSeconds,65);
 assert.deepEqual(await fs.readFile(h.file),original);assert.deepEqual(await fs.readdir(h.root),['source.mp3']);
});
test('abort keeps completed checkpoint and cleans only its PCM workspace; retry reuses prefix',async t=>{
 const h=await setup(t),saved=[];let complete=0;const controller=new AbortController();
 const checkpointStore={open:async()=>({readPrefix:async()=>saved.map(x=>({...x})),save:async(i,r)=>{saved[i]=r;},complete:async()=>{complete++;}})};
 await assert.rejects(importAudioFile(h.file,options,{...h,tempRoot:h.root,checkpointStore,signal:controller.signal,onProgress:e=>{if(e.completedChunks===1)controller.abort();},decode:async()=>({text:'Første del'})}),{name:'AbortError'});
 assert.equal(saved.length,1);assert.equal(complete,0);assert.deepEqual(await fs.readdir(h.root),['source.mp3']);let decoded=0;
 const result=await importAudioFile(h.file,options,{...h,tempRoot:h.root,checkpointStore,decode:async()=>({text:'Ny del '+ ++decoded})});
 assert.equal(decoded,2);assert.equal(result.resumedChunks,1);assert.equal(complete,1);
});
test('checkpoint I/O failure and silent windows cannot discard a usable transcript',async t=>{
 const h=await setup(t,40);let n=0;
 const result=await importAudioFile(h.file,options,{...h,tempRoot:h.root,checkpointStore:{open:async()=>{throw Error('disk full');}},decode:async()=>({text:++n===1?'':'Eg kjem i morgon.'})});
 assert.equal(result.text,'Eg kjem i morgon.');
});
test('changing source during conversion is rejected before decode',async t=>{
 const h=await setup(t);await assert.rejects(importAudioFile(h.file,options,{...h,tempRoot:h.root,convert:async(src,dest)=>{await h.convert(src,dest);await fs.appendFile(src,' changed');},decode:async()=>assert.fail('source identity changed')}),/Source changed/);
});
test('disabling history during a resumed job stops reuse of further saved chunks',async t=>{
 const h=await setup(t);let enabled=true,decoded=0;
 const result=await importAudioFile(h.file,options,{...h,tempRoot:h.root,historyAllowed:()=>enabled,checkpointStore:{open:async()=>({readPrefix:async()=>[{text:'Tidlegare 1'},{text:'Tidlegare 2'}],save:async()=>{},complete:async()=>{}})},onProgress:e=>{if(e.completedChunks===1)enabled=false;},decode:async()=>({text:'Ny '+ ++decoded})});
 assert.equal(decoded,2);assert.equal(result.text,'Tidlegare 1 Ny 1 Ny 2');
});
test('overlap merge removes exact longer repeats but retains ambiguous single words and Nynorsk',()=>{
 assert.equal(mergeText('Eg kjem i morgon.','kjem i morgon og blir her.'),'Eg kjem i morgon. og blir her.');
 assert.equal(mergeText('Vi sa ja','ja til saka'),'Vi sa ja ja til saka');assert.equal(FORMAT.stepSamples/16000,27.5);
});

test('true digital silence avoids prompt hallucination and internal markers never reach documents',async t=>{
 const h=await setup(t,1);const silent=await importAudioFile(h.file,options,{...h,tempRoot:h.root,convert:async(_s,d)=>fs.writeFile(d,wrapPcmWav(Buffer.alloc(32000))),decode:async()=>assert.fail('silent window must not decode a dictionary prompt')});assert.equal(silent.text,'');
 const result=await importAudioFile(h.file,options,{...h,tempRoot:h.root,decode:async()=>({text:'Eg <|nocaptions|> kjem i morgon.'})});assert.equal(result.text,'Eg kjem i morgon.');
});
