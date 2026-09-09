/**
 * macOS Calendar (iCalendar) Event Extraction Provider.
 * Queries local Calendar.app via AppleScript and parses meeting video URLs.
 */
const { spawn } = require("child_process");

/**
 * Extracts supported video conference links (Zoom, Google Meet, Microsoft Teams, Webex, FaceTime) from text.
 * @param {string} text - Meeting description, location, or URL field.
 * @returns {string|null} Parsed conference URL or null if no valid link exists.
 */
function extractMeetingLink(text) {
  if (!text) return null;
  const patterns = [
    /https?:\/\/[a-zA-Z0-9_\.]*zoom\.us\/(?:j\/[0-9]+|my\/[a-zA-Z0-9_\.\-]+)[^\s"<>\)]*/i,
    /https?:\/\/meet\.google\.com\/[a-zA-Z0-9_\-]+/i,
    /https?:\/\/teams\.microsoft\.com\/[^\s"<>\)]+/i,
    /https?:\/\/[a-zA-Z0-9_\.]*webex\.com\/[^\s"<>\)]+/i,
    /https?:\/\/facetime\.apple\.com\/[^\s"<>\)]+/i
  ];

  for (const regex of patterns) {
    const match = text.match(regex);
    if (match) return match[0];
  }

  // Fallback pattern matching any standard HTTP or HTTPS link in location or description
  const generalMatch = text.match(/https?:\/\/[^\s"<>\)]+/i);
  if (generalMatch) return generalMatch[0];

  return null;
}

/**
 * Queries upcoming calendar events from macOS Calendar using osascript.
 * Executes child process with delimiter parsing for safe field separation.
 * @param {number} windowMinutes - Forward lookup horizon in minutes.
 * @returns {Promise<Array<Object>>} List of parsed calendar event records.
 */
async function fetchAppleCalendarEvents(windowMinutes = 30) {
  return new Promise((resolve) => {
    const script = `
      set now to current date
      set pastLimit to now - 300
      set futureLimit to now + (${Math.max(15, windowMinutes)} * 60)
      set output to ""
      
      tell application "Calendar"
        set calList to calendars
        repeat with i from 1 to count of calList
          set cal to item i of calList
          try
            set evList to (every event of cal whose start date ≥ pastLimit and start date ≤ futureLimit)
            repeat with j from 1 to count of evList
              set ev to item j of evList
              set evId to (id of ev) as string
              set evTitle to (summary of ev) as string
              set evStart to start date of ev
              set diff to (evStart - now)
              
              set evLoc to ""
              try
                set l to location of ev
                if l is not missing value then set evLoc to l as string
              end try
              
              set evUrl to ""
              try
                set u to url of ev
                if u is not missing value then set evUrl to u as string
              end try
              
              set evDesc to ""
              try
                set d to description of ev
                if d is not missing value then set evDesc to d as string
              end try
              
              set output to output & evId & ":::FIELD:::" & evTitle & ":::FIELD:::" & diff & ":::FIELD:::" & evLoc & ":::FIELD:::" & evUrl & ":::FIELD:::" & evDesc & ":::ROW:::"
            end repeat
          end try
        end repeat
      end tell
      return output
    `;

    const proc = spawn("osascript", ["-e", script]);
    let stdout = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.on("error", (err) => {
      console.error("[iCalProvider] Spawn error:", err);
      resolve([]);
    });

    proc.on("close", (code) => {
      if (code !== 0 && !stdout.trim()) {
        return resolve([]);
      }

      const events = [];
      const rows = stdout.trim().split(":::ROW:::");

      for (const row of rows) {
        if (!row.trim()) continue;
        const parts = row.split(":::FIELD:::");
        if (parts.length >= 6) {
          const rawId = parts[0].trim();
          const title = parts[1].trim();
          const diffSeconds = parseFloat(parts[2].replace(",", ".").trim());
          const location = parts[3].trim();
          const urlField = parts[4].trim();
          const description = parts[5].trim();

          const meetingUrl =
            extractMeetingLink(urlField) ||
            extractMeetingLink(location) ||
            extractMeetingLink(description);

          const minutes = Math.max(0, Math.round(diffSeconds / 60));

          events.push({
            id: `ical_${rawId}_${minutes}`,
            rawId: rawId,
            title: title || "Untitled Event",
            minutes,
            location,
            meetingUrl,
            source: "ical"
          });
        }
      }

      resolve(events);
    });
  });
}

module.exports = {
  fetchAppleCalendarEvents,
  extractMeetingLink
};
