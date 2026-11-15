const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const Spool=require("../../src/helpers/nbDeferredMeeting");
test("deferred meeting preserves PCM, source, capture time and ordering; removes owned files",async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),"dssa-spool-test-"));
 try{
  fs.writeFileSync(path.join(root,"unrelated"),"keep");
  const spool=new Spool({root});
  const first=Buffer.from([0,1,128,255,5,6]),second=Buffer.alloc(48000,99);
  spool.enqueue("system",first,123);spool.enqueue("mic",second,124);
  assert.equal(spool.pendingBytes,48006);assert.equal(spool.pendingCount,2);
  const rows=[];await spool.drain(async row=>rows.push(row));
  assert.deepEqual(rows,[{source:"system",buffer:first,timestamp:123},{source:"mic",buffer:second,timestamp:124}]);
  assert.equal(spool.pendingCount,0);spool.clear();assert.deepEqual(fs.readdirSync(root),["unrelated"]);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test("failed consumption keeps audio for retry and rejects concurrent clearing",async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),"dssa-spool-test-"));
 try{
  const spool=new Spool({root});spool.enqueue("mic",Buffer.from("PCM"),5);
  await assert.rejects(spool.drain(async()=>{assert.throws(()=>spool.clear(),/being read/);throw new Error("model failed");}),/model failed/);
  assert.equal(spool.pendingCount,1);
  let data;await spool.drain(async row=>{data=row.buffer.toString();});assert.equal(data,"PCM");spool.clear();
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
