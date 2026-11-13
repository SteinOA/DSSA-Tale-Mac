const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {runWorker,workerPath}=require('./dssaCommunityDiarization');
const languageKey=language=>language==='nn'?'nn':'no';
function readAlignmentConfig(profile,language){
 try{const c=JSON.parse(fs.readFileSync(path.join(profile,'dssa-community-engine.json'),'utf8'));const pythonPath=c.alignmentPythonPath,modelPath=c.alignmentModels?.[languageKey(language)];if(!path.isAbsolute(pythonPath)||!path.isAbsolute(modelPath)||!fs.statSync(pythonPath).isFile()||!fs.statSync(path.join(modelPath,'dssa-alignment-manifest.json')).isFile())return null;return {pythonPath,modelPath};}catch{return null;}
}
async function alignWords(profile,wav,transcript,language,{signal}={}) {
 const config=readAlignmentConfig(profile,language);if(!config)throw Error('No alignment model for selected written language');
 const folder=await fs.promises.mkdtemp(path.join(os.tmpdir(),'dssa-align-'));const resultPath=path.join(folder,'result.json');
 try{
  await runWorker(config.pythonPath,{action:'align',audioPath:wav,modelPath:config.modelPath,text:transcript.text,segments:transcript.segments,language:languageKey(language),resultPath},{signal,scriptPath:path.join(path.dirname(workerPath()),'alignment_worker.py')});
  if(fs.statSync(resultPath).size>32*1024*1024)throw Error('Alignment result too large');
  const result=JSON.parse(await fs.promises.readFile(resultPath,'utf8'));
  const normalized=t=>t.replace(/\s+/g,' ').trim();
  if(result.success!==true||!Array.isArray(result.segments)||normalized(result.segments.map(s=>s.text).join(' '))!==normalized(transcript.text))throw Error('Alignment changed text');
  return {...transcript,segments:result.segments,alignmentEvidence:{engine:'whisperx',device:result.device,timings:result.timings,peakRssBytes:result.peakRssBytes}};
 }finally{await fs.promises.rm(folder,{recursive:true,force:true});}
}
module.exports={readAlignmentConfig,alignWords,languageKey};
