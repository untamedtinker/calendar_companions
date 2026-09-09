/**
 * Calendar Polling & Meeting Notification Service.
 * Polls configured providers (iCalendar / Google Calendar), deduplicates events, and broadcasts triggers.
 */
const configManager = require("../config");
const { fetchAppleCalendarEvents } = require("./ical-provider");
const googleProvider = require("./google-provider");

class CalendarService {
  constructor() {
    this.pollTimer = null;
    this.notifiedHistory = new Map(); // Map<eventId, timestamp>
    this.eventListeners = [];
    this.isPolling = false;
  }

  /**
   * Registers a subscriber callback for calendar swat events.
   * @param {Function} callback - Listener receiving meeting event payloads.
   */
  onTrigger(callback) {
    this.eventListeners.push(callback);
  }

  /**
   * Starts recurring background polling interval (every 30 seconds).
   */
  start() {
    this.stop();
    this.poll();
    this.pollTimer = setInterval(() => this.poll(), 30000);
  }

  /**
   * Stops background polling timer.
   */
  stop() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /**
   * Evicts notification timestamps older than 4 hours to maintain a lean memory footprint.
   */
  cleanupHistory() {
    const now = Date.now();
    const fourHours = 4 * 60 * 60 * 1000;
    for (const [key, timestamp] of this.notifiedHistory.entries()) {
      if (now - timestamp > fourHours) {
        this.notifiedHistory.delete(key);
      }
    }
  }

  /**
   * Polls active calendar providers and dispatches events matching user lead time.
   */
  async poll() {
    if (this.isPolling) return;
    this.isPolling = true;

    try {
      this.cleanupHistory();
      const config = configManager.get();
      const leadTime = parseInt(config.leadTimeMinutes, 10) || 5;

      let allEvents = [];

      if (config.provider === "ical" || config.provider === "both") {
        const icalEvents = await fetchAppleCalendarEvents(leadTime + 10);
        allEvents = allEvents.concat(icalEvents);
      }

      if (config.provider === "google" || config.provider === "both") {
        const googleEvents = await googleProvider.fetchGoogleEvents(leadTime + 10);
        allEvents = allEvents.concat(googleEvents);
      }

      for (const ev of allEvents) {
        // Trigger if minutes is within lead time window and not previously notified
        if (ev.minutes <= leadTime) {
          const dedupeKey = `${ev.rawId}_${leadTime}`;
          if (!this.notifiedHistory.has(dedupeKey)) {
            this.notifiedHistory.set(dedupeKey, Date.now());
            this.broadcastTrigger(ev);
          }
        }
      }
    } catch (err) {
      console.error("[CalendarService] Error during poll:", err);
    } finally {
      this.isPolling = false;
    }
  }

  /**
   * Broadcasts trigger payload enriched with user companion preferences to all listeners.
   * @param {Object} eventData - Meeting event details.
   */
  broadcastTrigger(eventData) {
    const config = configManager.get();
    const payload = {
      ...eventData,
      animalCompanion: config.animalCompanion || "cat",
      soundEnabled: config.soundEnabled,
      soundVolume: config.soundVolume,
      cornerPosition: config.cornerPosition || "top-right"
    };

    for (const listener of this.eventListeners) {
      try {
        listener(payload);
      } catch (err) {
        console.error("[CalendarService] Listener error:", err);
      }
    }
  }
}

module.exports = new CalendarService();
