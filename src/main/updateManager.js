const { app } = require('electron');
const { autoUpdater } = require('electron-updater');

function createUpdateManager(mainWindow) {
  let updateAvailable = false;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.allowPrerelease = false;
  autoUpdater.logger = console;

  const sendToRenderer = (channel, payload = {}) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(channel, payload);
    }
  };

  autoUpdater.on('checking-for-update', () => {
    sendToRenderer('update:checking');
  });

  autoUpdater.on('update-available', (info) => {
    updateAvailable = true;
    sendToRenderer('update:available', {
      version: info.version,
      releaseName: info.releaseName || '',
      releaseNotes: info.releaseNotes || '',
    });
  });

  autoUpdater.on('update-not-available', (info) => {
    updateAvailable = false;
    sendToRenderer('update:not-available', {
      version: info.version || '',
    });
  });

  autoUpdater.on('download-progress', (progress) => {
    sendToRenderer('update:download-progress', progress);
  });

  autoUpdater.on('update-downloaded', (info) => {
    sendToRenderer('update:downloaded', {
      version: info.version,
      releaseName: info.releaseName || '',
      releaseNotes: info.releaseNotes || '',
    });
  });

  autoUpdater.on('error', (error) => {
    updateAvailable = false;
    sendToRenderer('update:error', {
      message: error.message,
    });
  });

  async function checkForUpdates() {
    if (!app.isPackaged) {
      return {
        success: false,
        error: 'Automatic updates are only available in packaged builds.',
      };
    }

    const result = await autoUpdater.checkForUpdates();
    const updateInfo = result?.updateInfo || null;

    updateAvailable = !!updateInfo;

    return {
      success: true,
      isNewerVersionAvailable: !!updateInfo,
      updateInfo: updateInfo
        ? {
            version: updateInfo.version || '',
            releaseName: updateInfo.releaseName || '',
            releaseNotes: updateInfo.releaseNotes || '',
          }
        : null,
    };
  }

  async function downloadUpdate() {
    if (!app.isPackaged) {
      throw new Error('Automatic updates are only available in packaged builds.');
    }

    if (!updateAvailable) {
      throw new Error('No update is available to download.');
    }

    await autoUpdater.downloadUpdate();
    return { success: true };
  }

  async function installUpdate() {
    if (!app.isPackaged) {
      throw new Error('Automatic updates are only available in packaged builds.');
    }

    autoUpdater.quitAndInstall(false, true);
    return { success: true };
  }

  return {
    checkForUpdates,
    downloadUpdate,
    installUpdate,
  };
}

module.exports = createUpdateManager;