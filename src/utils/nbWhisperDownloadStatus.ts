export const NB_WHISPER_MODELS=['nb-large-full','nb-large'] as const;
export function mergeWhisperDownloadProgress(models:any[],data:any){
 if(data?.type!=='progress'||!NB_WHISPER_MODELS.includes(data.model))return models;
 const percentage=typeof data.percentage==='number'&&Number.isFinite(data.percentage)?Math.max(0,Math.min(100,data.percentage)):0;
 return [...models.filter(m=>m.model!==data.model),{model:data.model,isDownloading:true,downloaded:false,downloadProgress:percentage,downloadedBytes:data.downloaded_bytes,totalBytes:data.total_bytes}];
}
export function selectedWhisperReady(models:any[],selected:string,checked:boolean){
 return checked&&NB_WHISPER_MODELS.includes(selected as any)&&models.some(m=>m.model===selected&&m.downloaded===true&&!m.isDownloading);
}

// Verification remains active across status polls until this model finishes.
export function whisperVerificationModel(current:string,data:any):string {
 if(!NB_WHISPER_MODELS.includes(data?.model))return current;
 if(data.type==='verifying')return data.model;
 if(['complete','error','cancelled','progress'].includes(data.type)&&current===data.model)return '';
 return current;
}
