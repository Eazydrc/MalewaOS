const { app, BrowserWindow, Tray, Menu, shell, ipcMain, dialog, nativeImage } = require('electron');
const path = require('path');
const fs   = require('fs');

// ── Config ────────────────────────────────────────────────────────────────────

const CONFIG_PATH = path.join(app.getPath('userData'), 'elengi-config.json');
const IS_DEV      = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function writeConfig(data) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));
  } catch {}
}

// ── Variables globales ────────────────────────────────────────────────────────

let mainWindow = null;
let tray       = null;
let isQuitting = false;

// ── Création fenêtre principale ───────────────────────────────────────────────

function createWindow() {
  const config = readConfig();

  mainWindow = new BrowserWindow({
    width:           config.width  ?? 1280,
    height:          config.height ?? 800,
    minWidth:        1024,
    minHeight:       600,
    x:               config.x,
    y:               config.y,
    maximized:       config.maximized ?? false,
    title:           'Elengi — Restaurants Kinshasa',
    icon:            path.join(__dirname, 'icon.png'),
    backgroundColor: '#ffffff',
    show:            false,  // montré après chargement
    webPreferences: {
      preload:            path.join(__dirname, 'preload.js'),
      contextIsolation:   true,
      nodeIntegration:    false,
      webSecurity:        true,
    },
  });

  // Restaurer état fenêtre
  if (config.maximized) mainWindow.maximize();

  // Charger l'app
  if (IS_DEV) {
    const devPort = process.env.VITE_PORT ?? 4000;
    mainWindow.loadURL(`http://localhost:${devPort}`);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Afficher quand prêt (évite l'éclair blanc)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (config.maximized) mainWindow.maximize();
  });

  // Sauvegarder taille/position à la fermeture
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide(); // Minimiser dans la tray au lieu de quitter
      return;
    }
    const bounds    = mainWindow.getBounds();
    const maximized = mainWindow.isMaximized();
    writeConfig({ ...readConfig(), ...bounds, maximized });
  });

  // Ouvrir les liens externes dans le navigateur système
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });

  // Empêcher la navigation vers des URLs externes dans la fenêtre principale
  mainWindow.webContents.on('will-navigate', (e, url) => {
    const appUrl = IS_DEV ? `http://localhost:${process.env.VITE_PORT ?? 4000}` : 'file://';
    if (!url.startsWith(appUrl) && !url.startsWith('file://')) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });
}

// ── Tray icon ─────────────────────────────────────────────────────────────────

function createTray() {
  const iconPath = path.join(__dirname, 'icon.png');
  const icon = nativeImage.createFromPath(iconPath);
  const trayIcon = icon.isEmpty()
    ? nativeImage.createFromNamedImage('NSImageNameApplicationIcon')
    : icon.resize({ width: 16, height: 16 });

  tray = new Tray(trayIcon);
  tray.setToolTip('Elengi — Restaurants Kinshasa');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Ouvrir Elengi',
      click: () => { mainWindow.show(); mainWindow.focus(); },
    },
    {
      label: 'Dashboard',
      click: () => {
        mainWindow.show();
        mainWindow.webContents.executeJavaScript(`window.location.href = '/dashboard'`);
      },
    },
    { type: 'separator' },
    {
      label: 'Paramètres',
      click: () => { mainWindow.show(); mainWindow.webContents.executeJavaScript(`window.location.href = '/mon-restaurant'`); },
    },
    { type: 'separator' },
    {
      label: 'Quitter',
      click: () => { isQuitting = true; app.quit(); },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => { mainWindow.show(); mainWindow.focus(); });
}

// ── Menu application ──────────────────────────────────────────────────────────

function buildMenu() {
  const template = [
    {
      label: 'Elengi',
      submenu: [
        { label: 'À propos', role: 'about' },
        { type: 'separator' },
        { label: 'Quitter', accelerator: 'CmdOrCtrl+Q', click: () => { isQuitting = true; app.quit(); } },
      ],
    },
    {
      label: 'Navigation',
      submenu: [
        { label: 'Dashboard',     accelerator: 'CmdOrCtrl+1', click: () => mainWindow.webContents.executeJavaScript(`window.location.href='/dashboard'`) },
        { label: 'Mon restaurant',accelerator: 'CmdOrCtrl+2', click: () => mainWindow.webContents.executeJavaScript(`window.location.href='/mon-restaurant'`) },
        { label: 'Commandes',     accelerator: 'CmdOrCtrl+3', click: () => mainWindow.webContents.executeJavaScript(`window.location.href='/dashboard'`) },
        { type: 'separator' },
        { label: 'Actualiser',    accelerator: 'CmdOrCtrl+R', click: () => mainWindow.reload() },
      ],
    },
    {
      label: 'Affichage',
      submenu: [
        { label: 'Plein écran',   accelerator: 'F11',          role: 'togglefullscreen' },
        { label: 'Zoom +',        accelerator: 'CmdOrCtrl+=',  role: 'zoomin' },
        { label: 'Zoom -',        accelerator: 'CmdOrCtrl+-',  role: 'zoomout' },
        { label: 'Zoom normal',   accelerator: 'CmdOrCtrl+0',  role: 'resetzoom' },
        { type: 'separator' },
        { label: 'DevTools',      accelerator: 'F12',          click: () => mainWindow.webContents.toggleDevTools() },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── IPC handlers ──────────────────────────────────────────────────────────────

ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('get-api-url', () => {
  const config = readConfig();
  return config.apiUrl ?? null;
});

ipcMain.handle('set-api-url', (_, url) => {
  writeConfig({ ...readConfig(), apiUrl: url });
  // Reload pour prendre en compte le nouvel URL
  mainWindow.reload();
  return true;
});

ipcMain.handle('open-external', (_, url) => shell.openExternal(url));

ipcMain.handle('show-notification', (_, { title, body }) => {
  // Notification native Windows
  const { Notification } = require('electron');
  if (Notification.isSupported()) {
    new Notification({ title, body, icon: path.join(__dirname, 'icon.png') }).show();
  }
});

ipcMain.handle('minimize-to-tray', () => mainWindow.hide());

// ── Lifecycle ─────────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow();
  createTray();
  buildMenu();

  // Re-créer la fenêtre si l'app est rouverte (macOS)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else { mainWindow.show(); mainWindow.focus(); }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => { isQuitting = true; });

// Empêcher plusieurs instances
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}
