const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Renderer -> Main (Invocations)
  selectBrowser: (payload) => ipcRenderer.invoke('browser:select', payload),
  startCapture: (payload) => ipcRenderer.invoke('slides:start-capture', payload),
  selectDirectory: () => ipcRenderer.invoke('dialog:select-directory'),
  transferFiles: (payload) => ipcRenderer.invoke('files:transfer', payload),

  // Main -> Renderer (Events / Listeners)
  onCaptureProgress: (callback) => ipcRenderer.on('capture:progress', (_event, value) => callback(value)),
  onCaptureComplete: (callback) => ipcRenderer.on('capture:complete', (_event, value) => callback(value)),
  onTransferComplete: (callback) => ipcRenderer.on('transfer:complete', (_event, value) => callback(value)),
  onCaptureError: (callback) => ipcRenderer.on('capture:error', (_event, value) => callback(value)),
  
  // Remove Listeners (cleanup)
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
