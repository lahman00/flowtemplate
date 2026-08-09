/**
 * BLOCKED — no backlink-data API credential (Ahrefs, Moz, Semrush, or
 * similar) exists anywhere in this repository or environment. This is the
 * specified adapter interface for growth-backlink-opportunity-discovery,
 * registered in lib/agents/registry.ts with `enabled: false`, `run: null`.
 *
 * What it would do once unblocked:
 *  - Pull Miloosh's own current backlink profile to find pages that
 *    already earned links but aren't well internally linked from
 *    Miloosh's own site (a cross-check against growth-internal-link-
 *    opportunity's data).
 *  - Identify competitor comparison-site backlink sources as real,
 *    evidenced outreach targets — never as a list to auto-contact; see
 *    the brief's explicit "external publication/outreach requires
 *    authorization" boundary.
 *
 * Provider inventory (researched, not assumed — Phase 2 of the multi-agent
 * build): NO free, official, programmatic backlink API exists.
 *   - Ahrefs Webmaster Tools (AWT) is genuinely free, forever, for a
 *     verified owner's OWN domain — up to 1,000 backlinks, exportable —
 *     but it's a web dashboard, not an API. Ahrefs' actual API (v3) is
 *     paid, unit-billed per request.
 *   - Moz Link Explorer gives 10 free queries/month — too limited for a
 *     recurring scheduled agent, and also dashboard-oriented.
 *   - No open-source or scraped alternative is used here: "do not use
 *     scraping where an official integration is available" doesn't even
 *     apply cleanly (there's no official free API to prefer over
 *     scraping) — but scraping a third party's dashboard/data without
 *     their API is its own legitimacy problem, not attempted.
 *   - Practical near-term recommendation for the owner: periodically
 *     check Ahrefs Webmaster Tools manually (free, one-time domain
 *     verification, zero ongoing cost) rather than waiting on an
 *     automated integration — this agent stays blocked for automation
 *     either way pending a paid API decision.
 *
 * Required to unblock: an account + API key for a backlink-data provider,
 * made available via an env var (never committed).
 */

export type BacklinkSignal = {
  sourceDomain: string;
  targetUrl: string;
  domainAuthority: number | null;
  firstSeenAt: string;
};

export type BacklinkAdapter = {
  isConfigured(): boolean;
  fetchBacklinks(targetUrls: string[]): Promise<BacklinkSignal[]>;
};

export const backlinkAdapter: BacklinkAdapter = {
  isConfigured() {
    return false;
  },
  async fetchBacklinks() {
    throw new Error("Backlink adapter is not configured in this deployment — see scripts/agents/growth/backlink-adapter.ts header.");
  },
};
