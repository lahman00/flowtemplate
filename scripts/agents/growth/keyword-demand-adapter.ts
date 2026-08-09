/**
 * BLOCKED — shared adapter interface for the three growth agents that all
 * need the same missing capability: real keyword search-volume/demand
 * data. Registered in lib/agents/registry.ts with `enabled: false`,
 * `run: null` for each of:
 *   - growth-search-demand-discovery
 *   - growth-longtail-query-discovery
 *   - growth-commercial-intent-keyword-discovery
 *
 * These are not implemented as heuristic guesses instead — inventing
 * "probably high-volume" keywords without real data would be exactly the
 * kind of unverified claim the brief prohibits. What's genuinely
 * computable without this (comparison-pair "X vs Y" demand via direct-
 * alternative/same-category relevance, and "X alternative" demand via the
 * same mechanism) is already covered by maint-comparisons — see
 * docs/agents-architecture.md for why those two brief items were folded
 * in rather than duplicated here.
 *
 * Provider inventory (researched, not assumed — Phase 2 of the multi-agent
 * build): NO genuinely free, official, ongoing-use keyword-volume API
 * exists.
 *   - Google's own data (Keyword Planner, via the Google Ads API) is the
 *     closest to "official," but requires a Google Ads account — an
 *     account with billing capability attached, adjacent to this system's
 *     explicit "do not create paid accounts" boundary — and returns only
 *     bucketed volume ranges (not precise numbers) for accounts without
 *     ad spend history.
 *   - Every third-party option found (DataForSEO, SE Ranking, Keywords
 *     Everywhere, Serpstat, KWRDS.ai, Keyword Tool) is a paid SaaS API;
 *     free tiers are one-time trial credits (e.g. SE Ranking's 100K-credit
 *     trial), not a sustainable free tier for a recurring scheduled agent.
 *   - Conclusion: remains blocked. Do not sign up for or spend money on
 *     any of these without explicit owner approval — if approved, a
 *     credit-based ("pay for what you use") provider is the more
 *     cost-controllable shape for this system's low, scheduled query
 *     volume, but the specific provider should be the owner's call, and
 *     pricing should be re-verified at that time rather than trusted from
 *     this comment.
 *
 * Required to unblock: an account + API key for a keyword-data provider,
 * made available via an env var (never committed), and a client for that
 * provider's API (not currently a dependency).
 */

export type KeywordDemandSignal = {
  query: string;
  monthlySearchVolume: number | null;
  commercialIntentScore: number | null; // 0-100, provider-defined
};

export type KeywordDemandAdapter = {
  isConfigured(): boolean;
  fetchDemand(queries: string[]): Promise<KeywordDemandSignal[]>;
};

export const keywordDemandAdapter: KeywordDemandAdapter = {
  isConfigured() {
    return false;
  },
  async fetchDemand() {
    throw new Error("Keyword demand adapter is not configured in this deployment — see scripts/agents/growth/keyword-demand-adapter.ts header.");
  },
};
