const test = require("node:test");
const assert = require("node:assert/strict");
const {loadAudioManager} = require("./harness/audioManager");
const fs=require("node:fs"),path=require("node:path");

test("actual paste IPC handler serializes outcome without a restore Promise",async()=>{
  const source=fs.readFileSync(path.join(__dirname,"../../src/helpers/ipcHandlers.js"),"utf8");
  const start=source.indexOf('    ipcMain.handle("paste-text",');
  const end=source.indexOf('    ipcMain.handle("check-accessibility-permission"',start);
  let handler;
  const register=new Function("ipcMain","process","applySmartSpacing","debugLogger",source.slice(start,end));
  for(const result of [{verification:"unverified",posted:true,method:"session-command-v",targetPid:42},{pasted:false},{verification:"verified",method:"ax-selected-text"}]){
    register.call({windowManager:{isOnboardingDemoActive:()=>false},clipboardManager:{pasteText:async()=>({...result,restoreComplete:Promise.resolve()})}},
      {handle:(_name,callback)=>handler=callback},{platform:"darwin"},text=>text,{debug(){}});
    const response=await handler({sender:{}},"Testtekst",{});
    assert.equal(response.pasted,result.verification==="verified");
    assert.equal(response.verification,result.verification || "unverified");
    assert.equal(response.dispatched,result.pasted!==false);
    assert.equal(response.method,result.method);
    assert.equal(response.targetPid,result.targetPid ?? null);
    assert.equal("restoreComplete" in response,false);
    assert.doesNotThrow(()=>structuredClone(response));
  }
});

test("resolved IPC outcomes distinguish confirmed paste, clipboard-only and unverified dispatch without retries",async t=>{
  const harness=await loadAudioManager(t,{cachePrefix:"paste-outcome",settingsKey:"__pasteOutcomeSettings"});
  const errors=[];
  const manager=harness.createManager({onError:error=>errors.push(error)});
  let calls=0;
  for(const result of [
    {success:true,pasted:false,dispatched:false},
    {success:true,verification:"unverified"},
    {success:false},
  ]) {
    harness.window.electronAPI.pasteText=async()=>{calls++;return result;};
    assert.equal(await manager.safePaste("Behold teksten"),false);
    assert.equal(errors.at(-1).preserveDictationPreview,true);
  }
  assert.equal(calls,3,"Each outcome dispatches at most once");
  assert.equal(errors[1].code,"PASTE_UNVERIFIED");
  harness.window.electronAPI.pasteText=async()=>({success:true,pasted:false,verification:"unverified",dispatched:true});
  assert.equal(await manager.safePaste("Sendt uten lesbar AX-tekst"),true);
  assert.equal(errors.length,3,"An unreadable receiver does not trigger a misleading warning");
  harness.window.electronAPI.pasteText=async()=>({success:true,pasted:true,verification:"verified"});
  assert.equal(await manager.safePaste("Bekreftet"),true);
  assert.equal(errors.length,3);
  harness.window.electronAPI.pasteText=async()=>{throw new Error("Target changed");};
  assert.equal(await manager.safePaste("Behold ved feil"),false);
  assert.equal(errors.at(-1).preserveDictationPreview,true);
});

test("Mac paste uses bounded native activation and records timing without transcript content",async()=>{
  const source=fs.readFileSync(path.join(__dirname,"../../src/helpers/ipcHandlers.js"),"utf8");
  const start=source.indexOf('    ipcMain.handle("paste-text",');
  const end=source.indexOf('    ipcMain.handle("check-accessibility-permission"',start);
  let handler, activationPid, pasteOptions;
  const register=new Function("ipcMain","process","applySmartSpacing","debugLogger","require",source.slice(start,end));
  const context={windowManager:{isOnboardingDemoActive:()=>false},textEditMonitor:{lastTargetPid:42,activateTargetPid(){throw new Error("Legacy script activation must not run");}},clipboardManager:{pasteText:async(_text,options)=>{pasteOptions=options;return {posted:true,verification:"verified",dispatchMs:12};}}};
  register.call(context,{handle:(_name,callback)=>handler=callback},{platform:"darwin"},text=>text,{debug(){}},name=>{
    assert.equal(name,"./nbNativePaste");return {activateTarget:async pid=>{activationPid=pid;return true;}};
  });
  const result=await handler({sender:{}},"Lang privat testtekst ".repeat(1000),{});
  assert.equal(activationPid,42);assert.equal(pasteOptions.expectedTargetPid,42);assert.equal(result.verification,"verified");
  assert.equal(context._nbLastPasteOutcome.textLength,22000);
  assert.equal(context._nbLastPasteOutcome.dispatchMs,12);
  assert.ok(!JSON.stringify(context._nbLastPasteOutcome).includes("privat"));
});
