const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../../main.js'),'utf8');
function extract(name){const start=source.indexOf('function '+name+'(');const end=source.indexOf('\n}',start);return source.slice(start,end+2);}
test('test candidate profile cannot be redirected by an inherited development channel',()=>{
 for(const APP_CHANNEL of ['production','development','staging']){
  const changes=[];const app={setPath:(...args)=>changes.push(args),getPath:()=>'/profiles'};
  new Function('isNBTestBuild','APP_CHANNEL','app','path',extract('configureChannelUserDataPath')+';configureChannelUserDataPath();')(true,APP_CHANNEL,app,path);
  assert.deepEqual(changes,[]);
 }
});
test('test candidate can register only its own protocol even with production environment overrides',()=>{
 const get=new Function('isNBTestBuild','process',extract('getOAuthProtocol')+';return getOAuthProtocol();');
 assert.equal(get(true,{env:{OPENWHISPR_PROTOCOL:'openwhispr'}}),'dssa-tale-test');
 const config=require('../../electron-builder.nb-test.cjs');
 assert.equal(config.appId,'no.steinoa.openwhispr.nb.test');
 assert.deepEqual(config.protocols.schemes,['dssa-tale-test']);
 assert.ok(config.extraResources.some(x=>typeof x==='object'&&x.to==='nb-test-build.json'));
});
