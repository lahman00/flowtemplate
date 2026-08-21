import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isBotUserAgent, isInternalOrSyntheticTraffic } from "@/lib/analytics/bot-filter";
import { recordFirstPartyEvent, getAllFirstPartyEvents, type FirstPartyEvent } from "@/lib/analytics/events";
import fs from "node:fs";
import path from "node:path";

describe("First-Party Analytics & Bot Filter Suite", () => {
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

  it("filters search engine bots, crawlers, and headless browsers", () => {
    expect(isBotUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(true);
    expect(isBotUserAgent("Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)")).toBe(true);
    expect(isBotUserAgent("Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)")).toBe(true);
    expect(isBotUserAgent("Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)")).toBe(true);
    expect(isBotUserAgent("HeadlessChrome/118.0.5993.88")).toBe(true);
    expect(isBotUserAgent("Vercel-Edge-Functions")).toBe(true);
    expect(isBotUserAgent("node-fetch/1.0")).toBe(true);
    expect(isBotUserAgent("")).toBe(true);
    expect(isBotUserAgent(null)).toBe(true);
  });

  it("allows real human desktop and mobile user agents", () => {
    const chromeMac = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
    const safariIPhone = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1";
    const firefoxWin = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0";

    expect(isBotUserAgent(chromeMac)).toBe(false);
    expect(isBotUserAgent(safariIPhone)).toBe(false);
    expect(isBotUserAgent(firefoxWin)).toBe(false);
  });

  it("filters synthetic QA and prefetch request headers", () => {
    const headers = new Headers();
    headers.set("user-agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)");
    headers.set("x-synthetic-qa", "true");

    expect(isInternalOrSyntheticTraffic(headers)).toBe(true);

    const prefetchHeaders = new Headers();
    prefetchHeaders.set("user-agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)");
    prefetchHeaders.set("purpose", "prefetch");

    expect(isInternalOrSyntheticTraffic(prefetchHeaders)).toBe(true);
  });

  it("records and reads back first-party analytics events cleanly", async () => {
    const sampleEvent: FirstPartyEvent = {
      type: "page_view",
      path: "/software/notion",
      visitorId: "v_test_123",
      sessionId: "s_test_456",
      timestamp: new Date().toISOString(),
    };

    await recordFirstPartyEvent(sampleEvent);

    const events = await getAllFirstPartyEvents();
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0]).toMatchObject({
      type: "page_view",
      path: "/software/notion",
      visitorId: "v_test_123",
      sessionId: "s_test_456",
    });
  });

  it("tracks outbound clicks with visitor and session attribution", async () => {
    const clickEvent: FirstPartyEvent = {
      type: "outbound_click",
      softwareSlug: "pipedrive",
      destination: "affiliate",
      url: "https://aff.trypipedrive.com/ajtcgyu06e7i",
      ctaLocation: "software-page-cta",
      path: "/software/pipedrive",
      visitorId: "v_human_999",
      sessionId: "s_session_888",
      timestamp: new Date().toISOString(),
    };

    await recordFirstPartyEvent(clickEvent);

    const events = await getAllFirstPartyEvents();
    const found = events.find((e) => e.type === "outbound_click" && e.visitorId === "v_human_999");
    expect(found).toBeDefined();
    expect(found?.type).toBe("outbound_click");
  });
});
