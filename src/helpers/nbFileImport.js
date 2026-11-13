// Bounded, disk-backed local import. No complete source/PCM buffer in memory.
const fs = require('node:fs');
const fsp = fs.promises;
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const {spawn} = require('node:child_process');
const {createAbortError} = require('./abortError');
const FORMAT = Object.freeze({sampleRate:16000,channels:1,sampleBytes:2,windowSamples:448000,stepSamples:440000});
function abort(signal) { if(signal?.aborted) throw createAbortError('Import cancelled'); }
async function fileHash(file, signal) {
 const hash=crypto.createHash('sha256');
 const stream=fs.createReadStream(file,{signal});
 for await (const data of stream) {abort(signal);hash.update(data);}
 return hash.digest('hex');
}
function wav(pcm) {
 const h=Buffer.alloc(44);h.write('RIFF');h.writeUInt32LE(pcm.length+36,4);h.write('WAVEfmt ',8);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(1,22);h.writeUInt32LE(16000,24);h.writeUInt32LE(32000,28);h.writeUInt16LE(2,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(pcm.length,40);return Buffer.concat([h,pcm]);
}
function mergeText(left,right) {
 if(!left)return right.trim();if(!right)return left;
 const a=left.trim().split(/\s+/),b=right.trim().split(/\s+/);
 const norm=x=>x.normalize('NFC').toLocaleLowerCase('und').replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,'');
 // Require at least three exact words: ambiguous one-word repeats remain intact.
 let overlap=0;for(let n=3;n<=Math.min(24,a.length,b.length);n++)if(a.slice(-n).every((x,i)=>norm(x)&&norm(x)===norm(b[i])))overlap=n;
 return left.trim()+(b.length>overlap?' '+b.slice(overlap).join(' '):'');
}
async function wavDataOnDisk(file) {
 const handle=await fsp.open(file,'r');
 try {
  const stat=await handle.stat(),head=Buffer.alloc(12);
  if((await handle.read(head,0,12,0)).bytesRead!==12 || !['RIFF','RF64'].includes(head.toString('ascii',0,4)) || head.toString('ascii',8)!=='WAVE')throw Error('Invalid normalized WAV');
  let offset=12,format=false,rf64Bytes;
  for(let chunk=0;chunk<128&&offset+8<=stat.size;chunk++) {
   const header=Buffer.alloc(8);if((await handle.read(header,0,8,offset)).bytesRead!==8)break;
   const tag=header.toString('ascii',0,4),size=header.readUInt32LE(4),data=offset+8;
   if(tag==='fmt ') {
    if(size<16||data+size>stat.size)throw Error('Invalid normalized WAV format');
    const fmt=Buffer.alloc(16);await handle.read(fmt,0,16,data);
    format=fmt.readUInt16LE(0)===1&&fmt.readUInt16LE(2)===1&&fmt.readUInt32LE(4)===16000&&fmt.readUInt16LE(14)===16;
   }
   if(tag==='ds64'&&size>=28) {const ds=Buffer.alloc(28);await handle.read(ds,0,28,data);rf64Bytes=Number(ds.readBigUInt64LE(8));}
   if(tag==='data') {
    const bytes=size===0xffffffff ? rf64Bytes ?? stat.size-data : size;
    if(!format||!Number.isSafeInteger(bytes)||bytes<0||bytes%2||data+bytes>stat.size)throw Error('Invalid normalized audio');
    return {offset:data,bytes};
   }
   offset=data+size+(size%2);
  }
  throw Error('Normalized WAV has no PCM data');
 } finally {await handle.close();}
}
async function convertToPcm(input, output, {signal,ffmpegPath,channel}={}) {
 abort(signal);
 if(!ffmpegPath)throw new Error('Bundled FFmpeg unavailable');
 await fsp.writeFile(output,'',{mode:0o600,flag:'wx'});
 await new Promise((resolve,reject)=>{
  const child=spawn(ffmpegPath,['-nostdin','-v','error','-protocol_whitelist','file,pipe','-i',input,'-vn',...(Number.isInteger(channel)?['-af',`pan=mono|c0=c${channel}`]:[]),'-ac','1','-ar','16000','-c:a','pcm_s16le','-rf64','auto','-f','wav','-y',output],{detached:true,stdio:['ignore','ignore','pipe']});
  let error='';let spawnError;
  child.stderr.on('data',data=>{error=(error+data.toString()).slice(-8192);});
  const cancel=()=>{try{process.kill(-child.pid,'SIGKILL');}catch{}};signal?.addEventListener('abort',cancel,{once:true});
  child.once('error',e=>{spawnError=e;});
  child.once('close',code=>{signal?.removeEventListener('abort',cancel);if(signal?.aborted)reject(createAbortError('Import cancelled'));else if(spawnError)reject(spawnError);else if(code!==0)reject(new Error('Audio conversion failed: '+error));else resolve();});
  if(signal?.aborted)cancel();
 });
}
async function importAudioFile(file, options, {decode,modelIdentity,checkpointStore,historyAllowed=()=>true,onProgress=()=>{},signal,tempRoot=os.tmpdir(),convert=convertToPcm,ffmpegPath,hash=fileHash}={}) {
 abort(signal);
 if(typeof decode!=='function')throw new TypeError('Decoder required');
 const real=await fsp.realpath(file),stat=await fsp.stat(real);
 if(!stat.isFile())throw new Error('Audio source must be a regular file');
 const stepSamples=options.timestamps ? FORMAT.windowSamples : FORMAT.stepSamples;
 const temp=await fsp.mkdtemp(path.join(tempRoot,'dssa-nb-import-'));
 const notify=event=>{try{onProgress(event);}catch{}};
 let handle;let checkpoint;
 try {
  notify({phase:'converting'});
  const sourceSha256=await hash(real,signal);abort(signal);
  const pcmPath=path.join(temp,'audio.wav');await convert(real,pcmPath,{signal,ffmpegPath,channel:options.channel});abort(signal);
  const pcmInfo=await wavDataOnDisk(pcmPath);
  const samples=pcmInfo.bytes/2,totalSeconds=samples/FORMAT.sampleRate;
  const totalChunks=samples ? Math.max(1,Math.ceil(Math.max(0,samples-FORMAT.windowSamples)/stepSamples)+1) : 0;
  // Source must still match the fingerprint after conversion. Do not checkpoint
  // results against a file edited while it was being read by the converter.
  const after=await fsp.stat(real);
  if(after.size!==stat.size||after.mtimeMs!==stat.mtimeMs||after.ino!==stat.ino)throw new Error('Source changed during import');
  const identity={version:1,sourceSha256,sourceBytes:stat.size,model:modelIdentity?.model,language:options.language,decoder:{...modelIdentity?.decoder,timestamps:options.timestamps===true,nativeWordTimes:options.timestamps===true,channel:options.channel ?? null},pcm:{sampleRate:16000,channels:1,bitsPerSample:16,normalizedSamples:samples},chunks:{windowSamples:FORMAT.windowSamples,stepSamples:stepSamples}};
  if(checkpointStore)try{checkpoint=await checkpointStore.open(identity);}catch{}
  let prefix=[];if(checkpoint)try{prefix=await checkpoint.readPrefix();}catch{}
  if(!Array.isArray(prefix)||prefix.length>totalChunks)prefix=[];
  let text='',completedChunks=0,resumedChunks=0;const segments=[];
  const progress=()=>notify({phase:'transcribing',completedChunks,totalChunks,completedSeconds:Math.min(totalSeconds,completedChunks ? ((completedChunks-1)*stepSamples+FORMAT.windowSamples)/FORMAT.sampleRate : 0),totalSeconds,resumedChunks});
  handle=await fsp.open(pcmPath,'r');
  progress();
  for(let index=0;index<totalChunks;index++) {
   abort(signal);if(!historyAllowed())prefix=[];let result=prefix[index];
   const reused=!!result&&typeof result.text==='string';
   if(!reused) {
    const offset=index*stepSamples*2,length=Math.min(FORMAT.windowSamples*2,pcmInfo.bytes-offset);
    const buffer=Buffer.alloc(length);let read=0;
    while(read<length){const part=await handle.read(buffer,read,length-read,pcmInfo.offset+offset+read);if(!part.bytesRead)throw new Error('Normalized audio truncated');read+=part.bytesRead;}
    result=buffer.every(byte=>byte===0) ? {text:''} : await decode(wav(buffer),{...options,signal,priority:'background'});abort(signal);
    if(!result||typeof result.text!=='string'||result.error||result.success===false)throw new Error(result?.error||'Local transcription failed');
    result={...result,text:result.text.replace(/<\|[^|]*\|>/g,'').replace(/\[\s*BLANK_AUDIO\s*\]/gi,'').replace(/\s+/g,' ').trim()};
    if(checkpoint)try{await checkpoint.save(index,{text:result.text,...(options.timestamps?{segments:result.segments || []}:{})});}catch{}
   }
   if(reused)resumedChunks++;
   if(options.timestamps){
    const offsetSeconds=index*stepSamples/FORMAT.sampleRate;
    for(const item of result.segments || [])if(typeof item.text==='string' && Number.isFinite(item.start) && Number.isFinite(item.end) && item.start>=0 && item.end>=item.start && item.end<=FORMAT.windowSamples/FORMAT.sampleRate+0.25)segments.push({text:item.text,start:offsetSeconds+item.start,end:Math.min(totalSeconds,offsetSeconds+item.end),...(Array.isArray(item.words)?{words:item.words.map(w=>({text:typeof w.word==='string'?w.word:w.text,start:offsetSeconds+w.start,end:offsetSeconds+w.end}))}:{})});
    text=(text+' '+result.text).trim();
   } else text=mergeText(text,result.text);
   completedChunks=index+1;progress();
  }
  abort(signal);
  if(checkpoint)try{await checkpoint.complete();}catch{}
  return {success:true,text,totalSeconds,completedChunks,resumedChunks,...(options.timestamps?{segments}:{})};
 } finally {
  if(handle)await handle.close().catch(()=>{});
  // Only this mkdtemp-owned directory; never a source path or broad user folder.
  await fsp.rm(temp,{recursive:true,force:true}).catch(()=>{});
 }
}
module.exports={importAudioFile,convertToPcm,fileHash,mergeText,FORMAT,wavDataOnDisk,wrapPcmWav:wav};
