/**
 * Google Calendar OAuth2 and Event Fetching Provider.
 * Manages local HTTP loopback server for OAuth2 authorization code callback and queries Google Calendar API.
 */
const http = require("http");
const url = require("url");
const { google } = require("googleapis");
const { shell } = require("electron");
const configManager = require("../config");
const { extractMeetingLink } = require("./ical-provider");

const OAUTH_PORT = 31415;
const REDIRECT_URI = `http://127.0.0.1:${OAUTH_PORT}/oauth2callback`;

/**
 * Handles Google OAuth2 authentication lifecycle and calendar event retrieval.
 */
class GoogleCalendarProvider {
  constructor() {
    this.authServer = null;
  }

  /**
   * Instantiates an OAuth2 client with saved credentials and automatic token refresh persistence.
   * @returns {google.auth.OAuth2|null} Configured OAuth2 client or null if unconfigured.
   */
  getOAuthClient() {
    const config = configManager.get();
    if (!config.googleClientId || !config.googleClientSecret) {
      return null;
    }

    const oAuth2Client = new google.auth.OAuth2(
      config.googleClientId,
      config.googleClientSecret,
      REDIRECT_URI
    );

    const token = configManager.getGoogleToken();
    if (token) {
      oAuth2Client.setCredentials(token);
      oAuth2Client.on("tokens", (newTokens) => {
        configManager.saveGoogleToken({ ...token, ...newTokens });
      });
      return oAuth2Client;
    }

    return null;
  }

  /**
   * Starts local loopback HTTP server and opens system browser for OAuth consent.
   * @param {Function} onSuccess - Callback invoked on successful authentication.
   * @param {Function} onError - Callback invoked on authorization failure.
   */
  async startAuthFlow(onSuccess, onError) {
    const config = configManager.get();
    if (!config.googleClientId || !config.googleClientSecret) {
      if (onError) onError(new Error("Please configure Google Client ID and Secret first."));
      return;
    }

    const oAuth2Client = new google.auth.OAuth2(
      config.googleClientId,
      config.googleClientSecret,
      REDIRECT_URI
    );

    const stateToken = Math.random().toString(36).substring(2, 15);
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["https://www.googleapis.com/auth/calendar.readonly"],
      state: stateToken
    });

    if (this.authServer) {
      try { this.authServer.close(); } catch (e) {}
    }

    this.authServer = http.createServer(async (req, res) => {
      try {
        if (req.url.startsWith("/oauth2callback")) {
          const parsed = new url.URL(req.url, `http://127.0.0.1:${OAUTH_PORT}`);
          const code = parsed.searchParams.get("code");
          const returnedState = parsed.searchParams.get("state");

          if (returnedState !== stateToken) {
            res.writeHead(400, { "Content-Type": "text/html" });
            res.end("<h3>Security check failed (invalid state parameter).</h3>");
            return;
          }

          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(`
            <!DOCTYPE html>
            <html>
            <body style="font-family:-apple-system,system-ui;text-align:center;padding:50px;background:#18181b;color:#f4f4f5">
              <h1 style="font-size:48px;margin-bottom:8px">🐱</h1>
              <h2>Google Calendar Connected!</h2>
              <p style="color:#a1a1aa">You can safely close this browser window and return to Calendar Companions.</p>
            </body>
            </html>
          `);

          const { tokens } = await oAuth2Client.getToken(code);
          configManager.saveGoogleToken(tokens);

          if (this.authServer) {
            this.authServer.close();
            this.authServer = null;
          }

          if (onSuccess) onSuccess();
        }
      } catch (err) {
        console.error("[GoogleProvider] OAuth error:", err);
        if (onError) onError(err);
      }
    });

    this.authServer.listen(OAUTH_PORT, "127.0.0.1", () => {
      shell.openExternal(authUrl);
    });

    this.authServer.on("error", (err) => {
      console.error("[GoogleProvider] Server listen error:", err);
      if (onError) onError(err);
    });
  }

  /**
   * Fetches upcoming calendar events from Google Calendar API within forward time horizon.
   * @param {number} windowMinutes - Forward lookup horizon in minutes.
   * @returns {Promise<Array<Object>>} List of normalized calendar event objects.
   */
  async fetchGoogleEvents(windowMinutes = 30) {
    const auth = this.getOAuthClient();
    if (!auth) return [];

    try {
      const calendar = google.calendar({ version: "v3", auth });
      const now = new Date();
      const timeMin = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
      const timeMax = new Date(now.getTime() + (Math.max(15, windowMinutes) + 5) * 60 * 1000).toISOString();

      const response = await calendar.events.list({
        calendarId: "primary",
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: "startTime"
      });

      const items = response.data.items || [];
      const events = [];

      for (const item of items) {
        if (!item.start || (!item.start.dateTime && !item.start.date)) continue;

        // Skip full-day events without a specific start time
        if (!item.start.dateTime) continue;

        const startTime = new Date(item.start.dateTime).getTime();
        const diffMs = startTime - now.getTime();
        const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

        let meetingUrl = item.hangoutLink || null;
        if (!meetingUrl) {
          const combined = `${item.location || ""} ${item.description || ""}`;
          meetingUrl = extractMeetingLink(combined);
        }

        events.push({
          id: `google_${item.id}_${diffMinutes}`,
          rawId: item.id,
          title: item.summary || "Google Calendar Event",
          minutes: diffMinutes,
          location: item.location || (item.hangoutLink ? "Google Meet" : ""),
          meetingUrl,
          source: "google"
        });
      }

      return events;
    } catch (err) {
      console.error("[GoogleProvider] Failed to fetch Google Calendar events:", err);
      return [];
    }
  }
}

module.exports = new GoogleCalendarProvider();
