const test=require("node:test");
const assert=require("node:assert/strict");
const {parseGpu,parseRam,parseSwap,parsePressure,cpuSnapshot,cpuDelta,createSampler}=require("../../src/helpers/nbSystemMetrics");
const vm='Mach Virtual Memory Statistics: (page size of 16384 bytes)\nPages active: 100.\nPages wired down: 20.\nPages occupied by compressor: 30.\nPages inactive: 999.\nPages stored in compressor: 900.';
test("Apple parsers distinguish real zero from missing metrics and exclude inactive/compressed logical pages",()=>{
 assert.equal(parseGpu('"Device Utilization %"=26'),26);
 assert.equal(parseGpu('"Device Utilization %"=0'),0);
 assert.equal(parseGpu('"Renderer Utilization %"=40'),null);
 assert.equal(parseRam(vm),150*16384);
 assert.equal(parseRam('Pages active: 100.'),null);
 assert.equal(parseSwap('vm.swapusage: total = 6144.00M used = 4542.94M free = 1601.06M'),4542.94*1024**2);
 assert.equal(parseSwap('used = 0.00M'),0);assert.equal(parseSwap('unavailable'),null);
 assert.deepEqual(['1','2','4','9'].map(parsePressure),['normal','warning','critical',null]);
});
test("CPU is a delta over all cores, not lifetime load",()=>{
 const old=cpuSnapshot([{times:{idle:80,user:10,sys:10}},{times:{idle:60,user:20,sys:20}}]);
 const next=cpuSnapshot([{times:{idle:100,user:70,sys:30}},{times:{idle:140,user:30,sys:30}}]);
 assert.equal(cpuDelta(old,next),50);
 assert.equal(cpuDelta(null,next),null);assert.equal(cpuDelta(next,old),null);
});
test("sampler keeps unavailable values null and coalesces overlapping samples",async()=>{
 let reads=0,total=100;
 const sample=createSampler({platform:'darwin',cpus:()=>[{times:{idle:total/2,user:total/2}}],totalmem:()=>32*2**30,now:()=>123,read:async(file,args)=>{
  reads++;if(file.endsWith('ioreg'))throw new Error('unavailable');
  if(file.endsWith('vm_stat'))return vm;
  return args.includes('vm.swapusage')?'used = 1.5G':'2';
 }});
 const first=sample();assert.equal(sample(),first);
 const result=await first;assert.equal(reads,4);assert.equal(result.cpuPercent,null);assert.equal(result.gpuPercent,null);
 assert.equal(result.ramBytes,150*16384);assert.equal(result.swapBytes,1.5*2**30);assert.equal(result.pressure,'warning');assert.equal(result.sampledAt,123);
 total=200;assert.equal((await sample()).cpuPercent,50);
});
