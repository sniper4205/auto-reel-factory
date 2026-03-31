const { app, BrowserWindow } = require('electron');
const createServer = require('../backend/server');

let mainWindow;
let serverInstance;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 950,
    webPreferences: {
      contextIsolation: true,
    },
  });

  mainWindow.loadURL('http://localhost:5050');
}

app.whenReady().then(() => {
  // Start only the backend API server.
  // Do NOT start imageServer.py from Electron.
  serverInstance = createServer(5050);

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (serverInstance && typeof serverInstance.close === 'function') {
    serverInstance.close();
  }
});
