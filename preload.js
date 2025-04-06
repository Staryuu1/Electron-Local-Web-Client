const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onServerFound: (callback) => ipcRenderer.on('server-found', callback),
  onListFound: (callback) => ipcRenderer.on('list-found', (_event, data) => callback(data)),
  openServer: (url) => ipcRenderer.send('open-server', url),
  rescanServers: () => ipcRenderer.send('rescan-servers'),
  submitCustomPort: (port) => ipcRenderer.send('submit-custom-port', port),
  cancelCustomPort: () => ipcRenderer.send('cancel-custom-port'),
  openSettings: () => ipcRenderer.send('open-settings'),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings) => ipcRenderer.send('save-settings', settings)
});
