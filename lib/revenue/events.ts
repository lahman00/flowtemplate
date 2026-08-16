import fs from "node:fs";
import path from "node:path";

/**
 * Sprint 8 Phase 4 (architecture) / Sprint 9 Task 6 (real sink) — Outbound
 * Event abstraction. Defines the shape of a revenue-relevant outbound
 * interaction (a click toward a vendor's site) and a single choke point
 * for recording one. Gated behind NEXT_PUBLIC_REVENUE_TRACKING_ENABLED
 * (unset by default — same "off by default" convention as
 * lib/analytics.ts), so this stays a no-op until someone deliberately
 * turns it on. See docs/revenue.md for the privacy-policy prerequisite
 * before enabling it in production.
 *
 * The sink is a local, first-party JSON file (var/outbound-clicks.json,
 * gitignored) — no third-party analytics provider, per Sprint 9's Task 6.
 * This is intentionally simple: it works for a single, persistent Node
 * process (`next start` on one machine/container) but won't aggregate
 * correctly across multiple serverless instances or survive an ephemeral
 * filesystem — see docs/revenue.md "Risks" for this limitation stated
 * plainly, same as every other honestly-documented gap in this project.
 */

export type OutboundEventType = "official_site_click" | "affiliate_link_click" | "vendor_link_click";

export type OutboundEvent = {
  type: OutboundEventType;
  /** The software entry this click relates to. */
  softwareSlug: string;
  /** Where the click actually points. */
  destination: "official" | "affiliate";
  url: string;
  /**
   * 2026-08-17 — multi-funnel affiliate attribution (Wix's four Impact.com
   * funnels were the first real case needing this). All optional and
   * non-personal: which affiliate network's program this is
   * (e.g. "impact"), which specific funnel/campaign within that program
   * (e.g. "headless" for Wix), the network's own campaign identifier, and
   * where on the page the click originated (e.g. "software-page-cta",
   * "compare-page-choose-card"). Every value here is resolved server-side
   * from real config (lib/wix-funnels.ts, the request's own route), never
   * taken as-is from the client — same trust boundary as the fields above.
   */
  affiliateProgram?: string;
  affiliateFunnel?: string;
  campaignId?: string;
  network?: string;
  ctaLocation?: string;
};

export type StoredOutboundEvent = OutboundEvent & {
  /** The Miloosh page the click happened on, e.g. "/software/notion". */
  sourcePage: string;
  /** Server-assigned, ISO 8601 — never trusts a client-supplied clock. */
  timestamp: string;
};

const LOG_FILE = path.join(process.cwd(), "var", "outbound-clicks.json");
const MAX_STORED_EVENTS = 5000;

/**
 * Off unless NEXT_PUBLIC_REVENUE_TRACKING_ENABLED=true is set (see
 * .env.example) — matches lib/analytics.ts's convention of a single
 * explicit opt-in flag rather than inferring "on" from partial config.
 */
export function isOutboundTrackingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_REVENUE_TRACKING_ENABLED === "true";
}

function readLog(): StoredOutboundEvent[] {
  try {
    const contents = fs.readFileSync(LOG_FILE, "utf-8");
    const parsed: unknown = JSON.parse(contents);
    return Array.isArray(parsed) ? (parsed as StoredOutboundEvent[]) : [];
  } catch {
    // No log yet — the default, expected state until the first real click.
    return [];
  }
}

function writeLog(events: StoredOutboundEvent[]): void {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
  fs.writeFileSync(LOG_FILE, JSON.stringify(events, null, 2));
}

/**
 * The one place an outbound click gets recorded. A no-op unless tracking
 * is explicitly enabled. `sourcePage` is supplied by the caller (the
 * click-tracking API route), which reads it from the request itself, not
 * from anything the browser could spoof into a different shape.
 */
export function recordOutboundEvent(event: OutboundEvent, sourcePage: string): void {
  if (!isOutboundTrackingEnabled()) {
    return;
  }

  const stored: StoredOutboundEvent = {
    ...event,
    sourcePage,
    timestamp: new Date().toISOString(),
  };

  const events = readLog();
  events.push(stored);
  writeLog(events.slice(-MAX_STORED_EVENTS));
}

/** Full event log, most recent first. Powers the /internal/outbound-clicks report. */
export function getOutboundEvents(): StoredOutboundEvent[] {
  return [...readLog()].reverse();
}

export type OutboundClickSummaryRow = {
  softwareSlug: string;
  officialClicks: number;
  affiliateClicks: number;
  vendorLinkClicks: number;
  totalClicks: number;
};

/** Clicks grouped by product — "outbound clicks by product" for the admin report, sorted busiest first. */
export function summarizeOutboundEventsByProduct(events: StoredOutboundEvent[]): OutboundClickSummaryRow[] {
  const bySlug = new Map<string, OutboundClickSummaryRow>();

  for (const event of events) {
    const row = bySlug.get(event.softwareSlug) ?? {
      softwareSlug: event.softwareSlug,
      officialClicks: 0,
      affiliateClicks: 0,
      vendorLinkClicks: 0,
      totalClicks: 0,
    };

    if (event.type === "affiliate_link_click") row.affiliateClicks += 1;
    else if (event.type === "vendor_link_click") row.vendorLinkClicks += 1;
    else row.officialClicks += 1;
    row.totalClicks += 1;

    bySlug.set(event.softwareSlug, row);
  }

  return [...bySlug.values()].sort((a, b) => b.totalClicks - a.totalClicks);
}
