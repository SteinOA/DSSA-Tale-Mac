const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),{EventEmitter}=require('node:events');
const {registerNbFileImportHandlers}=require('../../src/helpers/nbFileImportIpc');
async function harness(t,{importFile}={}) {
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'nb-ipc-import-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));const model=path.join(root,'model.bin'),source=path.join(root,'voice.wav');await fs.writeFile(model,'model');await fs.writeFile(source,'source');
 const owner=new EventEmitter(),foreign=new EventEmitter(),app=new EventEmitter(),handlers={},events=[];owner.send=(...x)=>events.push(x);
 let policyRead,purges=0,invocations=0;
 app.getPath=()=>root;
 const register=registerNbFileImportHandlers({ipcMain:{handle:(n,f)=>handlers[n]=f},app,dialog:{},windowManager:{controlPanelWindow:{webContents:owner}},whisperManager:{getModelPath:()=>model,nbPrecomputeIdentity:()=>({decoder:{language:'nn',prompt:'Keep original'}})},resolveAllowedAudioPath:x=>x===source?source:null,getVad:()=>({vadEnabled:false}),getDictionaryPrompt:()=>"OpenWhispr, treh",createStore:({getPolicy})=>{policyRead=getPolicy;return {purge:async()=>{purges++;},open:async()=>({})};},importFile:async(...args)=>{invocations++;return importFile ? importFile(...args) : {success:true,text:'Eg kjem.'};}});
 return {root,model,source,owner,foreign,app,handlers,events,register,getPolicy:()=>policyRead?.(),purges:()=>purges,invocations:()=>invocations};
}
const opts={model:'nb-large-full',language:'nn',requestId:'request-1'};
test('retention is initially disabled, owner sync is required, and switching history off purges',async t=>{
 const h=await harness(t);assert.deepEqual(h.register.getPolicy(),{synced:false,enabled:false,retentionDays:0});
 assert.deepEqual(await h.handlers['nb-set-import-retention']({sender:h.foreign},{enabled:true,retentionDays:7}),{success:false});
 await h.handlers['nb-set-import-retention']({sender:h.owner},{enabled:true,retentionDays:1});assert.equal(h.getPolicy().enabled,true);
 await h.handlers['nb-set-import-retention']({sender:h.owner},{synced:false,enabled:false,retentionDays:1});assert.equal(h.getPolicy().synced,false);assert.equal(h.purges(),0);
 await h.handlers['nb-set-import-retention']({sender:h.owner},{enabled:false,retentionDays:0});assert.equal(h.getPolicy().enabled,false);assert.equal(h.purges(),1);
});
test('imports validate owner, request, path and model; progress remains scoped and identity includes model hash',async t=>{
 let captured;const h=await harness(t,{importFile:async(file,settings,context)=>{captured={file,settings,context};context.onProgress({phase:'transcribing',completedChunks:1,totalChunks:3});return {success:true,text:'Eg kjem.'};}});
 for(const [sender,file,o] of [[h.foreign,h.source,opts],[h.owner,h.source,null],[h.owner,h.source,{...opts,model:'tiny.en'}],[h.owner,'/not-approved',opts]])assert.equal((await h.handlers['nb-import-audio-file']({sender},file,o)).success,false);
 const result=await h.handlers['nb-import-audio-file']({sender:h.owner},h.source,opts);assert.equal(result.text,'Eg kjem.');assert.equal(captured.settings.language,'nn');assert.equal(captured.settings.initialPrompt,'OpenWhispr, treh');assert.equal(captured.context.modelIdentity.model.sha256.length,64);assert.equal(captured.context.historyAllowed(),false);assert.equal(h.events.length,1);assert.equal(h.events[0][1].requestId,opts.requestId);assert.equal(h.owner.listenerCount('destroyed'),0);
});
test('foreign cancel cannot stop an active job; owned cancel and window loss abort without leaked jobs',async t=>{
 let started;const ready=new Promise(r=>started=r);
 const h=await harness(t,{importFile:async(_f,_s,{signal})=>{started();return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Object.assign(Error('stopped'),{name:'AbortError'})),{once:true}));}});
 const running=h.handlers['nb-import-audio-file']({sender:h.owner},h.source,opts);await ready;
 assert.equal((await h.handlers['nb-cancel-audio-import']({sender:h.foreign},opts.requestId)).success,false);
 assert.equal((await h.handlers['nb-import-audio-file']({sender:h.owner},h.source,{...opts,requestId:'second'})).code,'IMPORT_ALREADY_RUNNING');
 assert.equal((await h.handlers['nb-cancel-audio-import']({sender:h.owner},opts.requestId)).success,true);assert.equal((await running).cancelled,true);assert.equal(h.owner.listenerCount('destroyed'),0);
 const another=h.handlers['nb-import-audio-file']({sender:h.owner},h.source,{...opts,requestId:'third'});for(let i=0;i<20&&h.invocations()<2;i++)await new Promise(r=>setTimeout(r,5));h.owner.emit('destroyed');assert.equal((await another).cancelled,true);
});
