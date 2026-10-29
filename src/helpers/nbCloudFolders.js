const fs = require('node:fs');
const path = require('node:path');
const PROVIDERS = Object.freeze(['google', 'onedrive', 'icloud']);
const NAMES = { google: 'Google Disk', onedrive: 'OneDrive / SharePoint', icloud: 'iCloud Drive' };
function createCloudFolders({ preferences, fileSystem = fs.promises, openPath }) {
  const validate = id => { if (!PROVIDERS.includes(id)) throw new Error('INVALID_PROVIDER'); };
  const selectedPaths = () => {
    const stored = preferences.read()?.cloudFolders;
    const result = {};
    for (const id of PROVIDERS) {
      const value = stored?.[id];
      if (typeof value === 'string' && path.isAbsolute(value) && !value.includes('\0')) result[id] = value;
    }
    return result;
  };
  async function inspect(id) {
    validate(id);
    const selected = selectedPaths()[id];
    if (!selected) return { id, path: null, status: 'none' };
    try {
      const stat = await fileSystem.stat(selected);
      if (!stat.isDirectory()) return { id, path: selected, status: 'missing' };
      // Read/search only. No directory enumeration, hydration, write probe or
      // automatic copying. Available does not mean the cloud is synchronized.
      await fileSystem.access(selected, fs.constants.R_OK | fs.constants.X_OK);
      return { id, path: selected, status: 'available' };
    } catch (error) {
      return { id, path: selected, status: ['ENOENT', 'ENOTDIR'].includes(error.code) ? 'missing' : 'denied' };
    }
  }
  return {
    inspect,
    get: async () => ({ providers: await Promise.all(PROVIDERS.map(inspect)) }),
    async select(id, selected) {
      validate(id);
      if (typeof selected !== 'string' || !path.isAbsolute(selected) || selected.includes('\0')) throw new Error('INVALID_FOLDER');
      preferences.update({ cloudFolders: { ...selectedPaths(), [id]: path.normalize(selected) } });
      return inspect(id);
    },
    async remove(id) {
      validate(id);
      const next = selectedPaths(); delete next[id];
      preferences.update({ cloudFolders: next });
      return { id, path: null, status: 'none' };
    },
    async open(id) {
      validate(id);
      const folder = await inspect(id);
      if (folder.status !== 'available') return { success: false, errorCode: folder.status === 'none' ? 'NO_FOLDER' : folder.status === 'missing' ? 'FOLDER_MISSING' : 'FOLDER_DENIED' };
      try {
        const error = await openPath(folder.path);
        return error ? { success: false, errorCode: 'OPEN_FAILED' } : { success: true };
      } catch { return { success: false, errorCode: 'OPEN_FAILED' }; }
    },
  };
}
function registerNbCloudFolderHandlers({ ipcMain, dialog, shell, windowManager, preferences = require('./nbPreferences'), getLanguage = () => 'nb', fileSystem }) {
  const service = createCloudFolders({ preferences, fileSystem, openPath: selected => shell.openPath(selected) });
  const owner = event => event?.sender && !event.sender.isDestroyed?.() &&
    (event.sender === windowManager.controlPanelWindow?.webContents ? windowManager.controlPanelWindow :
      event.sender === windowManager.mainWindow?.webContents ? windowManager.mainWindow : null);
  const authorize = event => { const window = owner(event); if (!window) throw new Error('UNAUTHORIZED'); return window; };
  ipcMain.handle('nb-cloud-folders-get', async event => { authorize(event); return service.get(); });
  ipcMain.handle('nb-cloud-folder-choose', async (event, id) => {
    const window = authorize(event);
    const current = await service.inspect(id); // validates before opening dialog
    const language = getLanguage();
    const title = language === 'en' ? `Choose folder for ${NAMES[id]}` : language === 'nn' ? `Vel mappe for ${NAMES[id]}` : `Velg mappe for ${NAMES[id]}`;
    const result = await dialog.showOpenDialog(window, {
      title, properties: ['openDirectory'],
      ...(current.status === 'available' ? { defaultPath: current.path } : {}),
    });
    authorize(event); // A closed/replaced renderer cannot complete an old request.
    if (result.canceled || !result.filePaths?.length) return { cancelled: true };
    return service.select(id, result.filePaths[0]);
  });
  ipcMain.handle('nb-cloud-folder-open', async (event, id) => { authorize(event); return service.open(id); });
  ipcMain.handle('nb-cloud-folder-remove', async (event, id) => { authorize(event); return service.remove(id); });
  return service;
}
module.exports = { createCloudFolders, registerNbCloudFolderHandlers };
