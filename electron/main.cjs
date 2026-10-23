const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const entry = pathToFileURL(path.join(__dirname, '..', 'dist', 'index.html')).href;
function openExternal(url) {
  try { if (new URL(url).protocol === 'https:') void shell.openExternal(url); } catch { /* Reject malformed URLs. */ }
}
function createWindow() {
  const window = new BrowserWindow({
    width: 1200, height: 850, minWidth: 360, minHeight: 600,
    title: 'Tukio', icon: path.join(__dirname, '..', 'dist', 'pwa-512x512.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true },
  });
  window.webContents.setWindowOpenHandler(({ url }) => { openExternal(url); return { action: 'deny' }; });
  window.webContents.on('will-navigate', (event, url) => {
    if (url.split('#')[0] !== entry) { event.preventDefault(); openExternal(url); }
  });
  void window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}
app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });