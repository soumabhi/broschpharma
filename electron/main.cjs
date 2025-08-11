// electron/main.js
const { app, BrowserWindow, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const startUrl =
    process.env.VITE_DEV_SERVER_URL ||
    `file://${path.join(__dirname, "../dist/index.html")}`;
  win.loadURL(startUrl);

  // Log load failures
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Page failed to load:', errorDescription, validatedURL);
  });
  // Log renderer console messages
  win.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log('Renderer:', message);
  });

  // Auto-updater: check for updates after window is ready
  win.once('ready-to-show', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });
}

app.whenReady().then(() => {
  createWindow();

  // Listen for update events
  autoUpdater.on('update-available', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update available',
      message: 'A new update is available. Downloading now...'
    });
  });
  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update ready',
      message: 'A new update is ready. Restart the app to apply the update.'
    }).then(() => {
      autoUpdater.quitAndInstall();
    });
  });
  autoUpdater.on('error', (err) => {
    dialog.showErrorBox('Update error', err == null ? 'unknown' : (err.stack || err).toString());
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
