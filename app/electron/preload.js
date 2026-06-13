const { contextBridge, ipcRenderer } = require('electron');

// ── API exposée au renderer (React app) ───────────────────────────────────────
// Seules les fonctions listées ici sont accessibles depuis le renderer.
// contextIsolation: true garantit que le renderer ne peut pas accéder à Node.js.

contextBridge.exposeInMainWorld('electronAPI', {
  // Info app
  getVersion:      () => ipcRenderer.invoke('get-app-version'),

  // Config API URL (pour pointner vers le bon serveur)
  getApiUrl:       () => ipcRenderer.invoke('get-api-url'),
  setApiUrl:       (url) => ipcRenderer.invoke('set-api-url', url),

  // Utilitaires
  openExternal:    (url) => ipcRenderer.invoke('open-external', url),
  minimizeToTray:  () => ipcRenderer.invoke('minimize-to-tray'),

  // Notifications natives Windows
  showNotification: (opts) => ipcRenderer.invoke('show-notification', opts),

  // Détection contexte Electron (utile pour adapter l'UI)
  isElectron: true,
});
