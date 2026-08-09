/**
 * BLOCKED — no Bing Webmaster Tools API key or IndexNow key exists
 * anywhere in this repository or environment (confirmed by repo-wide
 * search before writing this file). This is the specified adapter
 * interface for what this agent would do once a key is configured — not
 * a working implementation. Registered in lib/agents/registry.ts with
 * `enabled: false` and `run: null`. Do not wire this into the registry
 * until a real key is configured (see docs/agents-architecture.md
 * "Turning on a blocked agent").
 *
 * Note on submission behavior (brief Section C): Miloosh has already
 * submitted a large sitemap. If/when this is unblocked, it must not
 * unconditionally resubmit every URL on every run — it should only
 * submit URLs that are new since the last successful submission (tracked
 * via lib/agents/state.ts) or that changed, using evidence (a new file,
 * an updated accessed_at) rather than resubmitting on a timer.
 *
 * What it would do once unblocked:
 *  - IndexNow: POST new/changed URLs to https://api.indexnow.org so
 *    Bing (and any other participating engine) learns about them faster
 *    than waiting for its own crawl schedule.
 *  - Bing Webmaster Tools API: pull crawl/index stats and query
 *    performance data, parallel to the Search Console adapter.
 *
 * Required to unblock: a Bing Webmaster Tools account verified for this
 * property, an IndexNow key file served at the site root, and the key
 * itself made available via an env var (never committed).
 */

export type IndexNowSubmissionResult = {
  submittedCount: number;
  accepted: boolean;
  statusCode: number | null;
};

export type BingSignalsAdapter = {
  isConfigured(): boolean;
  submitUrls(urls: string[]): Promise<IndexNowSubmissionResult>;
};

/** Always reports unconfigured in this deployment — see file header. */
export const bingSignalsAdapter: BingSignalsAdapter = {
  isConfigured() {
    return false;
  },
  async submitUrls() {
    throw new Error("IndexNow/Bing adapter is not configured in this deployment — see scripts/agents/seo/indexnow-bing-signals.ts header.");
  },
};
