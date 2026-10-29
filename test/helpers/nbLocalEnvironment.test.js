const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const Module=require('node:module');
test('local model settings and auth state never touch Keychain or rewrite existing credentials',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'dssa-local-env-'));
 const originalLoad=Module._load,originalResources=process.resourcesPath;
 const oldModel=process.env.LOCAL_WHISPER_MODEL,oldApi=process.env.OPENAI_API_KEY;
 const envFile=path.join(root,'.env'),tokenFile=path.join(root,'auth-token.bin');
 fs.writeFileSync(envFile,'# preserved\nOPENAI_API_KEY=existing-test-value\nCUSTOM_UNRELATED=retain\nLOCAL_WHISPER_MODEL=old\n');
 fs.writeFileSync(tokenFile,'existing-opaque-test-token');
 const files=['../../src/helpers/environment','../../src/helpers/tokenStore'];
 const paths=files.map(f=>require.resolve(f)),previous=paths.map(p=>require.cache[p]);
 paths.forEach(p=>delete require.cache[p]);
 process.resourcesPath=root;process.env.LOCAL_WHISPER_MODEL='nb-large';process.env.OPENAI_API_KEY='not-to-be-written';
 Module._load=function(request,parent,isMain){
  if(request==='electron')return {app:{getName:()=> 'DSSA Tale',getPath:()=>root,isReady:()=>false}};
  if(request==='dotenv')return {config:()=>({parsed:{}})};
  if(request==='./debugLogger')return {debug(){},warn(){},info(){},error(){}};
  if(request==='./secretCrypto')return new Proxy({},{get(){return ()=>{throw Error('Unexpected Keychain access')}}});
  return originalLoad.call(this,request,parent,isMain);
 };
 try {
  const Env=require(paths[0]),tokens=require(paths[1]);
  const env=new Env();await env.init();await env.saveAllKeysToEnvFile();
  assert.equal(env.getOpenAIKey(),'');assert.equal(env.saveOpenAIKey('new-value').success,false);
  assert.equal(tokens.get(),null);assert.equal(tokens.set('new-token').success,false);assert.equal(tokens.clear().success,true);
  const saved=fs.readFileSync(envFile,'utf8');
  assert.match(saved,/LOCAL_WHISPER_MODEL=nb-large/);assert.match(saved,/OPENAI_API_KEY=existing-test-value/);assert.match(saved,/CUSTOM_UNRELATED=retain/);
  assert.doesNotMatch(saved,/not-to-be-written|new-value/);
  assert.equal(fs.readFileSync(tokenFile,'utf8'),'existing-opaque-test-token');
  assert.equal(fs.existsSync(path.join(root,'secure-keys')),false);
 } finally {
  Module._load=originalLoad;process.resourcesPath=originalResources;
  for(let i=0;i<paths.length;i++)previous[i]?require.cache[paths[i]]=previous[i]:delete require.cache[paths[i]];
  oldModel===undefined?delete process.env.LOCAL_WHISPER_MODEL:process.env.LOCAL_WHISPER_MODEL=oldModel;
  oldApi===undefined?delete process.env.OPENAI_API_KEY:process.env.OPENAI_API_KEY=oldApi;
  fs.rmSync(root,{recursive:true,force:true});
 }
});
