const fs=require('node:fs');
const path=require('node:path');
const {spawn}=require('node:child_process');
const community=require('./dssaCommunityDiarization');
function registerCommunityHandlers({ipcMain,app,dialog,windowManager}) {
 const own=e=>e?.sender && [windowManager.controlPanelWindow?.webContents,windowManager.mainWindow?.webContents].includes(e.sender);
 const profile=app.getPath('userData'),root=path.join(profile,'community1');
 let setup;
 const status=()=>{const c=community.readCommunityConfig(profile);return {configured:!!c,modelReady:!!c&&fs.existsSync(path.join(c.modelPath,'dssa-community-manifest.json')),device:c?.device || 'cpu',alignmentReadyLanguages:['no','nn'].filter(l=>require('./nbWordAlignment').readAlignmentConfig(profile,l)),modelTermsUrl:'https://huggingface.co/pyannote/speaker-diarization-community-1'};};
 ipcMain.handle('nb-community-status',e=>own(e)?status():{configured:false,modelReady:false});
 ipcMain.handle('nb-community-configure',async(e,device)=>{
  if(!own(e)||!['cpu','mps'].includes(device))return {success:false};
  const selected=await dialog.showOpenDialog(windowManager.controlPanelWindow,{title:'Velg Python i Community-1-miljøet (3.11 eller nyere)',properties:['openFile','noResolveAliases']});
  if(selected.canceled)return {success:false,cancelled:true};
  const pythonPath=selected.filePaths[0];
  try {
   const result=await community.runWorker(pythonPath,{action:'probe'},{timeoutMs:120000});
   if(!result?.success||device==='mps'&&!result.mpsAvailable)throw Error('Python-miljøet eller valgt motor er ikke klart. Se Community-1-oppsettet.');
   await fs.promises.mkdir(root,{recursive:true,mode:0o700});
   let previous={};try{previous=JSON.parse(fs.readFileSync(path.join(profile,'dssa-community-engine.json'),'utf8'));}catch{}
   await fs.promises.writeFile(path.join(profile,'dssa-community-engine.json'),JSON.stringify({...previous,enabled:true,pythonPath,modelPath:path.join(root,'model'),device}),{mode:0o600});
   return {success:true,...status(),probe:result};
  }catch{return {success:false,error:'Miljøet trenger pyannote.audio 4.0.3, PyTorch 2.8 og Python 3.11+. Se oppsettsveiledningen.'};}
 });
 ipcMain.handle('nb-community-set-device',async(e,device)=>{
  if(!own(e)||!['cpu','mps'].includes(device))return {success:false};
  const c=community.readCommunityConfig(profile);if(!c)return {success:false};
  try{const probe=await community.runWorker(c.pythonPath,{action:'probe'},{timeoutMs:120000});if(device==='mps'&&!probe?.mpsAvailable)return {success:false,error:'MPS er ikke tilgjengelig i dette miljøet.'};const file=path.join(profile,'dssa-community-engine.json'),values=JSON.parse(fs.readFileSync(file,'utf8'));values.device=device;await fs.promises.writeFile(file,JSON.stringify(values),{mode:0o600});return {success:true,...status()};}catch{return {success:false,error:'Kunne ikke kontrollere den valgte prosessoren.'};}
 });
 ipcMain.handle('nb-alignment-configure',async(e,language)=>{
  if(!own(e)||!['no','nb','nn'].includes(language))return {success:false};
  const python=await dialog.showOpenDialog(windowManager.controlPanelWindow,{title:'Velg Python i det separate WhisperX-miljøet',properties:['openFile','noResolveAliases']});if(python.canceled)return {cancelled:true};
  const folder=await dialog.showOpenDialog(windowManager.controlPanelWindow,{title:'Velg kontrollert ordjusteringsmodell for valgt målform',properties:['openDirectory']});if(folder.canceled)return {cancelled:true};
  try{
   const modelPath=folder.filePaths[0],manifest=JSON.parse(fs.readFileSync(path.join(modelPath,'dssa-alignment-manifest.json'),'utf8'));
   const key=language==='nn'?'nn':'no',repo=key==='nn'?'NbAiLab/nb-wav2vec2-1b-nynorsk':'NbAiLab/nb-wav2vec2-1b-bokmaal-v2';
   if(manifest.repo!==repo)throw Error('Wrong written language');
   const checked=await community.runWorker(python.filePaths[0],{action:'probe'},{scriptPath:path.join(path.dirname(community.workerPath()),'alignment_worker.py'),timeoutMs:120000});if(!checked?.success)throw Error('Runtime unavailable');
   const file=path.join(profile,'dssa-community-engine.json'),c=JSON.parse(fs.readFileSync(file,'utf8'));c.alignmentPythonPath=python.filePaths[0];c.alignmentModels={...c.alignmentModels,[key]:modelPath};await fs.promises.writeFile(file,JSON.stringify(c),{mode:0o600});return {success:true,...status()};
  }catch{return {success:false,error:'Kontroller separat WhisperX-miljø og modell for riktig målform.'};}
 });
 ipcMain.handle('nb-community-download',async(e,token,termsAccepted)=>{
  if(!own(e)||termsAccepted!==true||setup)return {success:false,error:'Godkjenn modellvilkårene hos Hugging Face først.'};
  const c=community.readCommunityConfig(profile);if(!c)return {success:false,error:'Velg et ferdig Community-1 Python-miljø først.'};
  const controller=new AbortController();setup=controller;
  try {
   if(token)community.saveToken(token);
   const key=token || community.readToken();
   if(!key)return {success:false,error:'Oppgi en lesetilgangsnøkkel fra Hugging Face. Den lagres bare i macOS Keychain.'};
   await fs.promises.mkdir(c.modelPath,{recursive:true,mode:0o700});
   const r=await community.runWorker(c.pythonPath,{action:'download',modelPath:c.modelPath,token:key},{signal:controller.signal,timeoutMs:1800000});
   return {success:r?.success===true,...status()};
  }catch{return {success:false,error:'Modellen kunne ikke lastes ned. Kontroller godkjente vilkår og nøkkel hos Hugging Face. Ingen nøkkel vises i loggen.'};}
  finally{setup=null;}
 });
 ipcMain.handle('nb-community-cancel-setup',e=>{if(own(e))setup?.abort();return {success:true};});
 app.once('before-quit',()=>setup?.abort());
 return status;
}
module.exports={registerCommunityHandlers};
