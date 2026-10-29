// Run explicitly with Electron, passing an isolated workspace directory.
const {app,session,net}=require("electron");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const root=process.argv[3] ? path.resolve(process.argv[3]) : path.resolve(__dirname,"../..");
const destination=process.argv[2];
if(!destination) throw new Error("Pass an isolated verification directory");
app.setPath("userData",path.join(path.resolve(destination),"profile"));
process.env.OPENWHISPR_CACHE_ROOT=path.join(path.resolve(destination),"cache");
function request(url,options={}) {
  return new Promise((resolve,reject)=>{
    const req=net.request({url,method:"GET",...options});
    req.on("error",reject);
    req.on("response",res=>{res.resume();resolve(res.statusCode);});
    req.end();
  });
}
function modelPrefix(url, transport) {
  return new Promise((resolve,reject)=>{
    const req=net.request({url,method:"GET",session:transport,credentials:"omit",useSessionCookies:false});
    let done=false;
    req.setHeader("Range","bytes=0-3");
    req.on("error",error=>{if(!done)reject(error);});
    req.on("response",res=>{
      let prefix=Buffer.alloc(0);
      res.on("data",chunk=>{
        prefix=Buffer.concat([prefix,chunk]);
        if(prefix.length>=4&&!done){done=true;resolve({status:res.statusCode,magic:prefix.subarray(0,4).toString(),headers:res.headers});req.abort();}
      });
      res.on("end",()=>{if(!done){done=true;reject(new Error("GGUF header missing"));}});
    });
    req.end();
  });
}
app.whenReady().then(async()=>{
 try {
  console.log("APP_SOURCE",root,"VERSION",require(path.join(root,"package.json")).version);
  // Execute the exact current app filter, rather than reproducing its logic.
  const source=fs.readFileSync(path.join(root,"main.js"),"utf8");
  const start=source.indexOf("  session.defaultSession.webRequest.onBeforeRequest(");
  const end=source.indexOf("  applyOpenWhisprOriginHeader",start);
  assert(start>=0&&end>start,"main app network filter must be found");
  vm.runInNewContext(source.slice(start,end),{session,URL});
  const model=require(path.join(root,"src/models/modelRegistryData.json")).localProviders.flatMap(p=>p.models).find(m=>m.id==="qwen3.5-2b-q4_k_m");
  const url=`https://huggingface.co/${model.hfRepo}/resolve/main/${model.fileName}`;
  await assert.rejects(request(url),/ERR_BLOCKED_BY_CLIENT/);
  await assert.rejects(request("https://api.openai.com/v1/audio/transcriptions"),/ERR_BLOCKED_BY_CLIENT/);
  const isolated=require(path.join(root,"src/helpers/nbModelDownloadSession")).getModelDownloadSession(url);
  await assert.rejects(request(url,{session:isolated,method:"POST"}),/ERR_BLOCKED_BY_CLIENT/);
  await assert.rejects(request("https://api.openai.com/v1/audio/transcriptions",{session:isolated}),/ERR_BLOCKED_BY_CLIENT/);
  console.log("PASS: actual app default filter blocks remote/model requests; isolated session blocks POST/cloud");
  const policy=require(path.join(root,"src/helpers/nbModelDownloadSession"));
  for(const candidate of require(path.join(root,"src/models/modelRegistryData.json")).localProviders.flatMap(p=>p.models)) {
    const candidateUrl=`https://huggingface.co/${candidate.hfRepo}/resolve/main/${candidate.fileName}`;
    if(!policy.isCuratedModelUrl(candidateUrl))continue;
    const prefix=await modelPrefix(candidateUrl,policy.getModelDownloadSession(candidateUrl));
    assert([200,206].includes(prefix.status));assert.equal(prefix.magic,"GGUF");
    console.log("PASS: curated model route and GGUF header",candidate.id,prefix.status);
  }
  const manager=require(path.join(root,"src/helpers/modelManagerBridge")).default;
  let last=0;
  const file=await manager.downloadModel(model.id,(p,n,total)=>{if(p-last>=20){last=p;console.log(JSON.stringify({progress:p,bytes:n,total}));}});
  const hash=require("node:crypto").createHash("sha256");
  for await(const chunk of fs.createReadStream(file))hash.update(chunk);
  assert.equal(fs.statSync(file).size,model.verifiedSizeBytes);
  assert.equal(hash.digest("hex"),model.sha256);
  await assert.rejects(request(url),/ERR_BLOCKED_BY_CLIENT/);
  console.log("PASS: complete GGUF download and SHA-256 under installed app filter; default session remains blocked",model.id,model.verifiedSizeBytes);
  app.exit(0);
 }catch(error){console.error(error);app.exit(1);}
});
