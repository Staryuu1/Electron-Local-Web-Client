const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onServerFound: (callback) => ipcRenderer.on('server-found', callback),
});
