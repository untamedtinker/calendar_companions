/**
 * Overlay View Controller and Procedural Sound Synthesizer.
 * Controls character entry animations, memo pad card physics, full-screen stampede waves, and native WebAudio synthesis.
 */

/**
 * Procedural WebAudio sound synthesizer for lightweight, zero-dependency character sound effects.
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
  }

  /**
   * Lazily initializes or resumes the WebAudio AudioContext on user interaction or trigger.
   */
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  /**
   * Synthesizes a physical downward swat swoosh using filtered white noise and exponential gain ramp.
   * @param {number} volume - Master volume factor.
   */
  playSwatSound(volume = 0.7) {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Filtered noise swoosh with resonant thump
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(150, now + 0.14);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume * 0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
    } catch (e) {
      console.warn("Audio synthesis error:", e);
    }
  }

  /**
   * Synthesizes a bright cat chirp and gentle meow contour using sine oscillation.
   * @param {number} volume - Master volume factor.
   */
  playCuteMeow(volume = 0.7) {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      // Meow pitch contour (curves up then soft drop)
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(860, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.35);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume * 0.4, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch (e) {
      console.warn("Audio synthesis error:", e);
    }
  }

  /**
   * Synthesizes two cheerful puppy bark impulses with triangle waveform oscillation.
   * @param {number} volume - Master volume factor.
   */
  playHappyBark(volume = 0.7) {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Two cheerful puppy yip or bark bursts
      [0, 0.13].forEach((offset) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(460, now + offset);
        osc.frequency.exponentialRampToValueAtTime(820, now + offset + 0.04);
        osc.frequency.exponentialRampToValueAtTime(320, now + offset + 0.1);

        gain.gain.setValueAtTime(0.001, now + offset);
        gain.gain.linearRampToValueAtTime(volume * 0.5, now + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.11);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.12);
      });
    } catch (e) {
      console.warn("Audio synthesis error:", e);
    }
  }

  /**
   * Synthesizes a melodic bell arpeggio (C5, E5, G5) for monkey companion events.
   * @param {number} volume - Master volume factor.
   */
  playMonkeySynth(volume = 0.7) {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Melodic lo-fi synth bell chime arpeggio (C5, E5, G5)
      const freqs = [523.25, 659.25, 783.99];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(volume * 0.35, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    } catch (e) {
      console.warn("Audio synthesis error:", e);
    }
  }

  /**
   * Synthesizes a soft high-frequency rabbit chirp sound.
   * @param {number} volume - Master volume factor.
   */
  playRabbitSqueak(volume = 0.7) {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.exponentialRampToValueAtTime(1420, now + 0.06);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.16);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume * 0.35, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.19);
    } catch (e) {
      console.warn("Audio synthesis error:", e);
    }
  }

  /**
   * Synthesizes a resonant bubble pop sound for panda companion events.
   * @param {number} volume - Master volume factor.
   */
  playPandaPop(volume = 0.7) {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.04);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.12);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume * 0.6, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      console.warn("Audio synthesis error:", e);
    }
  }

  /**
   * Synthesizes a pentatonic magic twinkle chime for unicorn companion events.
   * @param {number} volume - Master volume factor.
   */
  playUnicornTwinkle(volume = 0.7) {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const notes = [587.33, 739.99, 880.00, 1174.66, 1479.98];
      notes.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, now + i * 0.06);

        gain.gain.setValueAtTime(0.001, now + i * 0.06);
        gain.gain.linearRampToValueAtTime(volume * 0.3, now + i * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.38);
      });
    } catch (e) {
      console.warn("Audio synthesis error:", e);
    }
  }

  /**
   * Dispatches the corresponding companion procedural sound.
   * @param {string} companion - Animal identifier.
   * @param {number} volume - Master volume.
   */
  playCompanionSound(companion = "cat", volume = 0.7) {
    switch (companion) {
      case "dog":
        this.playHappyBark(volume);
        break;
      case "monkey":
        this.playMonkeySynth(volume);
        break;
      case "rabbit":
        this.playRabbitSqueak(volume);
        break;
      case "panda":
        this.playPandaPop(volume);
        break;
      case "unicorn":
        this.playUnicornTwinkle(volume);
        break;
      case "cat":
      default:
        this.playCuteMeow(volume);
        break;
    }
  }
}

const sounds = new SoundEngine();

const catActor = document.getElementById("cat-actor");
const reminderCard = document.getElementById("reminder-card");
const cardTitle = document.getElementById("card-title");
const cardLocation = document.getElementById("card-location");
const cardBadge = document.getElementById("card-badge");
const cardTimeTag = document.getElementById("card-time-tag");
const joinBtn = document.getElementById("join-btn");

let currentMeetingUrl = null;
let isHovering = false;
let swatTimer1 = null;
let swatTimer2 = null;
let swatTimer3 = null;
let finishTimer = null;
let swatExecuted = false;

// Mouse event forwarding handlers: allow clicks through transparent regions unless hovering card
reminderCard.addEventListener("mouseenter", () => {
  isHovering = true;
  if (window.catOverlayAPI) {
    window.catOverlayAPI.setIgnoreMouseEvents(false);
  }
});

reminderCard.addEventListener("mouseleave", () => {
  isHovering = false;
  if (window.catOverlayAPI) {
    window.catOverlayAPI.setIgnoreMouseEvents(true);
  }
  if (swatExecuted && !finishTimer) {
    scheduleFinish();
  }
});

// Meeting URL click dispatchers
joinBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  if (currentMeetingUrl && window.catOverlayAPI) {
    window.catOverlayAPI.openMeetingUrl(currentMeetingUrl);
  }
});

reminderCard.addEventListener("click", () => {
  if (currentMeetingUrl && window.catOverlayAPI) {
    window.catOverlayAPI.openMeetingUrl(currentMeetingUrl);
  }
});

/**
 * Schedules exit animation for the companion character after reading time.
 * Delays departure if the user is actively hovering over the meeting card.
 */
function scheduleFinish() {
  if (finishTimer) clearTimeout(finishTimer);
  finishTimer = setTimeout(() => {
    if (isHovering) {
      finishTimer = setTimeout(scheduleFinish, 1500);
      return;
    }
    catActor.classList.remove("cat-enter");
    catActor.classList.remove("cat-swatting-motion");
    catActor.classList.add("cat-exit");

    setTimeout(() => {
      isAnimating = false;
      reminderCard.className = "card-hidden";
      if (window.catOverlayAPI) {
        window.catOverlayAPI.notifyAnimationComplete();
      }
    }, 900);
  }, 3000);
}

const kittyParadeContainer = document.getElementById("kitty-parade-container");

/**
 * Generates and animates rolling companion stampede across the entire screen.
 * @param {number} count - Total number of rolling animal elements to spawn.
 * @param {string} companion - Animal identifier key.
 */
function spawnKittyParade(count = 14, companion = "cat") {
  if (!kittyParadeContainer) return;
  kittyParadeContainer.innerHTML = "";

  const animations = [
    "rollRightToLeft",
    "rollLeftToRight",
    "tumbleDiagonalCross",
    "tumbleBounceReverse"
  ];

  const companionThemes = {
    cat: [
      { mood: "🌸", label: "cheerful" },
      { mood: "💖", label: "lovestruck" },
      { mood: "🔥", label: "feisty" },
      { mood: "✨", label: "sparkly" },
      { mood: "🎀", label: "fancy" },
      { mood: "⚡️", label: "energetic" },
      { mood: "🐾", label: "curious" }
    ],
    dog: [
      { mood: "🎾", label: "playful" },
      { mood: "🦴", label: "hungry" },
      { mood: "🐾", label: "excited" },
      { mood: "💖", label: "affectionate" },
      { mood: "⚡️", label: "zoomies" },
      { mood: "✨", label: "cheerful" }
    ],
    monkey: [
      { mood: "🎧", label: "chill" },
      { mood: "🍌", label: "snacking" },
      { mood: "🎵", label: "vibing" },
      { mood: "💫", label: "groovy" },
      { mood: "💖", label: "happy" }
    ],
    rabbit: [
      { mood: "🥕", label: "snacking" },
      { mood: "🌸", label: "gentle" },
      { mood: "✨", label: "sparkly" },
      { mood: "🎀", label: "cute" },
      { mood: "💖", label: "sweet" }
    ],
    panda: [
      { mood: "🧋", label: "boba lover" },
      { mood: "🎋", label: "snacking" },
      { mood: "💤", label: "sleepy" },
      { mood: "🌸", label: "cozy" },
      { mood: "💖", label: "chill" }
    ],
    unicorn: [
      { mood: "✨", label: "sparkly" },
      { mood: "🌈", label: "magical" },
      { mood: "💫", label: "dazzling" },
      { mood: "⭐", label: "starry" },
      { mood: "💖", label: "enchanting" }
    ]
  };

  const companionImageMap = {
    cat: "../assets/companions/cat.png",
    dog: "../assets/companions/dog.png",
    monkey: "../assets/companions/monkey.png",
    rabbit: "../assets/companions/rabbit.png",
    panda: "../assets/companions/panda.png",
    unicorn: "../assets/companions/unicorn.png"
  };

  const personalityVariants = companionThemes[companion] || companionThemes.cat;
  const kittenImgSrc = companionImageMap[companion] || companionImageMap.cat;

  for (let i = 0; i < count; i++) {
    const variant = personalityVariants[i % personalityVariants.length];
    const kitten = document.createElement("div");
    kitten.className = "parade-kitten";
    kitten.dataset.personality = variant.label;

    const img = document.createElement("img");
    img.src = kittenImgSrc;
    img.alt = `Kawaii ${variant.label}`;
    img.className = "parade-kitten-img";
    kitten.appendChild(img);

    // Expressive Kawaii Personality Mood Badge perched alongside the rolling companion
    const moodBadge = document.createElement("span");
    moodBadge.className = "parade-mood-badge";
    moodBadge.textContent = variant.mood;
    kitten.appendChild(moodBadge);

    // Randomize size, vertical tier, speed, and animation path
    const size = Math.floor(Math.random() * 45) + 90; // 90px to 135px for clear visibility
    const topPercent = Math.floor(Math.random() * 68) + 14; // 14% to 82% screen height
    const animType = animations[i % animations.length];
    const duration = (Math.random() * 2.5 + 5.5).toFixed(2); // 5.5s to 8.0s comfortable rolling pace
    const delay = (i * 0.35).toFixed(2); // staggered natural waves

    kitten.style.width = `${size}px`;
    kitten.style.height = `${size}px`;
    kitten.style.top = `${topPercent}vh`;
    kitten.style.animation = `${animType} ${duration}s linear ${delay}s forwards`;

    // Clean DOM removal when the off-screen roll finishes
    kitten.addEventListener("animationend", () => {
      kitten.remove();
    });

    kittyParadeContainer.appendChild(kitten);
  }
}

/**
 * Orchestrates full swat reminder animation sequence from entrance to card departure.
 * @param {Object} data - Meeting and companion configuration data.
 */
function runSwatSequence(data) {
  isAnimating = true;
  swatExecuted = false;
  isHovering = false;

  const currentCompanion = data.animalCompanion || "cat";
  const companionImageMap = {
    cat: "../assets/companions/cat.png",
    dog: "../assets/companions/dog.png",
    monkey: "../assets/companions/monkey.png",
    rabbit: "../assets/companions/rabbit.png",
    panda: "../assets/companions/panda.png",
    unicorn: "../assets/companions/unicorn.png"
  };

  const mainCatImg = document.getElementById("cat-img");
  if (mainCatImg) {
    mainCatImg.src = companionImageMap[currentCompanion] || companionImageMap.cat;
  }

  if (swatTimer1) clearTimeout(swatTimer1);
  if (swatTimer2) clearTimeout(swatTimer2);
  if (swatTimer3) clearTimeout(swatTimer3);
  if (finishTimer) clearTimeout(finishTimer);

  // Trigger rolling animal stampede across entire screen
  spawnKittyParade(16, currentCompanion);

  // Populate card details
  cardTitle.textContent = data.title || "Upcoming Meeting";
  cardBadge.textContent = data.minutes > 0 ? `MEETING IN ${data.minutes}M` : "MEETING NOW";
  
  currentMeetingUrl = data.meetingUrl || null;

  // Format location label: display clean platform name if URL is passed as location
  let displayLoc = data.location ? data.location.trim() : "";
  if (displayLoc.startsWith("http://") || displayLoc.startsWith("https://")) {
    if (/meet\.google\.com/i.test(displayLoc)) {
      displayLoc = "Google Meet";
    } else if (/zoom\.us/i.test(displayLoc)) {
      displayLoc = "Zoom Meeting";
    } else if (/teams\.microsoft\.com/i.test(displayLoc)) {
      displayLoc = "Microsoft Teams";
    } else if (/webex\.com/i.test(displayLoc)) {
      displayLoc = "Webex";
    } else if (/facetime\.apple\.com/i.test(displayLoc)) {
      displayLoc = "FaceTime Call";
    } else {
      displayLoc = "Online Meeting";
    }
  }

  if (!displayLoc && currentMeetingUrl) {
    if (/meet\.google\.com/i.test(currentMeetingUrl)) {
      displayLoc = "Google Meet";
    } else if (/zoom\.us/i.test(currentMeetingUrl)) {
      displayLoc = "Zoom Meeting";
    } else if (/teams\.microsoft\.com/i.test(currentMeetingUrl)) {
      displayLoc = "Microsoft Teams";
    } else {
      displayLoc = "Online Meeting";
    }
  }

  cardLocation.textContent = displayLoc ? `📍 ${displayLoc}` : "📍 Calendar Event";
  
  const now = new Date();
  const meetingTime = new Date(now.getTime() + (data.minutes || 0) * 60000);
  cardTimeTag.textContent = meetingTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Display Join Meeting Button prominently when URL is available
  joinBtn.style.display = currentMeetingUrl ? "inline-flex" : "none";

  // Reset classes and apply companion theme
  catActor.className = `companion-${currentCompanion}`;
  reminderCard.className = "card-hidden";
  reminderCard.style.opacity = "0";

  // Step 1: Animal drops down upside-down from top screen edge
  catActor.classList.add("cat-enter");
  if (data.soundEnabled) {
    sounds.playCompanionSound(currentCompanion, data.soundVolume || 0.7);
  }

  // Step 2: Post-it note smoothly rolls down onto screen ledge
  setTimeout(() => {
    reminderCard.className = "card-slide-in";
    reminderCard.style.opacity = "1";

    // Allow user comfortable reading time (4.5s) before companion prepares swat
    swatTimer1 = setTimeout(() => {
      // Step 3: Trigger companion playful swat motion
      catActor.classList.add("cat-swatting-motion");

      // Soft playful nudge at 1200ms
      swatTimer2 = setTimeout(() => {
        reminderCard.classList.add("card-nudged");
      }, 1200);

      // Downward swat knocks note into dock at 2800ms
      swatTimer3 = setTimeout(() => {
        if (isHovering) {
          const checkHoverInterval = setInterval(() => {
            if (!isHovering) {
              clearInterval(checkHoverInterval);
              executeSwatHit(data);
            }
          }, 600);
        } else {
          executeSwatHit(data);
        }
      }, 2800);

    }, 4500);

  }, 850);
}

/**
 * Executes the physical swat impact, plays audio, and starts card tumble descent.
 * @param {Object} data - Event data containing sound configuration.
 */
function executeSwatHit(data) {
  swatExecuted = true;
  if (data && data.soundEnabled) {
    sounds.playSwatSound(data.soundVolume || 0.7);
  }
  reminderCard.classList.remove("card-nudged");
  reminderCard.classList.add("card-tumble-fall");
  scheduleFinish();
}

// IPC listener for swat triggers from main process
if (window.catOverlayAPI) {
  window.catOverlayAPI.onTriggerCat((eventData) => {
    runSwatSequence(eventData);
  });
}
