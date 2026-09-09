/**
 * Electron Main Process Entry Point.
 * Initializes background overlay window, settings preferences window, system tray menu, and calendar triggers.
 */
const { app, BrowserWindow, screen, ipcMain, shell, Tray, Menu, nativeImage } = require("electron");
const path = require("path");
const configManager = require("./config");
const calendarService = require("./calendar/calendar-service");
const googleProvider = require("./calendar/google-provider");

let overlayWindow = null;
let settingsWindow = null;
let tray = null;
let isAnimating = false;

// Width of the active overlay viewport
const OVERLAY_WIDTH = 420;

/**
 * Creates the transparent, click-through, always-on-top overlay window across primary display bounds.
 */
function createOverlayWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.bounds;

  overlayWindow = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    focusable: false,
    skipTaskbar: true,
    show: false, // Hidden until meeting swat trigger
    webPreferences: {
      preload: path.join(__dirname, "preload/overlay-preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWindow.setAlwaysOnTop(true, "screen-saver");

  overlayWindow.loadFile(path.join(__dirname, "../renderer/overlay/index.html"));

  overlayWindow.on("closed", () => {
    overlayWindow = null;
  });
}

/**
 * Synchronizes overlay window dimensions to primary display resolution changes.
 */
function repositionOverlay() {
  if (!overlayWindow) return;
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.bounds;
  overlayWindow.setBounds({ x: 0, y: 0, width: width, height: height });
}

/**
 * Creates or focuses the settings and preferences BrowserWindow with native vibrancy.
 */
function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.show();
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 560,
    height: 660,
    resizable: false,
    maximizable: false,
    title: "Calendar Companions Settings",
    titleBarStyle: "hidden",
    trafficLightPosition: { x: 18, y: 18 },
    transparent: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload/settings-preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  settingsWindow.loadFile(path.join(__dirname, "../renderer/settings/index.html"));

  settingsWindow.on("closed", () => {
    settingsWindow = null;
  });
}

/**
 * Configures the macOS menu bar tray icon and associated context menu items.
 */
function setupTray() {
  const iconPath = path.join(__dirname, "../renderer/assets/tray/trayTemplate.png");
  let icon;
  try {
    icon = nativeImage.createFromPath(iconPath);
    icon.setTemplateImage(true); // Adapts to macOS light and dark menu bar aesthetics
  } catch (err) {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip("Calendar Animal Companions");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "🐾 Calendar Animal Companions",
      enabled: false
    },
    { type: "separator" },
    {
      label: "✨ Test Companion Swat",
      click: () => {
        triggerSwat({
          title: "Architecture Review",
          minutes: configManager.get().leadTimeMinutes || 5,
          location: "Zoom Call",
          meetingUrl: "https://meet.google.com/abc-defg-hij"
        });
      }
    },
    {
      label: "⚙️ Preferences...",
      click: () => createSettingsWindow()
    },
    { type: "separator" },
    {
      label: "Quit",
      accelerator: "Command+Q",
      click: () => app.quit()
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.on("click", () => createSettingsWindow());
}

/**
 * Dispatches a swat notification sequence to the overlay renderer with active configuration.
 * @param {Object} eventData - Meeting details payload.
 */
function triggerSwat(eventData) {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    createOverlayWindow();
  }

  repositionOverlay();
  overlayWindow.showInactive();

  const config = configManager.get();
  const payload = {
    ...eventData,
    animalCompanion: config.animalCompanion || "cat",
    soundEnabled: config.soundEnabled,
    soundVolume: config.soundVolume,
    cornerPosition: config.cornerPosition
  };

  if (overlayWindow.webContents.isLoading()) {
    overlayWindow.webContents.once("did-finish-load", () => {
      overlayWindow.webContents.send("trigger-cat-event", payload);
    });
  } else {
    overlayWindow.webContents.send("trigger-cat-event", payload);
  }
}

// IPC Handler: Retrieve current configuration
ipcMain.handle("get-config", () => {
  return {
    ...configManager.get(),
    hasGoogleToken: configManager.hasGoogleToken()
  };
});

// IPC Handler: Persist modified configuration and trigger immediate calendar re-poll
ipcMain.handle("save-config", (event, newConfig) => {
  const saved = configManager.saveConfig(newConfig);
  repositionOverlay();
  calendarService.poll();
  return saved;
});

// IPC Handler: Initiate Google OAuth loopback flow
ipcMain.handle("start-google-auth", async () => {
  return new Promise((resolve, reject) => {
    googleProvider.startAuthFlow(
      () => {
        if (settingsWindow) settingsWindow.webContents.send("google-auth-success");
        calendarService.poll();
        resolve(true);
      },
      (err) => {
        if (settingsWindow) settingsWindow.webContents.send("google-auth-error", err.message);
        reject(err);
      }
    );
  });
});

// IPC Handler: Clear Google OAuth credentials
ipcMain.handle("disconnect-google", () => {
  configManager.clearGoogleToken();
  return true;
});

// IPC Listener: Trigger manual demonstration swat animation
ipcMain.on("test-cat-swat", (event, customTitle) => {
  triggerSwat({
    title: customTitle || "Quarterly Product Sync",
    minutes: configManager.get().leadTimeMinutes || 5,
    location: "Google Meet",
    meetingUrl: "https://meet.google.com/cat-swat-demo"
  });
});

// IPC Listener: Open video meeting link in default system web browser
ipcMain.on("open-meeting-url", (event, meetingUrl) => {
  if (meetingUrl && (meetingUrl.startsWith("http://") || meetingUrl.startsWith("https://"))) {
    shell.openExternal(meetingUrl);
  }
});

// IPC Listener: Dynamically toggle overlay mouse events forward mode
ipcMain.on("set-overlay-ignore-mouse", (event, ignore) => {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.setIgnoreMouseEvents(ignore, { forward: true });
  }
});

// IPC Listener: Hide overlay window upon complete animation cycle
ipcMain.on("cat-animation-done", () => {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.hide();
  }
});

// Application lifecycle setup
app.whenReady().then(() => {
  createOverlayWindow();
  setupTray();
  createSettingsWindow();

  calendarService.onTrigger((eventData) => {
    triggerSwat(eventData);
  });

  calendarService.start();
});

// Keep main process active in system tray when all windows close
app.on("window-all-closed", (e) => {
  e.preventDefault();
});
