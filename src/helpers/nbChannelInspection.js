// Inspect a bounded stereo sample before any destructive downmix. Originals are read-only.
const {spawn}=require('node:child_process');
const {createAbortError}=require('./abortError');
function capture(binary,args,{signal,limit=8*1024*1024}={}) {
 return new Promise((resolve,reject)=>{
  const child=spawn(binary,args,{detached:true,stdio:['ignore','pipe','pipe']});let out=[],bytes=0,err='',failure;
  const kill=()=>{try{process.kill(-child.pid,'SIGKILL');}catch{}};
  const cancel=()=>{failure=createAbortError('Audio inspection cancelled');kill();};
  const timer=setTimeout(()=>{failure=Error('Audio inspection timed out');kill();},60000);
  child.stdout.on('data',b=>{bytes+=b.length;if(bytes>limit){failure=Error('Audio inspection limit');kill();}else out.push(b);});
  child.stderr.on('data',b=>{err=(err+b.toString()).slice(-16384);});
  child.once('error',()=>{failure=Error('Audio inspector could not start');});
  child.once('close',code=>{clearTimeout(timer);signal?.removeEventListener('abort',cancel);if(failure)reject(failure);else resolve({buffer:Buffer.concat(out),metadata:err,code});});
  signal?.addEventListener('abort',cancel,{once:true});if(signal?.aborted)cancel();
 });
}
async function inspectChannels(file,{ffmpegPath,signal}={}) {
 const meta=await capture(ffmpegPath,['-nostdin','-hide_banner','-protocol_whitelist','file,pipe','-i',file,'-t','0','-f','null','-'],{signal});
 const line=meta.metadata.split('\n').find(l=>/Stream .*Audio:/.test(l)) || '';
 const explicit=line.match(/(\d+) channels/);
 const channels=/\bstereo\b/.test(line)?2:/\bmono\b/.test(line)?1:explicit?Number(explicit[1]):/\b5\.1\b/.test(line)?6:/\b7\.1\b/.test(line)?8:null;
 if(channels!==2)return {channels,independence:'unknown',requiresChoice:channels!==1,scope:'first-30-seconds'};
 const sample=await capture(ffmpegPath,['-nostdin','-v','error','-protocol_whitelist','file,pipe','-i',file,'-t','30','-vn','-ar','16000','-c:a','pcm_s16le','-f','wav','pipe:1'],{signal});
 if(sample.code!==0)throw Error('Channel inspection failed');
 let offset=12;
 while(offset+8<=sample.buffer.length && sample.buffer.toString('ascii',offset,offset+4)!=='data'){const size=sample.buffer.readUInt32LE(offset+4);offset+=8+size+(size%2);}
 if(offset+8>sample.buffer.length)throw Error('Invalid channel sample');
 offset+=8;
 let aa=0,bb=0,ab=0,n=0;
 for(let i=offset;i+3<sample.buffer.length;i+=4){const a=sample.buffer.readInt16LE(i)/32768,b=sample.buffer.readInt16LE(i+2)/32768;if(Number.isFinite(a)&&Number.isFinite(b)){aa+=a*a;bb+=b*b;ab+=a*b;n++;}}
 const correlation=aa&&bb?ab/Math.sqrt(aa*bb):null;
 // Correlation alone cannot identify microphones or people. Require a user's choice.
 return {channels,correlation,rms:n?[Math.sqrt(aa/n),Math.sqrt(bb/n)]:[],independence:correlation!==null&&Math.abs(correlation)<0.95?'possibly-independent':'similar-or-uncertain',requiresChoice:true,scope:'first-30-seconds'};
}
module.exports={inspectChannels,capture};
