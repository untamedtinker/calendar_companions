/**
 * Settings Window Renderer Controller.
 * Manages user preference inputs, companion selection chips, and Google OAuth authorization triggers.
 */
const providerSelect = document.getElementById("provider");
const leadTimeSlider = document.getElementById("leadTimeMinutes");
const leadTimeDisplay = document.getElementById("leadTimeDisplay");
const cornerPositionSelect = document.getElementById("cornerPosition");
const soundEnabledCheck = document.getElementById("soundEnabled");
const audioDesc = document.getElementById("audio-desc");
const brandAvatarImg = document.getElementById("brand-avatar-img");

const googleAuthPanel = document.getElementById("google-auth-panel");
const googleClientId = document.getElementById("googleClientId");
const googleClientSecret = document.getElementById("googleClientSecret");
const authBtn = document.getElementById("authBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const statusDot = document.getElementById("status-dot");
const statusLabel = document.getElementById("status-label");

const saveBtn = document.getElementById("saveBtn");
const testSwatBtn = document.getElementById("testSwatBtn");
const authorLink = document.getElementById("authorLink");
const companionChips = document.querySelectorAll(".companion-chip");

let selectedCompanion = "cat";

// Companion metadata mapping for image thumbnails and procedural audio descriptions
const COMPANION_METADATA = {
  cat: { image: "../assets/companions/cat.png", soundDesc: "Soft chirp and card slide" },
  dog: { image: "../assets/companions/dog.png", soundDesc: "Warm tone and light tap" },
  monkey: { image: "../assets/companions/monkey.png", soundDesc: "Wood chime" },
  rabbit: { image: "../assets/companions/rabbit.png", soundDesc: "Soft click" },
  panda: { image: "../assets/companions/panda.png", soundDesc: "Bamboo drop" },
  unicorn: { image: "../assets/companions/unicorn.png", soundDesc: "Melodic chime" }
};

// Update lead time text dynamically during slider interaction
leadTimeSlider.addEventListener("input", (e) => {
  const val = e.target.value;
  leadTimeDisplay.textContent = `${val} min before`;
});

// Companion selection chip click handlers
companionChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    companionChips.forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    selectedCompanion = chip.dataset.companion;
    updateCompanionUI(selectedCompanion);
  });
});

/**
 * Updates UI labels and brand thumbnail when companion selection changes.
 * @param {string} companionKey - Identifier of selected animal companion.
 */
function updateCompanionUI(companionKey) {
  const meta = COMPANION_METADATA[companionKey] || COMPANION_METADATA.cat;
  if (brandAvatarImg) {
    brandAvatarImg.src = meta.image;
    brandAvatarImg.alt = capitalize(companionKey);
  }
  if (audioDesc) {
    audioDesc.textContent = meta.soundDesc;
  }
  if (testSwatBtn) {
    const displayName = companionKey === "rabbit" ? "Bunny" : capitalize(companionKey);
    testSwatBtn.textContent = `Preview ${displayName}`;
  }
}

/**
 * Capitalizes first letter of an identifier string.
 * @param {string} str - String to capitalize.
 * @returns {string} Capitalized string.
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Release focus highlight from dropdowns after 2 seconds
[cornerPositionSelect, providerSelect].forEach((selectEl) => {
  if (!selectEl) return;
  selectEl.addEventListener("change", () => {
    setTimeout(() => {
      selectEl.blur();
    }, 2000);
  });
});

// Provider Change toggles Google Box
function updateProviderVisibility() {
  const isGoogle = providerSelect.value === "google" || providerSelect.value === "both";
  googleAuthPanel.classList.toggle("is-hidden", !isGoogle);
  if (isGoogle) {
    setTimeout(() => {
      googleAuthPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 50);
  }
}
providerSelect.addEventListener("change", updateProviderVisibility);

/**
 * Updates Google OAuth status badge and button labels.
 * @param {boolean} hasToken - True if valid credentials token is stored.
 */
function updateGoogleStatus(hasToken) {
  if (hasToken) {
    statusDot.className = "status-indicator status-online";
    statusLabel.textContent = "Connected & Synced";
    authBtn.textContent = "Re-authenticate";
    disconnectBtn.classList.remove("is-hidden");
  } else {
    statusDot.className = "status-indicator status-offline";
    statusLabel.textContent = "Not Connected";
    authBtn.textContent = "Connect Google";
    disconnectBtn.classList.add("is-hidden");
  }
}

// Load initial configuration
async function init() {
  if (!window.catSettingsAPI) return;

  const config = await window.catSettingsAPI.getConfig();

  providerSelect.value = config.provider || "ical";
  leadTimeSlider.value = config.leadTimeMinutes || 5;
  leadTimeDisplay.textContent = `${config.leadTimeMinutes || 5} min before`;
  cornerPositionSelect.value = config.cornerPosition || "top-right";
  soundEnabledCheck.checked = config.soundEnabled !== false;

  googleClientId.value = config.googleClientId || "";
  googleClientSecret.value = config.googleClientSecret || "";

  selectedCompanion = config.animalCompanion || "cat";
  companionChips.forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.companion === selectedCompanion);
  });
  updateCompanionUI(selectedCompanion);

  updateProviderVisibility();
  updateGoogleStatus(config.hasGoogleToken);
}

/**
 * Collects form inputs into a configuration payload object.
 * @returns {Object} Collected form configuration values.
 */
function getFormData() {
  return {
    provider: providerSelect.value,
    leadTimeMinutes: parseInt(leadTimeSlider.value, 10),
    cornerPosition: cornerPositionSelect.value,
    soundEnabled: soundEnabledCheck.checked,
    animalCompanion: selectedCompanion,
    googleClientId: googleClientId.value.trim(),
    googleClientSecret: googleClientSecret.value.trim()
  };
}

// Save preferences action handler
saveBtn.addEventListener("click", async () => {
  saveBtn.textContent = "Saving...";
  const data = getFormData();
  await window.catSettingsAPI.saveConfig(data);
  saveBtn.textContent = "Saved!";
  saveBtn.classList.add("is-saved");
  setTimeout(() => {
    saveBtn.textContent = "Save Changes";
    saveBtn.classList.remove("is-saved");
  }, 1500);
});

// Trigger test swat animation action handler
testSwatBtn.addEventListener("click", () => {
  const data = getFormData();
  window.catSettingsAPI.saveConfig(data).then(() => {
    window.catSettingsAPI.triggerTestSwat("Q3 Roadmap Sync");
  });
});

// Initiate Google OAuth authentication action handler
authBtn.addEventListener("click", async () => {
  const data = getFormData();
  await window.catSettingsAPI.saveConfig(data);
  statusLabel.textContent = "Authorizing in browser...";

  try {
    await window.catSettingsAPI.startGoogleAuth();
  } catch (err) {
    alert("Authorization failed: " + err);
    statusLabel.textContent = "Authorization error";
  }
});

// Disconnect Google Calendar action handler
disconnectBtn.addEventListener("click", async () => {
  await window.catSettingsAPI.disconnectGoogle();
  updateGoogleStatus(false);
});

// IPC event subscribers for authentication callbacks
if (window.catSettingsAPI) {
  window.catSettingsAPI.onAuthSuccess(() => {
    updateGoogleStatus(true);
  });

  window.catSettingsAPI.onAuthError((err) => {
    alert("Google Auth Error: " + err);
    updateGoogleStatus(false);
  });
}

// Opens GitHub profile in the system's default browser
if (authorLink) {
  authorLink.addEventListener("click", (e) => {
    e.preventDefault();
    if (window.catSettingsAPI && window.catSettingsAPI.openExternal) {
      window.catSettingsAPI.openExternal("https://github.com/untamedtinker");
    }
  });
}

init();



