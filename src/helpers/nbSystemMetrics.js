const os = require("node:os");
const {execFile} = require("node:child_process");
const {promisify} = require("node:util");
const run = promisify(execFile);
function parseGpu(text) {
  const values = [...text.matchAll(/"Device Utilization %"\s*=\s*(\d+(?:\.\d+)?)/g)].map(m=>Number(m[1])).filter(n=>n>=0&&n<=100);
  return values.length ? Math.max(...values) : null;
}
function parseRam(text) {
  const page = /page size of (\d+) bytes/.exec(text);
  const counts = ["Pages active", "Pages wired down", "Pages occupied by compressor"].map(label=>{
    const match = new RegExp(label+":\\s*(\\d+)\\.").exec(text);
    return match ? Number(match[1]) : null;
  });
  return page && counts.every(n=>n!==null) ? counts.reduce((sum,n)=>sum+n,0)*Number(page[1]) : null;
}
function parseSwap(text) {
  const match = /\bused\s*=\s*([\d.]+)([KMGT]?)/i.exec(text);
  if(!match || !Number.isFinite(Number(match[1])))return null;
  return Number(match[1]) * 1024 ** ({K:1,M:2,G:3,T:4}[match[2].toUpperCase()] || 0);
}
function parsePressure(text) {
  return {1:"normal",2:"warning",4:"critical"}[text.trim()] || null;
}
function cpuSnapshot(cpus) {
  if(!cpus.length)return null;
  return cpus.reduce((result,cpu)=>{
    result.idle+=cpu.times.idle;
    result.total+=Object.values(cpu.times).reduce((sum,n)=>sum+n,0);
    return result;
  },{idle:0,total:0});
}
function cpuDelta(previous,current) {
  if(!previous||!current)return null;
  const elapsed=current.total-previous.total,idle=current.idle-previous.idle;
  return elapsed>0 && idle>=0 && idle<=elapsed ? Math.max(0,Math.min(100,100*(1-idle/elapsed))) : null;
}
function createSampler({read=async(file,args)=>(await run(file,args,{timeout:2500,maxBuffer:2*1024*1024})).stdout,cpus=os.cpus,totalmem=os.totalmem,platform=process.platform,now=Date.now}={}) {
  let previous=null,inflight=null;
  async function sample() {
    const current=cpuSnapshot(cpus());const cpuPercent=cpuDelta(previous,current);previous=current;
    const result={cpuPercent,gpuPercent:null,ramBytes:null,totalBytes:totalmem(),swapBytes:null,pressure:null,sampledAt:now()};
    if(platform!=="darwin")return result;
    const specs=[
      ["gpuPercent","/usr/sbin/ioreg",["-r","-c","AGXAccelerator","-l"],parseGpu],
      ["ramBytes","/usr/bin/vm_stat",[],parseRam],
      ["swapBytes","/usr/sbin/sysctl",["vm.swapusage"],parseSwap],
      ["pressure","/usr/sbin/sysctl",["-n","kern.memorystatus_vm_pressure_level"],parsePressure],
    ];
    await Promise.all(specs.map(async([key,file,args,parse])=>{try{result[key]=parse(await read(file,args));}catch{/* unavailable stays null */}}));
    return result;
  }
  return ()=>{
    if(!inflight)inflight=sample().finally(()=>{inflight=null;});
    return inflight;
  };
}
const sampleSystemMetrics=createSampler();
module.exports={sampleSystemMetrics,createSampler,parseGpu,parseRam,parseSwap,parsePressure,cpuSnapshot,cpuDelta};
