const test = require('node:test');
const assert = require('node:assert/strict');
const { createCloudFolders, registerNbCloudFolderHandlers } = require('../../src/helpers/nbCloudFolders');
function fixture() {
  let data = { documentFolder: '/existing/export', meetingMode: 'after' };
  const checked = [], opened = [];
  const preferences = { read: () => structuredClone(data), update: values => { data = { ...data, ...structuredClone(values) }; } };
  const fileSystem = {
    stat: async selected => { checked.push(selected); if (selected.endsWith('/missing')) throw Object.assign(Error(), { code: 'ENOENT' }); return { isDirectory: () => !selected.endsWith('/file') }; },
    access: async selected => { if (selected.endsWith('/denied')) throw Object.assign(Error(), { code: 'EACCES' }); },
  };
  const openPath = async selected => { opened.push(selected); return ''; };
  return { preferences, fileSystem, openPath, checked, opened, service: createCloudFolders({preferences,fileSystem,openPath}) };
}
test('separate selected paths persist across instances; get probes only explicit bookmarks', async () => {
  const f = fixture();
  assert.deepEqual((await f.service.get()).providers.map(p => p.status), ['none','none','none']); assert.equal(f.checked.length, 0);
  await f.service.select('google','/chosen/google'); await f.service.select('onedrive','/chosen/organisation');
  const restarted = createCloudFolders(f); const state = await restarted.get();
  assert.deepEqual(state.providers, [{id:'google',path:'/chosen/google',status:'available'},{id:'onedrive',path:'/chosen/organisation',status:'available'},{id:'icloud',path:null,status:'none'}]);
  assert.equal(f.preferences.read().documentFolder,'/existing/export'); assert.equal(f.preferences.read().meetingMode,'after');
  assert.ok(f.checked.every(p => p === '/chosen/google' || p === '/chosen/organisation'));
});
test('missing, non-directory and denied selections stay bookmarked and cannot be opened', async () => {
  const f = fixture();
  for (const [suffix,status,code] of [['missing','missing','FOLDER_MISSING'],['file','missing','FOLDER_MISSING'],['denied','denied','FOLDER_DENIED']]) {
    assert.equal((await f.service.select('icloud','/chosen/'+suffix)).status,status);
    assert.deepEqual(await f.service.open('icloud'),{success:false,errorCode:code});
    assert.equal(f.preferences.read().cloudFolders.icloud,'/chosen/'+suffix);
  }
  assert.equal(f.opened.length,0);
});
test('open uses exact chosen path; removing only bookmark preserves other providers and files', async () => {
  const f = fixture(); await f.service.select('google','/chosen/google'); await f.service.select('icloud','/chosen/icloud');
  assert.deepEqual(await f.service.open('google'),{success:true}); assert.deepEqual(f.opened,['/chosen/google']);
  assert.deepEqual(await f.service.remove('google'),{id:'google',path:null,status:'none'});
  assert.deepEqual(f.preferences.read().cloudFolders,{icloud:'/chosen/icloud'});
  assert.deepEqual(await f.service.open('google'),{success:false,errorCode:'NO_FOLDER'});
});
test('invalid providers and relative/nul paths are rejected without mutation or filesystem access', async () => {
  const f = fixture(); const original = f.preferences.read();
  for (const id of ['dropbox','__proto__',null,{},'Google']) for (const method of ['inspect','select','remove','open']) await assert.rejects(f.service[method](id,'/chosen/test'),/INVALID_PROVIDER/);
  for (const selected of ['relative','/bad\0path',null]) await assert.rejects(f.service.select('google',selected),/INVALID_FOLDER/);
  assert.deepEqual(f.preferences.read(),original); assert.equal(f.checked.length,0);
});
test('IPC accepts only owned windows; cancelled dialog preserves bookmark; owner rechecked after dialog', async () => {
  const f = fixture(), handlers = {}, wc = {isDestroyed:()=>false}, wm = {controlPanelWindow:{webContents:wc}}; let dialogs=0, closeDuringDialog=false;
  registerNbCloudFolderHandlers({ipcMain:{handle:(n,h)=>handlers[n]=h},windowManager:wm,preferences:f.preferences,fileSystem:f.fileSystem,shell:{openPath:f.openPath},dialog:{showOpenDialog:async(window,options)=>{
    dialogs++; assert.equal(window,wm.controlPanelWindow); assert.deepEqual(options.properties,['openDirectory']);
    if(closeDuringDialog) wm.controlPanelWindow=null;
    return {canceled:!closeDuringDialog,filePaths:closeDuringDialog?['/chosen/new']:[]};
  }}});
  for(const name of Object.keys(handlers)) await assert.rejects(handlers[name]({sender:{}},'google'),/UNAUTHORIZED/);
  assert.equal(dialogs,0); const event={sender:wc}; await f.service.select('google','/chosen/original');
  await assert.rejects(handlers['nb-cloud-folder-choose'](event,'unknown'),/INVALID_PROVIDER/); assert.equal(dialogs,0);
  assert.deepEqual(await handlers['nb-cloud-folder-choose'](event,'google'),{cancelled:true}); assert.equal(f.preferences.read().cloudFolders.google,'/chosen/original');
  closeDuringDialog=true; await assert.rejects(handlers['nb-cloud-folder-choose'](event,'google'),/UNAUTHORIZED/); assert.equal(f.preferences.read().cloudFolders.google,'/chosen/original');
});
