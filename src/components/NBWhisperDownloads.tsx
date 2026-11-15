import {mergeWhisperDownloadProgress,selectedWhisperReady,whisperVerificationModel} from "../utils/nbWhisperDownloadStatus";
import React,{useEffect,useState} from 'react';

const copy={
 nb:{verifying:'Kontrollerer modellen …',corrupt:'Modellfilen er skadet eller ufullstendig. Trykk Last ned for å hente en ny, kontrollert kopi.',title:'NB-Whisper-modeller',hint:'Modellene følger ikke med installasjonsfilen. Last ned modellen du vil bruke. Etter nedlasting behandles lyden lokalt, uten konto eller opplasting.',full:'Large – full presisjon (standard)',q5:'Large – kvantisert q5_0 (mindre minne)',download:'Last ned',cancel:'Avbryt nedlasting',ready:'Klar',missing:'Ikke lastet ned',checking:'Kontrollerer …',failed:'Nedlastingen mislyktes. Kontroller nettforbindelsen og ledig diskplass, og prøv igjen.',cancelled:'Nedlastingen er avbrutt.',statusFailed:'Kunne ikke kontrollere modellene. Prøv igjen.',refresh:'Kontroller modeller'},
 nn:{verifying:'Kontrollerer modellen …',corrupt:'Modellfila er skadd eller ufullstendig. Trykk Last ned for å hente ein ny, kontrollert kopi.',title:'NB-Whisper-modellar',hint:'Modellane følgjer ikkje med installasjonsfila. Last ned modellen du vil bruke. Etter nedlasting vert lyden handsama lokalt, utan konto eller opplasting.',full:'Large – full presisjon (standard)',q5:'Large – kvantisert q5_0 (mindre minne)',download:'Last ned',cancel:'Avbryt nedlasting',ready:'Klar',missing:'Ikkje lasta ned',checking:'Kontrollerer …',failed:'Nedlastinga mislukkast. Kontroller nettsambandet og ledig diskplass, og prøv igjen.',cancelled:'Nedlastinga er avbroten.',statusFailed:'Kunne ikkje kontrollere modellane. Prøv igjen.',refresh:'Kontroller modellar'},
 en:{verifying:'Verifying model …',corrupt:'The model file is damaged or incomplete. Choose Download to get a new, verified copy.',title:'NB-Whisper models',hint:'Models are not included in the installer. Download the model you want to use. After downloading, audio is processed locally without an account or audio uploads.',full:'Large – full precision (default)',q5:'Large – quantized q5_0 (less memory)',download:'Download',cancel:'Cancel download',ready:'Ready',missing:'Not downloaded',checking:'Checking …',failed:'Download failed. Check your connection and free disk space, then try again.',cancelled:'Download cancelled.',statusFailed:'Could not check models. Try again.',refresh:'Check models'}
};
export default function NBWhisperDownloads({language,selected,onReady}:{language:string;selected:string;onReady?:(ready:boolean)=>void}){
 const api=window.electronAPI;
 const t=copy[language as keyof typeof copy]||copy.nb;
 const [models,setModels]=useState<any[]>([]);
 const [verifying,setVerifying]=useState('');
 const [pending,setPending]=useState('');const [message,setMessage]=useState('');
 const [checked,setChecked]=useState(false);
 const refresh=async()=>{try{const result=await api.listWhisperModels();if(!result.success)throw new Error();setModels(result.models);setChecked(true);}catch{setMessage('statusFailed');setChecked(false);}};
 useEffect(()=>{void refresh();const timer=setInterval(()=>void refresh(),2000);const remove=api.onWhisperDownloadProgress((_event:any,data:any)=>{
   if(!['nb-large','nb-large-full'].includes(data?.model))return;
   setVerifying(current=>whisperVerificationModel(current,data));
   if(data.type==='progress')setModels(current=>mergeWhisperDownloadProgress(current,data));
   else void refresh();
 });return()=>{clearInterval(timer);remove?.();};},[]);
 const ready=selected!==verifying&&selectedWhisperReady(models,selected,checked);
 useEffect(()=>onReady?.(ready),[ready,onReady]);
 const active=pending||models.find(m=>m.isDownloading)?.model;
 const download=async(id:string)=>{if(active)return;setPending(id);setMessage('');try{const result=await api.downloadWhisperModel(id);if(!result.success)setMessage(result.code==='DOWNLOAD_CANCELLED'?'cancelled':result.code==='DOWNLOAD_CORRUPTED'?'corrupt':'failed');}catch{setMessage('failed');}finally{setPending('');setVerifying('');await refresh();}};
 return <section aria-label={t.title} style={{marginTop:16}}><h3>{t.title}</h3><p style={{fontSize:15}}>{t.hint}</p>
 {['nb-large-full','nb-large'].map(id=>{const model=models.find(m=>m.model===id);const downloading=active===id;return <div key={id} style={{margin:'16px 0'}}><strong>{id==='nb-large-full'?t.full:t.q5}</strong>{' · '}{verifying===id?t.verifying:model?.verificationError==='DOWNLOAD_CORRUPTED'&&!downloading?t.corrupt:model?.downloaded&&!model?.isDownloading?t.ready:checked?t.missing:t.checking}{' '}
 {downloading?<><progress max={100} value={model?.downloadProgress||0} aria-label={t.download}/>{' '}{Math.floor(model?.downloadProgress||0)} %{' '}<button onClick={async()=>{try{await api.cancelWhisperDownload();}catch{setMessage('failed');}}}>{t.cancel}</button></>:<button disabled={!!active||!checked||!!model?.downloaded} onClick={()=>void download(id)}>{t.download}</button>}
 </div>;})}<button onClick={()=>void refresh()}>{t.refresh}</button>{message&&<p role="status">{t[message as keyof typeof t]}</p>}</section>;
}
