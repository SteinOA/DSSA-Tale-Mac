const test=require('node:test');
const assert=require('node:assert/strict');
const {accelerationMode,selectCoreMLBinary}=require('../../src/helpers/nbAcceleration');
const base={roots:['/bundle'],platform:'darwin',arch:'arm64',cpuModel:'Apple M4',mode:'auto',exists:()=>true};
test('automatic M4 route needs the binary and both encoder paths',()=>{
 assert.equal(selectCoreMLBinary(base),'/bundle/bin/whisper-server-coreml-darwin-arm64');
 for(const missing of ['whisper-server-coreml','ggml-nb-large-full-encoder','ggml-nb-large-encoder'])
  assert.equal(selectCoreMLBinary({...base,exists:p=>!p.includes(missing)}),null);
});
test('explicit CPU/Metal and CPU fallback keep the portable engine',()=>{
 for(const mode of ['cpu','metal',undefined])assert.equal(selectCoreMLBinary({...base,mode}),null);
 assert.equal(selectCoreMLBinary({...base,cpuOnly:true}),null);
});
test('unknown architectures and newer chips never run an unverified M4-native binary',()=>{
 for(const cpuModel of ['Apple M1','Apple M2','Apple M3','Apple M5','Intel',''])assert.equal(selectCoreMLBinary({...base,cpuModel}),null);
 assert.equal(selectCoreMLBinary({...base,arch:'x64'}),null);
 assert.equal(selectCoreMLBinary({...base,platform:'win32'}),null);
});
test('existing explicit acceleration preferences survive while a new profile defaults to auto',()=>{
 assert.equal(accelerationMode('cpu'),'cpu');assert.equal(accelerationMode('metal'),'metal');
 assert.equal(accelerationMode(undefined),'auto');assert.equal(accelerationMode('cuda'),'auto');
});
