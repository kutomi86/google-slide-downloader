const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),

  // Renderer -> Main (Invocations)
  checkForUpdates: () => ipcRenderer.invoke('updates:check'),
  downloadUpdate: () => ipcRenderer.invoke('updates:download'),
  installUpdate: () => ipcRenderer.invoke('updates:install'),
  selectBrowser: (payload) => ipcRenderer.invoke('browser:select', payload),
  startCapture: (payload) => ipcRenderer.invoke('slides:start-capture', payload),
  selectDirectory: () => ipcRenderer.invoke('dialog:select-directory'),
  transferFiles: (payload) => ipcRenderer.invoke('files:transfer', payload),

  // Main -> Renderer (Events / Listeners)
  onUpdateChecking: (callback) => ipcRenderer.on('update:checking', (_event, value) => callback(value)),
  onUpdateAvailable: (callback) => ipcRenderer.on('update:available', (_event, value) => callback(value)),
  onUpdateNotAvailable: (callback) => ipcRenderer.on('update:not-available', (_event, value) => callback(value)),
  onUpdateDownloadProgress: (callback) => ipcRenderer.on('update:download-progress', (_event, value) => callback(value)),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update:downloaded', (_event, value) => callback(value)),
  onUpdateError: (callback) => ipcRenderer.on('update:error', (_event, value) => callback(value)),
  onCaptureProgress: (callback) => ipcRenderer.on('capture:progress', (_event, value) => callback(value)),
  onCaptureComplete: (callback) => ipcRenderer.on('capture:complete', (_event, value) => callback(value)),
  onTransferComplete: (callback) => ipcRenderer.on('transfer:complete', (_event, value) => callback(value)),
  onCaptureError: (callback) => ipcRenderer.on('capture:error', (_event, value) => callback(value)),
  
  // Remove Listeners (cleanup)
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
