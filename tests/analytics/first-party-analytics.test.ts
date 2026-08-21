import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isBotUserAgent, isInternalOrSyntheticTraffic } from "@/lib/analytics/bot-filter";
import { recordFirstPartyEvent, getAllFirstPartyEvents, type FirstPartyEvent } from "@/lib/analytics/events";
import { computePeriodMetrics, isSyntheticOrTestEvent } from "@/scripts/analytics/report";
import fs from "node:fs";
import path from "node:path";

describe("First-Party Analytics, Bot Defense & Funnel Suite", () => {
  const localStorePath = path.join(process.cwd(), "var", "first-party-analytics.json");

  beforeEach(() => {
    try {
      if (fs.existsSync(localStorePath)) fs.unlinkSync(localStorePath);
    } catch {
      // ignore
    }
  });

  afterEach(() => {
    try {
      if (fs.existsSync(localStorePath)) fs.unlinkSync(localStorePath);
    } catch {
      // ignore
    }
  });

  describe("Phase 2: Adversarial Bot & Synthetic Traffic Defense", () => {
    it("filters search engine bots, scrapers, and preview bots", () => {
      expect(isBotUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(true);
      expect(isBotUserAgent("Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)")).toBe(true);
      expect(isBotUserAgent("Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)")).toBe(true);
      expect(isBotUserAgent("Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)")).toBe(true);
      expect(isBotUserAgent("facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)")).toBe(true);
      expect(isBotUserAgent("LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)")).toBe(true);
      expect(isBotUserAgent("Twitterbot/1.0")).toBe(true);
      expect(isBotUserAgent("Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)")).toBe(true);
      expect(isBotUserAgent("Mozilla/5.0 (compatible; Pinterestbot/1.0; +http://www.pinterest.com/bot.html)")).toBe(true);
    });

    it("filters headless browsers and automated test runners", () => {
      expect(isBotUserAgent("HeadlessChrome/118.0.5993.88")).toBe(true);
      expect(isBotUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/128.0.0.0 Safari/537.36")).toBe(true);
      expect(isBotUserAgent("Playwright/1.46.0 (darwin-arm64)")).toBe(true);
      expect(isBotUserAgent("PuppeteerExtra/1.0")).toBe(true);
      expect(isBotUserAgent("Cypress/13.0.0")).toBe(true);
      expect(isBotUserAgent("k6/0.45.0 (https://k6.io/)")).toBe(true);
    });

    it("filters HTTP libraries, scrapers, and uptime checkers", () => {
      expect(isBotUserAgent("node-fetch/1.0")).toBe(true);
      expect(isBotUserAgent("axios/1.7.2")).toBe(true);
      expect(isBotUserAgent("curl/7.88.1")).toBe(true);
      expect(isBotUserAgent("Wget/1.21.3")).toBe(true);
      expect(isBotUserAgent("python-requests/2.31.0")).toBe(true);
      expect(isBotUserAgent("Go-http-client/1.1")).toBe(true);
      expect(isBotUserAgent("Better Uptime Bot 1.0")).toBe(true);
      expect(isBotUserAgent("UptimeRobot/2.0")).toBe(true);
      expect(isBotUserAgent("")).toBe(true);
      expect(isBotUserAgent("   ")).toBe(true);
      expect(isBotUserAgent(null)).toBe(true);
      expect(isBotUserAgent(undefined)).toBe(true);
    });

    it("preserves real human desktop, mobile, and privacy browsers", () => {
      const chromeMac = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
      const safariIPhone = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1";
      const safariMac = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";
      const firefoxWin = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0";
      const edgeWin = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0";
      const samsungAndroid = "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.6167.143 Mobile Safari/537.36";

      expect(isBotUserAgent(chromeMac)).toBe(false);
      expect(isBotUserAgent(safariIPhone)).toBe(false);
      expect(isBotUserAgent(safariMac)).toBe(false);
      expect(isBotUserAgent(firefoxWin)).toBe(false);
      expect(isBotUserAgent(edgeWin)).toBe(false);
      expect(isBotUserAgent(samsungAndroid)).toBe(false);
    });

    it("filters synthetic QA, cron, and Next.js prefetch request headers", () => {
      const humanUA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36";

      const syntheticHeader = new Headers({ "user-agent": humanUA, "x-synthetic-qa": "true" });
      expect(isInternalOrSyntheticTraffic(syntheticHeader)).toBe(true);

      const vercelHeader = new Headers({ "user-agent": humanUA, "x-vercel-sc-headers": "1" });
      expect(isInternalOrSyntheticTraffic(vercelHeader)).toBe(true);

      const cronHeader = new Headers({ "user-agent": humanUA, "x-vercel-cron": "1" });
      expect(isInternalOrSyntheticTraffic(cronHeader)).toBe(true);

      const prefetchHeader = new Headers({ "user-agent": humanUA, "purpose": "prefetch" });
      expect(isInternalOrSyntheticTraffic(prefetchHeader)).toBe(true);

      const secPrefetch = new Headers({ "user-agent": humanUA, "sec-purpose": "prefetch" });
      expect(isInternalOrSyntheticTraffic(secPrefetch)).toBe(true);

      const nextPrefetch = new Headers({ "user-agent": humanUA, "x-nextjs-prefetch": "1" });
      expect(isInternalOrSyntheticTraffic(nextPrefetch)).toBe(true);

      const realHumanRequest = new Headers({ "user-agent": humanUA, "accept": "text/html" });
      expect(isInternalOrSyntheticTraffic(realHumanRequest)).toBe(false);
    });
  });

  describe("Phase 1: Event Recording, Attribution & Funnel Metrics", () => {
    it("records and reads back all specialized first-party event types", async () => {
      const now = new Date().toISOString();
      const events: FirstPartyEvent[] = [
        { type: "page_view", path: "/", visitorId: "v_h1", sessionId: "s_1", timestamp: now },
        { type: "software_view", path: "/software/notion", softwareSlug: "notion", visitorId: "v_h1", sessionId: "s_1", timestamp: now },
        { type: "comparison_view", path: "/compare/notion-vs-coda", comparisonSlug: "notion-vs-coda", visitorId: "v_h1", sessionId: "s_1", timestamp: now },
        { type: "category_view", path: "/categories/project-management", categorySlug: "project-management", visitorId: "v_h1", sessionId: "s_1", timestamp: now },
        { type: "guide_view", path: "/guides/best-crm-for-startups", guideSlug: "best-crm-for-startups", visitorId: "v_h1", sessionId: "s_1", timestamp: now },
        { type: "recommend_use", path: "/recommend/results", visitorId: "v_h1", sessionId: "s_1", timestamp: now },
        { type: "outbound_click", path: "/software/pipedrive", softwareSlug: "pipedrive", destination: "affiliate", url: "https://aff.trypipedrive.com/xyz", ctaLocation: "software-cta", visitorId: "v_h1", sessionId: "s_1", timestamp: now },
      ];

      for (const ev of events) {
        await recordFirstPartyEvent(ev);
      }

      const stored = await getAllFirstPartyEvents();
      expect(stored.length).toBe(7);
      expect(stored.find(e => e.type === "software_view")).toBeDefined();
      expect(stored.find(e => e.type === "comparison_view")).toBeDefined();
      expect(stored.find(e => e.type === "category_view")).toBeDefined();
      expect(stored.find(e => e.type === "guide_view")).toBeDefined();
      expect(stored.find(e => e.type === "recommend_use")).toBeDefined();
      expect(stored.find(e => e.type === "outbound_click")).toBeDefined();
    });

    it("correctly calculates unique visitors, sessions, new vs returning, and navigation metrics", () => {
      const now = new Date().toISOString();
      const past = new Date(Date.now() - 3600000).toISOString();

      const events: FirstPartyEvent[] = [
        // Visitor 1: Session 1 (Landing on home, goes to software)
        { type: "page_view", path: "/", visitorId: "v_1", sessionId: "s_1", timestamp: past },
        { type: "page_view", path: "/software/monday", visitorId: "v_1", sessionId: "s_1", timestamp: now },
        { type: "engaged_view", path: "/software/monday", durationSeconds: 10, visitorId: "v_1", sessionId: "s_1", timestamp: now },
        // Visitor 1: Session 2 (Returning visitor)
        { type: "page_view", path: "/compare/monday-vs-asana", visitorId: "v_1", sessionId: "s_2", timestamp: now },
        { type: "comparison_view", path: "/compare/monday-vs-asana", comparisonSlug: "monday-vs-asana", visitorId: "v_1", sessionId: "s_2", timestamp: now },
        { type: "outbound_click", path: "/compare/monday-vs-asana", softwareSlug: "monday", destination: "affiliate", url: "https://monday.com/aff", visitorId: "v_1", sessionId: "s_2", timestamp: now },

        // Visitor 2: Single-session, single-page visitor (Bounce)
        { type: "page_view", path: "/guides/startup-tools", visitorId: "v_2", sessionId: "s_3", timestamp: now },

        // Test/Synthetic event: Must be completely excluded from metrics
        { type: "page_view", path: "/", visitorId: "v_test_99", sessionId: "s_test_99", timestamp: now, isTest: true },
        { type: "outbound_click", path: "/", softwareSlug: "wix", destination: "affiliate", url: "https://wix.com", visitorId: "v_synthetic_88", sessionId: "s_synthetic_88", timestamp: now },
      ];

      const summary = computePeriodMetrics("TEST_PERIOD", events, events);

      expect(summary.uniqueVisitors).toBe(2);
      expect(summary.newVisitors).toBe(1); // v_2 has 1 session
      expect(summary.returningVisitors).toBe(1); // v_1 has 2 sessions
      expect(summary.sessions).toBe(3); // s_1, s_2, s_3
      expect(summary.engagedVisitors).toBe(1); // v_1 dwelled >10s and viewed multi-page
      expect(summary.multiPageVisitors).toBe(1); // v_1
      expect(summary.totalPageViews).toBe(4); // 2 + 1 + 1 (excluding test)
      expect(summary.outboundClickers).toBe(1); // v_1
      expect(summary.affiliateClickers).toBe(1); // v_1

      // Verify Landing Pages
      expect(summary.topLandingPages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "/", visits: 1 }),
          expect.objectContaining({ path: "/compare/monday-vs-asana", visits: 1 }),
          expect.objectContaining({ path: "/guides/startup-tools", visits: 1 }),
        ])
      );

      // Verify Exit Pages
      expect(summary.topExitPages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "/software/monday", exits: 1 }),
          expect.objectContaining({ path: "/compare/monday-vs-asana", exits: 1 }),
          expect.objectContaining({ path: "/guides/startup-tools", exits: 1 }),
        ])
      );
    });

    it("rigorously filters test and synthetic events", () => {
      expect(isSyntheticOrTestEvent({ type: "page_view", path: "/", visitorId: "v_test_1", sessionId: "s_1", timestamp: "" })).toBe(true);
      expect(isSyntheticOrTestEvent({ type: "page_view", path: "/", visitorId: "v_synthetic_2", sessionId: "s_1", timestamp: "" })).toBe(true);
      expect(isSyntheticOrTestEvent({ type: "page_view", path: "/", visitorId: "v_1", sessionId: "s_test_2", timestamp: "" })).toBe(true);
      expect(isSyntheticOrTestEvent({ type: "page_view", path: "/", visitorId: "v_1", sessionId: "s_1", timestamp: "", isTest: true })).toBe(true);
      expect(isSyntheticOrTestEvent({ type: "page_view", path: "/", visitorId: "v_real_human_123", sessionId: "s_real_session_456", timestamp: "" })).toBe(false);
    });
  });

  describe("Phase 3: Privacy & Zero-PII Audit", () => {
    it("verifies first-party event records contain no PII, emails, names, or IP addresses", async () => {
      const event: FirstPartyEvent = {
        type: "outbound_click",
        path: "/software/airtable",
        softwareSlug: "airtable",
        destination: "affiliate",
        url: "https://airtable.com/invite/r/xyz",
        ctaLocation: "software-cta",
        visitorId: "v_anon_abc123",
        sessionId: "s_anon_def456",
        timestamp: new Date().toISOString(),
      };

      await recordFirstPartyEvent(event);
      const stored = await getAllFirstPartyEvents();
      const raw = JSON.stringify(stored[0]);

      expect(raw).not.toMatch(/@/); // No email
      expect(raw).not.toMatch(/ipAddress/i);
      expect(raw).not.toMatch(/client_ip/i);
      expect(raw).not.toMatch(/fingerprint/i);
      expect(raw).not.toMatch(/authorization/i);
    });
  });
});
