/**
 * Configuration persistence and secure credential storage manager.
 * Manages user preferences in JSON and encrypts OAuth tokens via Electron safeStorage.
 */
const fs = require("fs");
const path = require("path");
const os = require("os");
const electron = require("electron");
const app = electron.app;
const safeStorage = electron.safeStorage;

// Resolve user data directory path across production and test execution environments
const USER_DATA = app ? app.getPath("userData") : path.join(os.homedir(), ".calendar-companions");
const CONFIG_PATH = path.join(USER_DATA, "cat_config.json");
const ENCRYPTED_TOKEN_PATH = path.join(USER_DATA, "google_token.enc");

// Default application configuration settings
const DEFAULT_CONFIG = {
  provider: "ical", // 'ical' | 'google' | 'both'
  leadTimeMinutes: 5,
  animalCompanion: "cat", // 'cat' | 'dog' | 'monkey' | 'rabbit' | 'panda' | 'unicorn'
  soundEnabled: true,
  soundVolume: 0.7,
  cornerPosition: "top-right", // 'top-right' | 'top-left'
  autoCatchOnHover: true,
  googleClientId: "",
  googleClientSecret: "",
  snoozeDuration: 5
};

/**
 * Handles persistent configuration loading, updating, and secure token encryption.
 */
class ConfigManager {
  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Loads configuration from disk, falling back to default values on missing file or parse errors.
   * @returns {Object} Active configuration object.
   */
  loadConfig() {
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
        return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
      }
    } catch (err) {
      console.error("[ConfigManager] Failed to load config, fallback to defaults:", err);
    }
    return { ...DEFAULT_CONFIG };
  }

  /**
   * Merges partial configuration updates and writes the result to disk synchronously.
   * @param {Object} newValues - Partial configuration object to persist.
   * @returns {Object} Updated configuration object.
   */
  saveConfig(newValues) {
    this.config = { ...this.config, ...newValues };
    try {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(this.config, null, 2), "utf-8");
    } catch (err) {
      console.error("[ConfigManager] Failed to write config:", err);
    }
    return this.config;
  }

  /**
   * Retrieves a copy of current configuration settings.
   * @returns {Object} Clone of current settings.
   */
  get() {
    return { ...this.config };
  }

  /**
   * Securely encrypts and persists Google OAuth tokens using Electron safeStorage (macOS Keychain).
   * @param {Object} tokens - Google OAuth credentials and refresh tokens.
   * @returns {boolean} True if successfully stored, false otherwise.
   */
  saveGoogleToken(tokens) {
    try {
      const json = JSON.stringify(tokens);
      if (safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(json);
        fs.writeFileSync(ENCRYPTED_TOKEN_PATH, encrypted);
      } else {
        // Fallback if encryption unavailable
        fs.writeFileSync(ENCRYPTED_TOKEN_PATH, Buffer.from(json).toString("base64"));
      }
      return true;
    } catch (err) {
      console.error("[ConfigManager] Failed to securely save Google token:", err);
      return false;
    }
  }

  /**
   * Retrieves and decrypts the stored Google OAuth credentials.
   * @returns {Object|null} Decrypted token object or null if unavailable.
   */
  getGoogleToken() {
    try {
      if (!fs.existsSync(ENCRYPTED_TOKEN_PATH)) {
        return null;
      }
      const raw = fs.readFileSync(ENCRYPTED_TOKEN_PATH);
      if (safeStorage.isEncryptionAvailable()) {
        const decrypted = safeStorage.decryptString(raw);
        return JSON.parse(decrypted);
      } else {
        const decoded = Buffer.from(raw.toString("utf-8"), "base64").toString("utf-8");
        return JSON.parse(decoded);
      }
    } catch (err) {
      console.error("[ConfigManager] Failed to decrypt Google token:", err);
      return null;
    }
  }

  /**
   * Checks whether a persisted Google OAuth token file exists.
   * @returns {boolean} True if token file exists.
   */
  hasGoogleToken() {
    return fs.existsSync(ENCRYPTED_TOKEN_PATH);
  }

  /**
   * Removes the encrypted token file from disk to disconnect Google Calendar.
   */
  clearGoogleToken() {
    try {
      if (fs.existsSync(ENCRYPTED_TOKEN_PATH)) {
        fs.unlinkSync(ENCRYPTED_TOKEN_PATH);
      }
    } catch (err) {
      console.error("[ConfigManager] Failed to remove Google token:", err);
    }
  }
}

module.exports = new ConfigManager();
