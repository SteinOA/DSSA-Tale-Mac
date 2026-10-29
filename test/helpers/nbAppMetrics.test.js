const test=require('node:test'),assert=require('node:assert/strict');
const {createAppMetricsSampler,parseCpuTime}=require('../../src/helpers/nbAppMetrics');
test('includes descendants in any row order, excludes unrelated processes; first CPU sample is unknown',async()=>{
 const sampler=createAppMetricsSampler({rootPid:10,logicalCores:8,now:()=>100,read:async()=> '13 12 50 0:01.00\n12 10 100 0:02.00\n10 1 200 0:03.00\n99 1 9999 9:00.00\n'});
 assert.deepEqual(await sampler.sample(),{rss:350*1024,cpuPercent:null,cpuLogicalCores:8,processCount:3});
});
test('CPU is interval cumulative delta divided by total logical CPU capacity, not ps lifetime percentage',async()=>{
 let time=100,root='0:10.00',child='0:20.00';const sampler=createAppMetricsSampler({rootPid:10,logicalCores:8,now:()=>time,read:async()=>`10 1 200 ${root}\n12 10 100 ${child}\n`});
 await sampler.sample();time=102;root='0:12.00';child='0:22.00';assert.equal((await sampler.sample()).cpuPercent,25);
 time=104;root='0:44.00';assert.equal((await sampler.sample()).cpuPercent,100,'rounding/noisy samples cannot exceed full machine capacity');
});
test('disappearing children do not subtract CPU, new process lifetimes do not inflate interval',async()=>{
 let time=0,rows='10 1 200 0:10.00\n12 10 100 5:00.00';const sampler=createAppMetricsSampler({rootPid:10,logicalCores:4,now:()=>time,read:async()=>rows});await sampler.sample();
 time=2;rows='10 1 200 0:12.00\n13 10 100 7:00.00';assert.equal((await sampler.sample()).cpuPercent,25);
 time=4;rows='10 1 200 0:12.00\n13 10 100 7:02.00';assert.equal((await sampler.sample()).cpuPercent,25);
 time=6;rows='10 1 200 0:12.00\n13 10 100 0:01.00';assert.equal((await sampler.sample()).cpuPercent,0,'reset PID counter gets a new baseline');
});
test('read errors/malformed data/missing root return unknown RAM and CPU; recovery starts new baseline',async()=>{
 let time=0,rows='10 1 200 0:10.00',fail=false;const sampler=createAppMetricsSampler({rootPid:10,logicalCores:4,now:()=>++time,read:async()=>{if(fail)throw Error('timeout');return rows;}});await sampler.sample();
 fail=true;assert.deepEqual(await sampler.sample(),{rss:null,cpuPercent:null,cpuLogicalCores:4,processCount:null});fail=false;assert.equal((await sampler.sample()).cpuPercent,null);
 for(const invalid of ['','11 1 200 0:01.00','10 1 invalid 0:10.00','10 1 200 bad']){rows=invalid;const result=await sampler.sample();assert.equal(result.rss,null);assert.equal(result.cpuPercent,null);}
});
test('zero interval retains baseline and concurrent reads are coalesced',async()=>{
 let resolve,reads=0,time=0,rows='10 1 200 0:00.00';const pending=new Promise(r=>resolve=r);const sampler=createAppMetricsSampler({rootPid:10,logicalCores:2,now:()=>time,read:async()=>{reads++;if(reads===1)await pending;return rows;}});
 const first=sampler.sample(),duplicate=sampler.sample();assert.equal(first,duplicate);resolve();await first;assert.equal(reads,1);rows='10 1 200 0:01.00';assert.equal((await sampler.sample()).cpuPercent,null);time=2;assert.equal((await sampler.sample()).cpuPercent,25);
});
test('supports macOS ps minutes, hours and days without interpreting CPU times as dates',()=>{
 assert.equal(parseCpuTime('123:45.67'),7425.67);assert.equal(parseCpuTime('02:03:04.50'),7384.5);assert.equal(parseCpuTime('1-02:03:04'),93784);
 for(const value of ['-1:00','0:99','1:60:00','unknown'])assert.throws(()=>parseCpuTime(value));
});
