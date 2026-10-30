const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {runWorker,validateCommunityResult,readCommunityConfig}=require('../../src/helpers/dssaCommunityDiarization');
test('model labels are anonymous, automatic and bounded to at most fifteen',()=>{
 const base={success:true,engine:'pyannote-community-1',durationSeconds:10,segments:[{start:0,end:1,speaker:'speaker_0'}]};assert.equal(validateCommunityResult(base),base);
 assert.throws(()=>validateCommunityResult({...base,segments:[{start:0,end:1,speaker:'Stein'}]}));
 assert.throws(()=>validateCommunityResult({...base,segments:Array.from({length:16},(_,i)=>({start:0,end:1,speaker:'speaker_'+i}))}));
 assert.throws(()=>validateCommunityResult({...base,segments:[{start:9,end:12,speaker:'speaker_0'}]}));
 assert.deepEqual(validateCommunityResult({...base,segments:[]}).segments,[]);
});
test('Mac configuration accepts CPU/MPS, refuses CUDA and never returns a token',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'dssa-cfg-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 for(const device of ['cpu','mps','cuda']){await fs.writeFile(path.join(root,'dssa-community-engine.json'),JSON.stringify({enabled:true,pythonPath:process.execPath,modelPath:root,device,token:'must-not-return'}));const c=readCommunityConfig(root);if(device==='cuda')assert.equal(c,null);else assert.deepEqual(Object.keys(c).sort(),['device','modelPath','pythonPath']);}
});
test('real process-group cancellation kills a spawned descendant and ignores private stderr',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'dssa-process-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));const script=path.join(root,'worker.js'),pidFile=path.join(root,'child.pid');
 await fs.writeFile(script,`const fs=require('fs'),{spawn}=require('child_process');const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});fs.writeFileSync(${JSON.stringify(pidFile)},String(child.pid));console.error('PRIVATE CONTENT');setInterval(()=>{},1000);`);
 const controller=new AbortController();const task=runWorker(process.execPath,{}, {scriptPath:script,signal:controller.signal});
 for(let i=0;i<100;i++){try{await fs.stat(pidFile);break;}catch{await new Promise(r=>setTimeout(r,10));}}
 const pid=Number(await fs.readFile(pidFile,'utf8'));controller.abort();await assert.rejects(task,{name:'AbortError'});
 let alive=true;for(let i=0;i<100;i++){try{process.kill(pid,0);}catch{alive=false;break;}await new Promise(r=>setTimeout(r,10));}assert.equal(alive,false);
});
test('overlap remains unknown and incomplete ASR clocks cannot discard words',()=>{
 const {mergeCommunityTranscript}=require('../../src/helpers/dssaCommunityDiarization');
 const t={text:'Eg kjem i morgon.',totalSeconds:4,segments:[{text:'Eg kjem i morgon.',start:0,end:3}]};
 const diar={segments:[{start:0,end:3,speaker:'speaker_0'}],overlaps:[{start:1,end:2}]};
 assert.equal(mergeCommunityTranscript(diar,t)[0].speaker,undefined);
 assert.equal(mergeCommunityTranscript(diar,t)[0].speakerAssignment,'ambiguous');
 assert.throws(()=>mergeCommunityTranscript(diar,{...t,text:'Eg kjem i morgon. Me ventar.'}),/Incomplete/);
});
