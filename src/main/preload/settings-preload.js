/**
 * Preload script for the preferences and configuration settings window.
 * Exposes catSettingsAPI methods for configuration persistence and Google OAuth flows.
 */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("catSettingsAPI", {
  getConfig: () => ipcRenderer.invoke("get-config"),
  saveConfig: (newConfig) => ipcRenderer.invoke("save-config", newConfig),
  startGoogleAuth: () => ipcRenderer.invoke("start-google-auth"),
  disconnectGoogle: () => ipcRenderer.invoke("disconnect-google"),
  triggerTestSwat: (customTitle) => ipcRenderer.send("test-cat-swat", customTitle),
  openExternal: (url) => ipcRenderer.send("open-meeting-url", url),
  onAuthSuccess: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("google-auth-success", handler);
    return () => ipcRenderer.removeListener("google-auth-success", handler);
  },
  onAuthError: (callback) => {
    const handler = (event, err) => callback(err);
    ipcRenderer.on("google-auth-error", handler);
    return () => ipcRenderer.removeListener("google-auth-error", handler);
  }
});
