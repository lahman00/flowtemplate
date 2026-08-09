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
