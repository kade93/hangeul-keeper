const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false,
            sandbox: false,
        }
    });
    win.loadFile('index.html');
    win.webContents.openDevTools();
};

app.whenReady().then(() => {
    createWindow();
    ipcMain.handle('open-directory-dialog', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory']
        });
        return result.filePaths && result.filePaths.length > 0 ? result.filePaths[0] : null;
    });

    ipcMain.handle('read-file', async (event, filePath) => {
        try {
            const data = fs.readFileSync(filePath); // This correctly returns a Buffer
            console.log("Buffer Length:", data.length);
            console.log("Buffer content sample:", data.toString('utf-8', 0, 100));  // Preview first 100 chars
            return data; // Ensure this Buffer is correctly sent to renderer
        } catch (error) {
            console.error('Error reading file:', error);
            throw new Error('Failed to read file');
        }
    });

    ipcMain.handle('write-file', async (event, filePath, data) => {
        try {
            fs.writeFileSync(filePath, data);
            return { success: true };
        } catch (error) {
            return { error: error.message };
        }
    });

    // Handle IPC call for desktop path
    ipcMain.handle('get-desktop-path', async () => {
        return path.join(os.homedir(), 'Desktop');
    });

    ipcMain.handle('decode', async (event, buffer, encoding) => {
        try {
            if (!Buffer.isBuffer(buffer)) {
                throw new TypeError('Expected buffer for decoding');
            }
            return buffer.toString(encoding || 'utf-8');  // Convert buffer to string with specified encoding
        } catch (error) {
            console.error('Error decoding data:', error);
            throw new Error('Failed to decode data');
        }
    });

    ipcMain.handle('join-path', async (event, ...paths) => {
        return path.join(...paths);
    });

    ipcMain.handle('copy-file', async (event, sourcePath, destinationPath) => {
        try {
            await fs.copyFile(sourcePath, destinationPath, (err) => {
                if (err) {
                    console.error('Failed to copy file:', err);
                    event.sender.send('copy-file-error', { error: err.message });
                } else {
                    console.log('File copied successfully');
                    event.sender.send('copy-file-success', { success: true });
                }
            });
        } catch (error) {
            console.error('Failed to copy file:', error);
            event.sender.send('copy-file-error', { error: error.message });
        }
    });
    
    ipcMain.on('show-in-folder', async (event, filePath) => {
        shell.showItemInFolder(filePath);
    });

});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

require('electron-reload')(__dirname, {
    electron: require(`${__dirname}/node_modules/electron`)
});
