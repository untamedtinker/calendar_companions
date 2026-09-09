/**
 * Preload script for the transparent overlay window.
 * Exposes a restricted catOverlayAPI surface to renderer context via contextBridge.
 */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("catOverlayAPI", {
  onTriggerCat: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on("trigger-cat-event", handler);
    return () => ipcRenderer.removeListener("trigger-cat-event", handler);
  },
  openMeetingUrl: (url) => ipcRenderer.send("open-meeting-url", url),
  notifyAnimationComplete: () => ipcRenderer.send("cat-animation-done"),
  setIgnoreMouseEvents: (ignore) => ipcRenderer.send("set-overlay-ignore-mouse", ignore)
});
