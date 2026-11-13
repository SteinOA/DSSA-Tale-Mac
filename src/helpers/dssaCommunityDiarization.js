// Mac local adapter. Protocol/model provenance adapted from SteinOA Windows PR 1.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {spawn} = require('node:child_process');
const {createAbortError} = require('./abortError');
const MAX_SPEAKERS = 15;
function readCommunityConfig(profile) {
 try {
  const file=path.join(profile,'dssa-community-engine.json');
  if(fs.statSync(file).size>16384)return null;
  const c=JSON.parse(fs.readFileSync(file,'utf8'));
  if(c.enabled!==true || !['cpu','mps'].includes(c.device) || !path.isAbsolute(c.pythonPath) || !path.isAbsolute(c.modelPath) || !fs.statSync(c.pythonPath).isFile())return null;
  return {pythonPath:c.pythonPath,modelPath:c.modelPath,device:c.device};
 }catch{return null;}
}
function workerPath() {
 const bundled=path.join(process.resourcesPath || '', 'community1','community_worker.py');
 return fs.existsSync(bundled)?bundled:path.join(__dirname,'../../scripts/meeting-engine/community_worker.py');
}
function runWorker(python, request, {signal,onProgress=()=>{},scriptPath=workerPath(),timeoutMs=7200000,onSpawn=()=>{}}={}) {
 if(signal?.aborted)return Promise.reject(createAbortError('Community-1 cancelled'));
 return new Promise((resolve,reject)=>{
  const env={...process.env,HF_HUB_DISABLE_TELEMETRY:'1',HF_HUB_DISABLE_IMPLICIT_TOKEN:'1',PYANNOTE_METRICS_ENABLED:'0',PYTHONUNBUFFERED:'1',PYTHONNOUSERSITE:'1',PYTORCH_ENABLE_MPS_FALLBACK:'0'};
  // A model token is passed only over stdin for an explicit download.
  for(const key of Object.keys(env))if(/TOKEN|API_KEY|SECRET|PASSWORD/i.test(key))delete env[key];
  env.HF_HUB_OFFLINE=request.action==='download'?'0':'1';
  const child=spawn(python,[scriptPath],{detached:true,stdio:['pipe','pipe','ignore'],env});
  let failure,result,buffer='',seen=0,killTimer;
  const kill=()=>{try{process.kill(-child.pid,'SIGKILL');}catch{}};
  const stop=error=>{if(failure)return;failure=error;try{process.kill(-child.pid,'SIGTERM');}catch{}killTimer=setTimeout(kill,700);};
  const cancel=()=>stop(createAbortError('Community-1 cancelled'));
  const timer=setTimeout(()=>stop(Error('Community-1 timeout; transcript retained')),timeoutMs);
  signal?.addEventListener('abort',cancel,{once:true});
  child.once('error',()=>{failure=Error('Community-1 Python could not start');});
  child.stdin.on('error',()=>{});
  child.stdout.on('data',data=>{
   seen+=data.length;
   if(seen>8*1024*1024){stop(Error('Invalid Community-1 progress stream'));return;}
   buffer+=data.toString();
   let newline;
   while((newline=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,newline);buffer=buffer.slice(newline+1);try{const p=JSON.parse(line);if(p.type==='result')result=p.result;else if(p.type==='progress')onProgress(p);else if(p.type==='error')failure=Error('Community-1 failed ('+String(p.code).replace(/[^a-zA-Z]/g,'')+'); transcript retained');}catch{}}
  });
  child.once('close',code=>{
   clearTimeout(timer);clearTimeout(killTimer);signal?.removeEventListener('abort',cancel);
   // Kill any descendants even when their parent exits before the deadline.
   if(failure||signal?.aborted)kill();
   if(signal?.aborted)reject(createAbortError('Community-1 cancelled'));
   else if(failure)reject(failure);else if(code!==0)reject(Error('Community-1 failed; transcript retained'));else resolve(result);
  });
  onSpawn(child);
  child.stdin.end(JSON.stringify(request));
  if(signal?.aborted)cancel();
 });
}
function validateCommunityResult(result,max=MAX_SPEAKERS) {
 if(result?.success!==true||result.engine!=='pyannote-community-1'||!Number.isFinite(result.durationSeconds)||result.durationSeconds<=0||!Array.isArray(result.segments))throw Error('Invalid Community-1 result');
 const labels=new Set();
 for(const s of result.segments){if(!Number.isFinite(s.start)||!Number.isFinite(s.end)||s.start<0||s.end<=s.start||s.end>result.durationSeconds+0.25||!/^speaker_\d+$/.test(s.speaker))throw Error('Invalid Community-1 timestamps');labels.add(s.speaker);}
 if(labels.size>max)throw Error('Community-1 speaker cap exceeded');
 return result;
}
async function runCommunityDiarization(config,audioPath,{signal,maxSpeakers=MAX_SPEAKERS,onProgress,scriptPath}={}) {
 if(!Number.isInteger(maxSpeakers)||maxSpeakers<1||maxSpeakers>15)throw Error('Invalid speaker cap');
 const folder=await fs.promises.mkdtemp(path.join(os.tmpdir(),'dssa-community-'));
 await fs.promises.chmod(folder,0o700);
 const resultPath=path.join(folder,'result.json');
 try {
  await runWorker(config.pythonPath,{action:'diarize',audioPath,modelPath:config.modelPath,device:config.device,maxSpeakers,resultPath},{signal,onProgress,scriptPath});
  if(fs.statSync(resultPath).size>32*1024*1024)throw Error('Community-1 output too large');
  return validateCommunityResult(JSON.parse(await fs.promises.readFile(resultPath,'utf8')),maxSpeakers);
 } finally {await fs.promises.rm(folder,{recursive:true,force:true});}
}
function mergeCommunityTranscript(diar,transcript) {
 const normalize=t=>t.replace(/\s+/g,' ').trim();
 if(!transcript.segments?.length || normalize(transcript.segments.map(p=>p.text).join(' '))!==normalize(transcript.text))throw Error('Incomplete ASR timestamps; transcript retained');
 return require('./speakerMergeTimed').mergeTimedSpeakers(diar.segments,transcript.segments,transcript.totalSeconds).map(p=>(diar.overlaps || []).some(o=>o.start<p.end&&o.end>p.start)?{text:p.text,start:p.start,end:p.end,speakerAssignment:'ambiguous'}:p);
}
function tokenEntry(){const {Entry}=require('@napi-rs/keyring');return new Entry('DSSA Tale Community-1','huggingface');}
function saveToken(token){if(typeof token!=='string'||!/^hf_[A-Za-z0-9]{10,300}$/.test(token))throw Error('Invalid Hugging Face token');tokenEntry().setPassword(token);}
function readToken(){try{return tokenEntry().getPassword();}catch{return null;}}
module.exports={readCommunityConfig,workerPath,runWorker,runCommunityDiarization,validateCommunityResult,saveToken,readToken,mergeCommunityTranscript,MAX_SPEAKERS};
