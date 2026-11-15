const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const execFile = require('node:util').promisify(require('node:child_process').execFile);
const manifest = require('../models/nbDiarizationManifest.json');
const { verifyModel, downloadVerifiedModel } = require('./nbWhisperDownload');
const verified = new Set();
function abortCheck(signal) {
  if (signal?.aborted) throw Object.assign(new Error('Download cancelled'), { name:'AbortError', isAbort:true, code:'DOWNLOAD_CANCELLED' });
}
function isVerified(file, config) {
  try {
    const stat = fs.statSync(file);
    if (!stat.isFile() || stat.size !== config.size) return false;
    const key = [file,stat.dev,stat.ino,stat.size,stat.mtimeMs,stat.ctimeMs,config.sha256].join(':');
    if (verified.has(key)) return true;
    // These ONNX files total 36 MB; synchronous readiness has a stat-keyed
    // cache and bounded read buffer, never loads all model weights into JS.
    const fd = fs.openSync(file,'r'), hash = crypto.createHash('sha256'), buffer = Buffer.alloc(64*1024);
    try { let count; while ((count=fs.readSync(fd,buffer,0,buffer.length,null))>0) hash.update(buffer.subarray(0,count)); }
    finally { fs.closeSync(fd); }
    const after=fs.statSync(file);
    if (hash.digest('hex') !== config.sha256 || ['ino','size','mtimeMs','ctimeMs'].some(field=>after[field]!==stat[field])) return false;
    if (verified.size>32) verified.clear(); verified.add(key); return true;
  } catch { return false; }
}
async function extractEntry(archive, entry, size, signal, run=execFile) {
  if (!/^[a-zA-Z0-9_.-]+\/(?:model\.onnx|LICENSE)$/.test(entry) || entry.startsWith('..') || !Number.isSafeInteger(size) || size<1 || size>10*1024*1024) throw new Error('Invalid archive entry');
  abortCheck(signal);
  const controller = new AbortController(), onAbort=()=>controller.abort(), old=signal?.onAbort;
  if (signal?.addEventListener) signal.addEventListener('abort',onAbort,{once:true});
  else if (signal) signal.onAbort=onAbort;
  try {
    // No archive path is written to disk: only this exact member's bytes are
    // emitted. Scripts, symlinks, absolute paths and other members never unpack.
    const {stdout}=await run('/usr/bin/tar',['-xOjf',archive,'--',entry],{
      encoding:'buffer',timeout:30000,maxBuffer:size+1024,killSignal:'SIGKILL',signal:controller.signal,
    });
    abortCheck(signal);
    if (!Buffer.isBuffer(stdout) || stdout.length!==size) throw new Error('Unexpected archive entry size');
    return stdout;
  } catch (error) { abortCheck(signal); throw error; }
  finally {
    if (signal?.removeEventListener) signal.removeEventListener('abort',onAbort);
    else if (signal && signal.onAbort===onAbort) signal.onAbort=old;
  }
}
async function downloadDiarizationModels(modelsDir,{download,signal,onProgress,config=manifest,extract=extractEntry}={}) {
  await fs.promises.mkdir(modelsDir,{recursive:true}); abortCheck(signal);
  const progress = stage => (downloadedBytes,totalBytes) => onProgress?.({type:'progress',stage,downloaded_bytes:downloadedBytes,total_bytes:totalBytes,percentage:totalBytes>0?Math.round(downloadedBytes/totalBytes*100):0});
  const segmentation=path.join(modelsDir,config.segmentation.fileName),license=path.join(modelsDir,config.license.fileName);
  if (!isVerified(segmentation,config.segmentation) || !isVerified(license,config.license)) {
    const staging=await fs.promises.mkdtemp(path.join(modelsDir,'.nb-diarization-'));
    try {
      const archive=path.join(staging,'segmentation.tar.bz2');
      await downloadVerifiedModel(config.archive,archive,{download,signal,onProgress:progress('segmentation')});
      for (const item of [config.segmentation,config.license]) {
        onProgress?.({type:'progress',stage:'extracting',percentage:100});
        await downloadVerifiedModel({...item,url:config.archive.url},path.join(modelsDir,item.fileName),{signal,download:async(_url,target)=>{
          const bytes=await extract(archive,item.fileName,item.size,signal);
          abortCheck(signal); await fs.promises.writeFile(target,bytes,{flag:'wx'});
        }});
      }
    } finally { await fs.promises.rm(staging,{recursive:true,force:true}); }
  }
  for (const stage of ['embedding','vad']) {
    const item=config[stage];
    await downloadVerifiedModel(item,path.join(modelsDir,item.fileName),{download,signal,onProgress:progress(stage)});
  }
  for (const stage of ['segmentation','license','embedding','vad']) await verifyModel(path.join(modelsDir,config[stage].fileName),config[stage],signal);
  onProgress?.({type:'complete',percentage:100}); return {success:true,path:modelsDir};
}
module.exports={manifest,isVerified,extractEntry,downloadDiarizationModels};
