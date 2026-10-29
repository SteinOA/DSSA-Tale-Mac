// DSSA Tale is distributed manually. Never load an upstream update provider:
// installing OpenWhispr's generic update would replace the local NB edition.
class UpdateManager {
  constructor() {
    this.updateAvailable = false;
    this.updateDownloaded = false;
    this.lastUpdateInfo = null;
    this.isInstalling = false;
    this.isDownloading = false;
    this.isQuittingForUpdate = false;
    this.windowManager = null;
  }
  setWindowManager(windowManager) { this.windowManager = windowManager; }
  setupAutoUpdater() {}
  checkForUpdatesOnStartup() {}
  _autoCheckForUpdates() {}
  async checkForUpdates() {
    return { updateAvailable: false, message: "Oppdateringer er deaktivert i NB-utgaven." };
  }
  async downloadUpdate() {
    return { success: false, message: "NB-utgaven oppdateres manuelt." };
  }
  async installUpdate() {
    return { success: false, message: "NB-utgaven oppdateres manuelt." };
  }
  async getAppVersion() { return { version: require("electron").app.getVersion() }; }
  async getUpdateStatus() {
    return { updateAvailable: false, updateDownloaded: false, isDevelopment: process.env.NODE_ENV === "development" };
  }
  async getUpdateInfo() { return null; }
  cleanup() { this.windowManager = null; }
}
module.exports = UpdateManager;
