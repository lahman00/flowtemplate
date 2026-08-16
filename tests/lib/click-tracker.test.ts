import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { trackSoftwareCtaClick, trackVendorLinkClick } from "@/lib/revenue/click-tracker";
import { getOutboundEvents } from "@/lib/revenue/events";
import { getSoftware } from "@/data/software";
import { WIX_FUNNELS } from "@/lib/wix-funnels";

/**
 * 2026-08-17 — coverage for the new multi-dimension click tracking
 * (affiliateProgram/affiliateFunnel/campaignId/network/ctaLocation)
 * added for Wix's four Impact.com funnels. Same isolation discipline as
 * the other var/*.json-backed tests in this repo: force the tracking
 * flag on, point at a throwaway log file, clean up after.
 */

const LOG_FILE = path.join(process.cwd(), "var", "outbound-clicks.json");

let realBackup: string | null = null;
let realFlag: string | undefined;

beforeAll(() => {
  realBackup = fs.existsSync(LOG_FILE) ? fs.readFileSync(LOG_FILE, "utf-8") : null;
  realFlag = process.env.NEXT_PUBLIC_REVENUE_TRACKING_ENABLED;
  process.env.NEXT_PUBLIC_REVENUE_TRACKING_ENABLED = "true";
});

beforeEach(() => {
  fs.rmSync(LOG_FILE, { force: true });
});

afterAll(() => {
  if (realBackup !== null) {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fs.writeFileSync(LOG_FILE, realBackup);
  } else {
    fs.rmSync(LOG_FILE, { force: true });
  }
  if (realFlag !== undefined) process.env.NEXT_PUBLIC_REVENUE_TRACKING_ENABLED = realFlag;
  else delete process.env.NEXT_PUBLIC_REVENUE_TRACKING_ENABLED;
});

describe("trackSoftwareCtaClick — Wix funnel dimensions", () => {
  it("records affiliateProgram/affiliateFunnel/campaignId/network for a Website Builder click", () => {
    const wix = getSoftware("wix")!;
    trackSoftwareCtaClick(wix, WIX_FUNNELS["website-builder"].url, "/software/wix", "software-page-cta");
    const [event] = getOutboundEvents();
    expect(event.affiliateProgram).toBe("wix");
    expect(event.affiliateFunnel).toBe("website-builder");
    expect(event.campaignId).toBe("2096727");
    expect(event.network).toBe("impact");
    expect(event.ctaLocation).toBe("software-page-cta");
  });

  it("records the Headless funnel's own campaign id when that's the resolved URL", () => {
    const wix = getSoftware("wix")!;
    trackSoftwareCtaClick(wix, WIX_FUNNELS.headless.url, "/compare/wix-vs-contentful", "compare-page-choose-card");
    const [event] = getOutboundEvents();
    expect(event.affiliateFunnel).toBe("headless");
    expect(event.campaignId).toBe("3972832");
  });

  it("records the eCommerce and Domain funnels correctly too", () => {
    const wix = getSoftware("wix")!;
    trackSoftwareCtaClick(wix, WIX_FUNNELS.ecommerce.url, "/software/wix");
    trackSoftwareCtaClick(wix, WIX_FUNNELS.domain.url, "/software/wix");
    const events = getOutboundEvents();
    const funnels = events.map((e) => e.affiliateFunnel).sort();
    expect(funnels).toEqual(["domain", "ecommerce"]);
  });

  it("does not attach Wix-funnel dimensions to a non-Wix affiliate click", () => {
    const elevenlabs = getSoftware("elevenlabs")!;
    trackSoftwareCtaClick(elevenlabs, "https://try.elevenlabs.io/gkp73pehjgtl", "/software/elevenlabs", "software-page-cta");
    const [event] = getOutboundEvents();
    expect(event.softwareSlug).toBe("elevenlabs");
    expect(event.affiliateProgram).toBeUndefined();
    expect(event.affiliateFunnel).toBeUndefined();
  });

  it("never records secrets or unrelated personal data — only the documented dimensions", () => {
    const wix = getSoftware("wix")!;
    trackSoftwareCtaClick(wix, WIX_FUNNELS["website-builder"].url, "/software/wix", "software-page-cta");
    const [event] = getOutboundEvents();
    const keys = Object.keys(event).sort();
    expect(keys).toEqual(["affiliateFunnel", "affiliateProgram", "campaignId", "ctaLocation", "destination", "network", "softwareSlug", "sourcePage", "timestamp", "type", "url"]);
  });

  it("a plain official-site click (no affiliate link) carries no affiliate dimensions", () => {
    const wordpress = getSoftware("wordpress")!;
    trackSoftwareCtaClick(wordpress, wordpress.website, "/software/wordpress");
    const [event] = getOutboundEvents();
    expect(event.destination).toBe("official");
    expect(event.affiliateProgram).toBeUndefined();
  });
});

describe("trackVendorLinkClick — unaffected by the new dimensions", () => {
  it("still records a plain vendor-link event", () => {
    const wix = getSoftware("wix")!;
    trackVendorLinkClick(wix, wix.website, "/software/wix");
    const [event] = getOutboundEvents();
    expect(event.type).toBe("vendor_link_click");
    expect(event.affiliateProgram).toBeUndefined();
  });
});
