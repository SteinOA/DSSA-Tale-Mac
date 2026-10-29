const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const file = require.resolve('../../src/helpers/nbNativePaste');
const original = Module._load;
function setup({front = 42, activated = true, settleAfter = 0} = {}) {
  const state = {front, calls:0, reads:0};
  const native = {
    status(){state.reads++; if(state.calls && state.reads > settleAfter) state.front=42; return {frontmostPid:state.front};},
    activateTarget(){state.calls++; return activated;},
  };
  Module._load=function(name,parent,main){
    if(name.endsWith('macos-native-paste.node')) return native;
    return original.call(this,name,parent,main);
  };
  delete require.cache[file];
  return {state, helper:require(file)};
}
test.afterEach(()=>{Module._load=original;delete require.cache[file];});
test('an already focused target needs no activation or script process', async()=>{
  const {state,helper}=setup();assert.equal(await helper.activateTarget(42),true);assert.equal(state.calls,0);
});
test('a requested activation is observed before paste',async()=>{
  const {state,helper}=setup({front:7,settleAfter:2});assert.equal(await helper.activateTarget(42),true);assert.equal(state.calls,1);assert.ok(state.reads>=3);
});
test('a target which does not become active has a short bounded wait',async()=>{
  const {state,helper}=setup({front:7,settleAfter:1000});const start=Date.now();
  assert.equal(await helper.activateTarget(42),false);assert.equal(state.calls,1);assert.ok(Date.now()-start<700);
});
test('invalid or unavailable targets never trigger paste or long polling',async()=>{
  const {state,helper}=setup({front:7,activated:false});assert.equal(await helper.activateTarget(0),false);
  assert.equal(await helper.activateTarget(42),false);assert.equal(state.calls,1);assert.equal(state.reads,1);
});
