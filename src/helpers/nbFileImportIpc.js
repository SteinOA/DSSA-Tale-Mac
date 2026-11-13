const fs=require('node:fs');
const path=require('node:path');
const {fileHash,importAudioFile}=require('./nbFileImport');
function registerNbFileImportHandlers({ipcMain,app,dialog,windowManager,whisperManager,resolveAllowedAudioPath,getVad=()=>({}),getDictionaryPrompt=()=>null,getLanguage=()=>"nb",createStore,importFile=importAudioFile,uploadCancelRegistry}) {
 require('./nbCommunityIpc').registerCommunityHandlers({ipcMain,app,dialog,windowManager});
 const jobs=new Map(),modelHashes=new Map();
 let policy={synced:false,enabled:false,retentionDays:0};
 let store;
 const getStore=()=>store ||= (createStore || require('./nbFileCheckpoint').createStore)({root:path.join(app.getPath('userData'),'import-checkpoints'),getPolicy:()=>({...policy})});
 const own=event=>event?.sender && (event.sender===windowManager.controlPanelWindow?.webContents || event.sender===windowManager.mainWindow?.webContents);
 const labels=()=>require('./nbDialogLabels').getNbDialogLabels(getLanguage());
 const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(id);
 const notify=(owner,requestId,p)=>{if(!owner.isDestroyed?.())owner.send('nb-audio-import-progress',{...p,requestId});};
 ipcMain.handle('nb-set-import-retention',async(event,values)=>{
  if(!own(event))return {success:false};
  if(values?.synced===false){policy={...policy,synced:false};return {success:true};}
  if(typeof values?.enabled!=='boolean'||!Number.isSafeInteger(values.retentionDays)||values.retentionDays<0)return {success:false};
  policy={synced:true,enabled:values.enabled,retentionDays:values.retentionDays};
  if(!policy.enabled)await getStore().purge();
  else if(getStore().sweep)await getStore().sweep();
  return {success:true};
 });
 ipcMain.handle('nb-import-audio-file',async(event,file,options={})=>{
  if(!own(event)||!validId(options?.requestId))return {success:false,error:labels().importInvalid,code:'INVALID_IMPORT_REQUEST'};
  if(jobs.size)return {success:false,error:labels().importBusy,code:'IMPORT_ALREADY_RUNNING'};
  const controller=new AbortController(),owner=event.sender,id=options.requestId;
  const shared=uploadCancelRegistry?.register(id);
  const stop=()=>controller.abort();shared?.signal?.addEventListener('abort',stop,{once:true});if(shared?.signal?.aborted)stop();owner.once('destroyed',stop);jobs.set(id,{owner,controller});
  try {
   if(typeof file!=='string'||!['no','nb','nn','en'].includes(options.language)||!['nb-large-full','nb-large'].includes(options.model))throw Error('INVALID_IMPORT_REQUEST');
   const real=resolveAllowedAudioPath(file);
   if(!real || !fs.statSync(real).isFile())throw Error('AUDIO_PATH_NOT_ALLOWED');
   const engine=options.speakerEngine;
   if(engine && !['community-1','sherpa-onnx'].includes(engine))throw Error('INVALID_IMPORT_REQUEST');
   if(options.wordAlignment && !['native','whisperx'].includes(options.wordAlignment))throw Error('INVALID_IMPORT_REQUEST');
   const channelMode=options.channelMode || 'inspect';
   if(!(/^(?:inspect|mix|channel:(?:[0-9]|[12][0-9]|3[01]))$/.test(channelMode)))throw Error('INVALID_IMPORT_REQUEST');
   let inspection;
   if(engine){
    notify(owner,id,{phase:'converting',step:'channels'});
    inspection=await require('./nbChannelInspection').inspectChannels(real,{ffmpegPath:require('./ffmpegUtils').getFFmpegPath(),signal:controller.signal});
    if(inspection.requiresChoice && channelMode==='inspect')return {success:false,code:'CHANNEL_CHOICE_REQUIRED',channelInspection:inspection,error:'Originalen har flere eller ukjente lydkanaler. Velg kanal eller uttrykkelig nedmiksing før talerfordeling.'};
   }
   const settings={timestamps:!!engine,...(channelMode.startsWith('channel:')?{channel:Number(channelMode.split(':')[1])}:{}),model:options.model,language:options.language==='nb'?'no':options.language,...getVad(),initialPrompt:getDictionaryPrompt() || null};
   const modelPath=whisperManager.getModelPath(settings.model),stat=await fs.promises.stat(modelPath);
   const modelKey=[modelPath,stat.dev,stat.ino,stat.size,stat.mtimeMs,stat.ctimeMs].join('\0');
   if(!modelHashes.has(modelKey)) {
    const sha256=await fileHash(modelPath,controller.signal);
    if(modelHashes.size>=4)modelHashes.clear();
    modelHashes.set(modelKey,sha256);
   }
   const decoder={...whisperManager.nbPrecomputeIdentity(settings).decoder,appVersion:app.getVersion?.() || 'development',platform:process.platform,arch:process.arch};
   const enginePath=whisperManager.serverManager?.getServerBinaryPath();
   if(enginePath) {
    const engineStat=await fs.promises.stat(enginePath),engineKey=[enginePath,engineStat.size,engineStat.mtimeMs,engineStat.ctimeMs].join('\0');
    if(!modelHashes.has(engineKey)){if(modelHashes.size>=4)modelHashes.clear();modelHashes.set(engineKey,await fileHash(enginePath,controller.signal));}
    decoder.engineSha256=modelHashes.get(engineKey);
   }
   const identity={model:{sha256:modelHashes.get(modelKey) || await fileHash(modelPath,controller.signal),stat:{size:stat.size,mtimeMs:stat.mtimeMs,ino:stat.ino}},decoder};
   let result=await importFile(real,settings,{modelIdentity:identity,checkpointStore:getStore(),historyAllowed:()=>policy.synced&&policy.enabled,signal:controller.signal,tempRoot:app.getPath('temp'),ffmpegPath:require('./ffmpegUtils').getFFmpegPath(),onProgress:p=>notify(owner,id,p),decode:(wav,opts)=>whisperManager.transcribeNormalizedWhisperWindow(wav,opts)});
   if(!engine || !result.success || !result.text)return result;
   let transcript=result;let alignmentWarning="";
   const progress=p=>notify(owner,id,{phase:'diarizing',totalSeconds:transcript.totalSeconds,...p});
   progress({completedSeconds:0,step:'loading',fraction:null});
   try {
    const community=require('./dssaCommunityDiarization');
    const config=community.readCommunityConfig(app.getPath('userData'));
    if(engine==='community-1'&&!config)throw Error('Community-1 er ikke satt opp. Transkripsjonen er beholdt.');
    const temp=await fs.promises.mkdtemp(path.join(app.getPath('temp'),'dssa-speaker-import-'));
    try {
     const wav=path.join(temp,'analysis.wav');
     await require('./nbFileImport').convertToPcm(real,wav,{signal:controller.signal,ffmpegPath:require('./ffmpegUtils').getFFmpegPath(),channel:settings.channel});
     if(options.wordAlignment==='whisperx'){
      progress({step:'word_alignment',completedSeconds:0,fraction:null});
      try{transcript=await require('./nbWordAlignment').alignWords(app.getPath('userData'),wav,transcript,settings.language,{signal:controller.signal});}
      catch(error){if(controller.signal.aborted)throw error;alignmentWarning='Presis ordjustering mislyktes. Standardtider og originaltekst er beholdt.';}
     }
     progress({step:'loading',completedSeconds:0,fraction:null});
     let diar;
     if(engine==='community-1')diar=await community.runCommunityDiarization(config,wav,{signal:controller.signal,maxSpeakers:15,onProgress:p=>progress({step:p.step,fraction:p.fraction,completedSeconds:p.processedSeconds,stageElapsedSeconds:p.elapsedSeconds})});
     else {
      const Manager=require('./diarization');const manager=new Manager();
      if(!manager.isAvailable())throw Error('Sherpa-onnx-talermodellene mangler.');
      diar={segments:await manager.diarize(wav,{numSpeakers:-1,signal:controller.signal}),overlaps:[]};
     }
     if(controller.signal.aborted)return {...transcript,success:false,cancelled:true};
     if(!transcript.segments?.length)return {...transcript,diarizationWarning:true,warning:'Tidsstempler mangler. Teksten er beholdt uten gjettet talerfordeling.'};
     const parts=community.mergeCommunityTranscript(diar,transcript);
     const assigned=parts.filter(p=>p.speaker).length;
     return {...transcript,segments:parts,diarized:assigned>0,diarizationWarning:assigned<parts.length || !!alignmentWarning,...(alignmentWarning?{warning:alignmentWarning}:{}),diarizationSummary:{engine,assigned,total:parts.length,detectedGroups:new Set(diar.segments.map(p=>p.speaker)).size,timings:diar.timings,peakRssBytes:diar.peakRssBytes},channelInspection:inspection};
    }finally{await fs.promises.rm(temp,{recursive:true,force:true});}
   }catch(error){
    if(controller.signal.aborted)return {...transcript,success:false,cancelled:true};
    return {...transcript,diarizationWarning:true,warning:'Talerfordelingen mislyktes. Brukbar transkripsjon er beholdt; ingen talere er gjettet.'};
   }

  } catch(error) {
   if(controller.signal.aborted||error.name==='AbortError')return {success:false,cancelled:true};
   const key=error.message==='INVALID_IMPORT_REQUEST'?'importInvalid':error.message==='AUDIO_PATH_NOT_ALLOWED'?'importPath':/^Audio conversion|^Invalid normalized|^Normalized WAV|^Source changed/.test(error.message)?'importConversion':'importFailed';
   return {success:false,error:labels()[key],code:error.message==='INVALID_IMPORT_REQUEST'||error.message==='AUDIO_PATH_NOT_ALLOWED'?error.message:'IMPORT_FAILED'};
  } finally {jobs.delete(id);owner.removeListener('destroyed',stop);shared?.signal?.removeEventListener('abort',stop);shared?.release();}
 });
 ipcMain.handle('nb-cancel-audio-import',async(event,id)=>{
  const job=jobs.get(id);if(!own(event)||job?.owner!==event.sender)return {success:false};
  job.controller.abort();return {success:true};
 });
 ipcMain.handle('nb-save-audio-from-path',async(event,file,name)=>{
  if(!own(event)||typeof file!=='string')return {success:false,error:labels().importPath,code:'AUDIO_PATH_NOT_ALLOWED'};
  const real=resolveAllowedAudioPath(file);if(!real||!fs.statSync(real).isFile())return {success:false,error:labels().importPath,code:'AUDIO_PATH_NOT_ALLOWED'};
  const labels=require('./nbDialogLabels').getNbDialogLabels(require('./i18nMain').i18nMain.language);
  const result=await dialog.showSaveDialog(windowManager.controlPanelWindow,{title:labels.audioTitle,defaultPath:path.join(app.getPath('documents'),path.basename(typeof name==='string'?name:real))});
  if(result.canceled||!result.filePath)return {canceled:true};
  if(path.resolve(result.filePath)===real || (fs.existsSync(result.filePath)&&fs.realpathSync(result.filePath)===real))return {success:true};
  await fs.promises.copyFile(real,result.filePath);return {success:true};
 });
 app.once('before-quit',()=>{for(const job of jobs.values())job.controller.abort();});
 return {getPolicy:()=>({...policy})};
}
module.exports={registerNbFileImportHandlers};
