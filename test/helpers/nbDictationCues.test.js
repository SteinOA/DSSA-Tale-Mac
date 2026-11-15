const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
test('enabled dictation start and stop call the native audio route with the correct cue',async()=>{
 const calls=[],errors=[];
 let enabled=true;
 const deps={
  './logger':{debug(...args){errors.push(args)}},
  '../stores/settingsStore':{getSettings:()=>({audioCuesEnabled:enabled})},
  './nbAudioOutput':{playNativeAudioCue:async kind=>{calls.push(kind);return true},applyAudioOutput(){throw Error('Unexpected browser audio')},audioOutputStep(){throw Error('Unexpected browser audio')}}
 };
 // Bind only imports actually declared by the module. A missing import must
 // fail the behavior check, just as it does in the packaged renderer.
 const source=fs.readFileSync(path.join(__dirname,'../../src/utils/dictationCues.js'),'utf8')
  .replace(/^import\s+(.+?)\s+from\s+"([^"]+)";$/gm,(_,binding,name)=>`const ${binding} = deps[${JSON.stringify(name)}];`)
  .replace(/export const /g,'const ');
 const cues=vm.runInNewContext(`(()=>{${source};return {playStartCue,playStopCue}})()`,{deps});
 await cues.playStartCue();await cues.playStopCue();
 enabled=false;await cues.playStartCue();
 assert.deepEqual(calls,['start','stop']);assert.equal(errors.length,0);
});
