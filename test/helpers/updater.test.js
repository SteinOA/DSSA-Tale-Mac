const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const updaterModulePath = require.resolve("../../src/updater.js");

function loadLocalUpdater(t) {
  const original = Module._load;
  let providerLoads = 0;
  Module._load = function(request,parent,isMain) {
    if(request === "electron-updater") { providerLoads++; throw Error("Upstream provider must not load"); }
    if(request === "electron") return {app:{getVersion:()=>"1.9.7"}};
    return original.call(this,request,parent,isMain);
  };
  delete require.cache[updaterModulePath];
  t.after(()=>{Module._load=original;delete require.cache[updaterModulePath];});
  return {manager:new (require(updaterModulePath))(),loads:()=>providerLoads};
}
test("local edition never loads a provider or starts update checks, regardless of legacy preferences",async(t)=>{
  t.mock.timers.enable({apis:["setTimeout","setInterval"]});
  const {manager,loads}=loadLocalUpdater(t);
  for(const prefs of [undefined,{notificationsEnabled:true,notifyUpdates:true},{notificationsEnabled:false,notifyUpdates:false}]) {
    const sent=[];
    manager.setWindowManager({notificationPrefs:prefs,mainWindow:{webContents:{send:(...v)=>sent.push(v)}},showUpdateNotification:()=>{throw Error("Unexpected popup");}});
    manager.setupAutoUpdater();
    manager.checkForUpdatesOnStartup();
    manager._autoCheckForUpdates("manual legacy callback");
    t.mock.timers.tick(24*60*60*1000);
    assert.deepEqual(await manager.checkForUpdates(),{updateAvailable:false,message:"Oppdateringer er deaktivert i NB-utgaven."});
    assert.equal((await manager.downloadUpdate()).success,false);
    assert.equal((await manager.installUpdate()).success,false);
    assert.deepEqual(sent,[]);
    assert.equal(loads(),0);
    assert.equal(manager.isInstalling,false);
    assert.equal(manager.isDownloading,false);
    manager.cleanup();
  }
});
test("version and disabled status stay available offline without an update provider",async(t)=>{
  const {manager,loads}=loadLocalUpdater(t);
  assert.deepEqual(await manager.getAppVersion(),{version:"1.9.7"});
  const status=await manager.getUpdateStatus();
  assert.equal(status.updateAvailable,false);
  assert.equal(status.updateDownloaded,false);
  assert.equal(await manager.getUpdateInfo(),null);
  assert.equal(loads(),0);
});
