const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    openDirectoryDialog: () => ipcRenderer.invoke('open-directory-dialog'),
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    writeFile: (filePath, data) => ipcRenderer.invoke('write-file', filePath, data),
    decode: (data, encoding) => ipcRenderer.invoke('decode', data, encoding), // Handle decoding in main process if necessary
    joinPath: (...args) => ipcRenderer.invoke('join-path', ...args),
    basename: (filePath) => ipcRenderer.invoke('basename', filePath),
    getDesktopPath: () => ipcRenderer.invoke('get-desktop-path'),
    copyFile: (sourcePath, destinationPath) => ipcRenderer.invoke('copy-file', sourcePath, destinationPath),
    send: (channel, data) => {
        let validChannels = ["show-in-folder"];  // List of valid channels
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
});
