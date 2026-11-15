const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {EventEmitter}=require('node:events'),{createRequire}=require('node:module');
test('actual IPC registration binds opaque tokens to sender, strips internal flags, clears on owner exit',async()=>{
 const file=path.resolve(__dirname,'../../src/helpers/ipcHandlers.js'),source=fs.readFileSync(file,'utf8');
 const start=source.indexOf('    // One bounded, ephemeral dictation cache.');const handler=source.indexOf('    ipcMain.handle("transcribe-local-whisper"',start);const end=source.indexOf('    ipcMain.handle(',handler+20);
 const handlers={},app=new EventEmitter(),owner=new EventEmitter(),foreign=new EventEmitter();let request;
 const manager={nbPrecomputeIdentity:o=>({model:'/models/full',requestModel:o.model,language:o.language,decoder:{initialPrompt:o.initialPrompt}}),serverManager:{canConvert:true,modelPath:'/models/full',_convertToWav:async()=>{throw Error('test decode fails safely');}},transcribeLocalWhisper:async(_audio,o)=>{request=o;return {success:true,text:'normal result'};}};
 new Function('ipcMain','app','crypto','require','debugLogger',source.slice(start,end)).call({whisperManager:manager,_resolveWhisperVadOptions:()=>({vadEnabled:false})},{handle:(n,f)=>handlers[n]=f},app,crypto,createRequire(file),{log(){},error(){}});
 const own={sender:owner},other={sender:foreign};const token=await handlers['nb-precompute-begin'](own,{model:'nb-large-full',language:'no'});assert.match(token,/^[0-9a-f-]{36}$/);assert.equal(owner.listenerCount('destroyed'),1);
 assert.equal(await handlers['nb-precompute-offer'](other,token,new ArrayBuffer(3)),false);
 await handlers['transcribe-local-whisper'](other,new ArrayBuffer(3),{nbPrecomputeToken:token,nbNormalized:true,nbCacheLookup:'bad',nbIdentity:{}});assert.equal(request.nbCacheLookup,undefined);assert.equal(request.nbNormalized,undefined);assert.equal(request.nbIdentity,undefined);
 await handlers['transcribe-local-whisper'](own,new ArrayBuffer(3),{nbPrecomputeToken:token});assert.equal(typeof request.nbCacheLookup,'function');assert.equal(await request.nbCacheLookup(Buffer.from('invalid'),{}),undefined);
 await handlers['nb-precompute-cancel'](other,token);assert.equal(owner.listenerCount('destroyed'),1);
 const replacement=await handlers['nb-precompute-begin'](own,{model:'nb-large-full',language:'no'});assert.notEqual(replacement,token);assert.equal(owner.listenerCount('destroyed'),1,'no listener accumulation per recording');assert.equal(await handlers['nb-precompute-offer'](own,token,new ArrayBuffer(3)),false);
 owner.emit('destroyed');assert.equal(await handlers['nb-precompute-offer'](own,replacement,new ArrayBuffer(3)),false);app.emit('before-quit');
});
