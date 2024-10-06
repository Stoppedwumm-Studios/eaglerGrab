const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    start: () => ipcRenderer.invoke('start'),
})