/**
 * BLOCKED — shared adapter interface for the three growth agents that all
 * need the same missing capability: real keyword search-volume/demand
 * data. No keyword-volume API credential (Google Keyword Planner, Ahrefs,
 * SEMrush, or similar) exists anywhere in this repository or environment.
 * Registered in lib/agents/registry.ts with `enabled: false`, `run: null`
 * for each of:
 *   - growth-search-demand-discovery
 *   - growth-longtail-query-discovery
 *   - growth-commercial-intent-keyword-discovery
 *
 * These are not implemented as heuristic guesses instead — inventing
 * "probably high-volume" keywords without real data would be exactly the
 * kind of unverified claim the brief prohibits. What's genuinely
 * computable without this (comparison-pair "X vs Y" demand via direct-
 * alternative/same-category relevance, and "X alternative" demand via the
 * same mechanism) is already covered by maint-comparisons — seescripts/agents/README section in docs/agents-architecture.md for why
 * those two brief items were folded in rather than duplicated here.
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
