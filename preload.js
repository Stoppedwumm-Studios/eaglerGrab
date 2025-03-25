const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('eaglerGrabAPI', {
    start: () => ipcRenderer.invoke('start'),
    devbuild: () => ipcRenderer.invoke('devbuild'),
    arch: () => ipcRenderer.invoke('arch'),
})