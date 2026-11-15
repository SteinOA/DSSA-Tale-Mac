const test=require('node:test'),assert=require('node:assert/strict');
const {loadAudioManager}=require('./harness/audioManager');
test('renderer cumulative snapshots retain header/pre-roll, offer once per boundary, seal before final, cancel after consumption',async t=>{
 const h=await loadAudioManager(t,{cachePrefix:'nb-precompute',settingsKey:'__nbPrecomputeSettings'});
 const calls=[],sent=[];Object.assign(h.window.electronAPI,{nbPrecomputeBegin:async o=>{calls.push('begin');return 'uuid';},nbPrecomputeOffer:async(token,a)=>{sent.push(Buffer.from(a).toString());calls.push('offer');},nbPrecomputeFinish:async()=>calls.push('finish'),nbPrecomputeCancel:async()=>calls.push('cancel')});
 const options={model:'nb-large-full',language:'no',initialPrompt:'DSSA'};
 const state={options,identity:JSON.stringify(options),offered:0,token:null,sealed:false,pending:null};
 const m=h.createManager({_nbPrecompute:state,nbPrecomputeOptions:()=>options,micRecovery:{started:false},_batchSegments:[],recordingStartTime:Date.now()-30000,_finalizeBatchRecording:async(b,ready)=>{const token=await ready;assert.equal(token,'uuid');calls.push('final');}});
 const parts=[new Blob(['header+preroll']),new Blob(['body'])];m.nbOfferPrecompute(parts,'audio/webm');m.nbOfferPrecompute(parts,'audio/webm');await state.pending;assert.deepEqual(sent,['header+prerollbody']);assert.equal(state.offered,1);
 parts.push(new Blob(['more']));m.recordingStartTime=Date.now()-58000;m.nbOfferPrecompute(parts,'audio/webm');await state.pending;assert.deepEqual(sent,['header+prerollbody','header+prerollbodymore']);await m.finalizeBatchRecording(new Blob(['final']));assert.deepEqual(calls,['begin','offer','offer','finish','final','cancel']);
});
test('renderer settings change and microphone recovery cancel optimization without discarding source chunks',async t=>{
 const h=await loadAudioManager(t,{cachePrefix:'nb-precompute-cancel',settingsKey:'__nbPrecomputeCancelSettings'});let cancelled=0;h.window.electronAPI.nbPrecomputeBegin=async()=>assert.fail('no new session');h.window.electronAPI.nbPrecomputeCancel=async()=>cancelled++;
 const options={model:'nb-large-full',language:'no',initialPrompt:null},parts=[new Blob(['header+speech'])];
 for(const changed of ['language','recovery']){
  const m=h.createManager({_nbPrecompute:{options,identity:JSON.stringify(options),offered:0,token:'old',sealed:false},nbPrecomputeOptions:()=>changed==='language'?{...options,language:'nn'}:options,micRecovery:{started:changed==='recovery'},_batchSegments:[],recordingStartTime:Date.now()-30000});m.nbOfferPrecompute(parts,'audio/webm');assert.equal(m._nbPrecompute,null);assert.equal(await parts[0].text(),'header+speech');
 }assert.equal(cancelled,2);
});
