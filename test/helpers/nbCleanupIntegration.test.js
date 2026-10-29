const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {loadAudioManager}=require("./harness/audioManager");
const integrity=require("../../src/helpers/nbTextIntegrity");

async function harness(t) {
 const h=await loadAudioManager(t,{cachePrefix:"nb-integrity",settingsKey:"__nbIntegritySettings",settings:{useCleanupModel:true}});
 h.window.electronAPI.nbValidateCleanup=async(a,b)=>integrity.validateCleanup(a,b,{language:"nn"});
 return h;
}
test("actual audio wrapper keeps rejected NN source and exposes one-shot notice",async t=>{
 const h=await harness(t);const m=h.createManager({processTranscriptionCore:async()=>"Jeg myrger.",finalizeChineseScript:x=>x,getEffectiveSttLanguage:()=>"nn"});
 assert.equal(await m.processTranscription("eg meiner","local"),"eg meiner");
 assert.equal(m.pendingNbCleanupRejected,true);
 const extras=m._takePendingResultExtras();
 assert.equal(extras.nbCleanupRejected,true);
 assert.equal(m._takePendingResultExtras().nbCleanupRejected,undefined);
 m.processTranscriptionCore=async()=>"Eg meiner.";
 assert.equal(await m.processTranscription("eg meiner","local"),"Eg meiner.");
 assert.equal(m.pendingNbCleanupRejected,false);
});
test("validator errors, absent bridge and malformed responses fail closed without losing text",async t=>{
 const h=await harness(t);const m=h.createManager({processTranscriptionCore:async()=>"Endret tekst",finalizeChineseScript:x=>x,getEffectiveSttLanguage:()=>"nn"});
 for(const validator of [undefined,async()=>{throw new Error("IPC gone");},async()=>null,async()=>({accepted:"true"}),async()=>({accepted:true,text:"different"})]) {
  h.window.electronAPI.nbValidateCleanup=validator;
  assert.equal(await m.processTranscription("Original tekst","local"),"Original tekst");assert.equal(m.pendingNbCleanupRejected,true);
 }
});
test("assistant, translation and recorded agent routes preserve intentional rewrites",async t=>{
 const h=await harness(t);let validations=0;h.window.electronAPI.nbValidateCleanup=async()=>{validations++;throw Error("must bypass");};
 for(const mode of ["voice","translation","agent-route"]){
  const m=h.createManager({voiceAgentRequested:mode==="voice",translationRequested:mode==="translation",finalizeChineseScript:x=>x,getEffectiveSttLanguage:()=>"nn"});
  m.processTranscriptionCore=async()=>{if(mode==="agent-route")m._nbTranscriptionReasoningRoute="agent";return "An intentional new answer";};
  assert.equal(await m.processTranscription("Lag eit svar","local"),"An intentional new answer");
 }
 assert.equal(validations,0);
});
test("cancellation during validator wait cannot expose transformed output or stale rejection",async t=>{
 const h=await harness(t);let cancelled=false;
 const m=h.createManager({processTranscriptionCore:async()=>"Eg meiner.",finalizeChineseScript:x=>x,getEffectiveSttLanguage:()=>"nn"});
 h.window.electronAPI.nbValidateCleanup=async()=>{cancelled=true;return {accepted:true,text:"Eg meiner."};};
 assert.equal(await m.processTranscription("eg meiner","local",()=>cancelled),"eg meiner");
 assert.equal(m.pendingNbCleanupRejected,false);
});

function handlers(processText){
 const text=fs.readFileSync(path.join(__dirname,"../../src/helpers/ipcHandlers.js"),"utf8");
 const start=text.indexOf('    ipcMain.handle("process-local-reasoning",');
 const end=text.indexOf('    ipcMain.handle(\n      "process-anthropic-reasoning"',start);
 assert.ok(start>=0&&end>start);let handler;
 new Function("ipcMain","require",text.slice(start,end))({handle:(_n,h)=>handler=h},name=>{
  if(name.includes("localReasoningBridge"))return {default:{processText}};
  if(name==="./nbTextIntegrity")return integrity;
  throw Error(name);
 });return handler;
}
test("actual local reasoning IPC guards cleanup but preserves generic assistant output",async()=>{
 const h=handlers(async()=>"Jeg myrger.");
 const result=await h({},"eg meiner","test",null,{nbTask:"cleanup",language:"nn"});
 assert.equal(result.text,"eg meiner");assert.equal(result.integrity.accepted,false);
 const assistant=await h({},"eg meiner","test",null,{});
 assert.equal(assistant.text,"Jeg myrger.");assert.equal(assistant.integrity,undefined);
});
test("actual local reasoning IPC uses sanitized quote categories and raw-source fallback",async()=>{
 const source="Eg meiner at fristen bør stå.";
 const h=handlers(async()=>JSON.stringify([{type:"decision",quote:source}]));
 const result=await h({},source,"test",null,{nbTask:"notes",language:"nn"});
 assert.equal(result.text,"Notat\n• "+source);assert.equal(result.draft,true);
 const bad=await handlers(async()=>'{broken')({},source,"test",null,{nbTask:"notes",language:"nn"});
 assert.equal(bad.text,source);assert.equal(bad.integrity.accepted,false);
});

test("wake-word uses actual route resolver and core path without cleanup interception",async t=>{
 const h=await loadAudioManager(t,{cachePrefix:"nb-wake-guard",settingsKey:"__nbWakeGuard",settings:{useCleanupModel:true,useDictationAgent:true,preferredLanguage:"en",uiLanguage:"en"},mockModules:{
  "/config/prompts": `export const resolvePrompt=()=>"Act as assistant"; export const appendScreenContextSuffix=x=>x;`,
  "/dictationAgentInference": `export const resolveDictationAgentInference=()=>({reachable:true,model:"local-test",config:{provider:"local"}}); export const resolveDictationAgentVisionInference=()=>({active:false,config:{provider:"local"}});`,
 }});
 localStorage.setItem("agentName","Aria");let commands=0,validations=0;
 h.window.electronAPI.nbValidateCleanup=async()=>{validations++;return {accepted:false};};
 const m=h.createManager({voiceAgentRequested:false,translationRequested:false,isReasoningAvailable:async()=>true,processAgentCommand:async()=>{commands++;return "Intentional rewritten reply";},finalizeChineseScript:x=>x,getEffectiveSttLanguage:()=>"en"});
 const result=await m.processTranscription("Hey Aria, draft a reply","local");
 assert.equal(commands,1);assert.equal(m._nbTranscriptionReasoningRoute,"agent");assert.equal(result,"Intentional rewritten reply");assert.equal(validations,0);
});

test("actual manual cleanup/notes IPC preserves source on model failure while generic assistant reports failure",async()=>{
 const h=handlers(async()=>{throw Error("model unavailable");});
 for(const nbTask of ["cleanup","notes"]){
  const result=await h({},"Behald originalen.","test",null,{nbTask,language:"nn"});
  assert.equal(result.success,true);assert.equal(result.text,"Behald originalen.");assert.equal(result.integrity.accepted,false);
 }
 const generic=await h({},"Behald originalen.","test",null,{});assert.equal(generic.success,false);
});
test("actual cleanup validation IPC applies the pure guard and rejects non-text arguments",()=>{
 const source=fs.readFileSync(path.join(__dirname,"../../src/helpers/ipcHandlers.js"),"utf8");
 const start=source.indexOf('    ipcMain.handle("nb-validate-cleanup",');
 const end=source.indexOf('    ipcMain.handle("nb-set-preferences",',start);assert.ok(start>=0&&end>start);
 let handler;
 new Function("ipcMain","require","i18nMain",source.slice(start,end))({handle:(_n,h)=>handler=h},name=>{
  if(name==="./nbTextIntegrity")return integrity;
  if(name==="./nbDialogLabels")return {getNbDialogLabels:()=>({invalidDocument:"Invalid document"})};
  throw Error(name);
 },{language:"nn"});
 assert.equal(handler({},"eg meiner","Eg meiner.","nn").accepted,true);
 assert.equal(handler({},"eg meiner","Jeg mener.","nn").text,"eg meiner");
 assert.throws(()=>handler({},null,"text","nn"),/Invalid document/);
});
