/**
 * BLOCKED — no Google Search Console API credentials exist anywhere in
 * this repository or environment (confirmed by repo-wide search before
 * writing this file). This is the specified adapter interface for what
 * this agent would do once credentials are configured — not a working
 * implementation. Registered in lib/agents/registry.ts with
 * `enabled: false` and `run: null`; it never runs and never fakes a
 * result. Do not wire this into the registry until a real GSC service
 * account/OAuth credential is configured (see docs/agents-architecture.md
 * "Turning on a blocked agent").
 *
 * What it would do once unblocked:
 *  - Pull Search Console's URL Inspection API state per indexable route
 *    (DISCOVERED / CRAWLED / INDEXABLE / INDEXED — genuinely different
 *    states; "not indexed yet" is not automatically a technical failure,
 *    see the brief's Section C) instead of guessing from sitemap presence
 *    alone.
 *  - Pull the Search Analytics API (query, page, clicks, impressions,
 *    ctr, position) to feed lib/agents/scoring.ts's currently-neutral
 *    `searchSignal` factor with a real number instead of a documented
 *    placeholder.
 *  - Feed a real high-impression/low-CTR detector (the brief's Marketing
 *    item 17) — currently not implemented at all because it has no data
 *    to work from without this.
 *
 * Required to unblock: a Google Cloud service account with Search
 * Console API access delegated to this property's GSC verification, its
 * credentials made available via an env var (never committed), and the
 * `googleapis` package (not currently a dependency) or a direct REST
 * call.
 */

export type SearchConsoleIndexState = "discovered" | "crawled" | "indexable" | "indexed" | "excluded" | "unknown";

export type SearchConsoleUrlSignal = {
  url: string;
  indexState: SearchConsoleIndexState;
  clicks28d: number;
  impressions28d: number;
  ctr: number;
  averagePosition: number | null;
};

export type SearchConsoleAdapter = {
  isConfigured(): boolean;
  fetchUrlSignals(urls: string[]): Promise<SearchConsoleUrlSignal[]>;
};

/** Always reports unconfigured in this deployment — see file header. */
export const searchConsoleAdapter: SearchConsoleAdapter = {
  isConfigured() {
    return false;
  },
  async fetchUrlSignals() {
    throw new Error("Search Console adapter is not configured in this deployment — see scripts/agents/seo/search-console-signals.ts header.");
  },
};
