const fs=require('node:fs');
const path=require('node:path');
const {fileHash,importAudioFile}=require('./nbFileImport');
function registerNbFileImportHandlers({ipcMain,app,dialog,windowManager,whisperManager,resolveAllowedAudioPath,getVad=()=>({}),getDictionaryPrompt=()=>null,getLanguage=()=>"nb",createStore,importFile=importAudioFile}) {
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
  const stop=()=>controller.abort();owner.once('destroyed',stop);jobs.set(id,{owner,controller});
  try {
   if(typeof file!=='string'||!['no','nb','nn','en'].includes(options.language)||!['nb-large-full','nb-large'].includes(options.model))throw Error('INVALID_IMPORT_REQUEST');
   const real=resolveAllowedAudioPath(file);
   if(!real || !fs.statSync(real).isFile())throw Error('AUDIO_PATH_NOT_ALLOWED');
   const settings={model:options.model,language:options.language==='nb'?'no':options.language,...getVad(),initialPrompt:getDictionaryPrompt() || null};
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
   return await importFile(real,settings,{modelIdentity:identity,checkpointStore:getStore(),historyAllowed:()=>policy.synced&&policy.enabled,signal:controller.signal,tempRoot:app.getPath('temp'),ffmpegPath:require('./ffmpegUtils').getFFmpegPath(),onProgress:p=>notify(owner,id,p),decode:(wav,opts)=>whisperManager.transcribeNormalizedWhisperWindow(wav,opts)});
  } catch(error) {
   if(controller.signal.aborted||error.name==='AbortError')return {success:false,cancelled:true};
   const key=error.message==='INVALID_IMPORT_REQUEST'?'importInvalid':error.message==='AUDIO_PATH_NOT_ALLOWED'?'importPath':/^Audio conversion|^Invalid normalized|^Normalized WAV|^Source changed/.test(error.message)?'importConversion':'importFailed';
   return {success:false,error:labels()[key],code:error.message==='INVALID_IMPORT_REQUEST'||error.message==='AUDIO_PATH_NOT_ALLOWED'?error.message:'IMPORT_FAILED'};
  } finally {jobs.delete(id);owner.removeListener('destroyed',stop);}
 });
 ipcMain.handle('nb-cancel-audio-import',(event,id)=>{
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
