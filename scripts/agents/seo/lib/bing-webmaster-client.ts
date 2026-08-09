/**
 * Real REST client for the Bing Webmaster Tools API. Verified against
 * current Microsoft documentation before writing this (not assumed):
 * base URL https://ssl.bing.com/webmaster/api.svc/json/, simple API-key
 * auth via an `apikey` query parameter (no OAuth/JWT flow needed — this
 * is genuinely simpler than the Google Search Console adapter). An owner
 * generates the key themselves from Bing Webmaster Tools' own Settings →
 * API Access screen after verifying the site there (often a one-click
 * import from an already-verified Google Search Console property).
 *
 * Requires: BING_WEBMASTER_API_KEY, BING_WEBMASTER_SITE_URL (the exact
 * verified site URL as it appears in Bing Webmaster Tools).
 */

const BING_API_BASE = "https://ssl.bing.com/webmaster/api.svc/json";

export type BingQueryStat = {
  Query: string;
  Clicks: number;
  Impressions: number;
  AvgClickPosition: number;
  AvgImpressionPosition: number;
};

export class BingWebmasterClient {
  constructor(
    private readonly apiKey: string,
    private readonly siteUrl: string
  ) {}

  static fromEnv(): BingWebmasterClient | null {
    const apiKey = process.env.BING_WEBMASTER_API_KEY;
    const siteUrl = process.env.BING_WEBMASTER_SITE_URL;
    if (!apiKey || !siteUrl) return null;
    return new BingWebmasterClient(apiKey, siteUrl);
  }

  /** Real GET to GetQueryStats — aggregate query performance for the site's whole verified history (the API doesn't take a date range for this endpoint; see GetQueryTrafficStats for time-series if ever needed). */
  async getQueryStats(): Promise<BingQueryStat[]> {
    const url = `${BING_API_BASE}/GetQueryStats?siteUrl=${encodeURIComponent(this.siteUrl)}&apikey=${encodeURIComponent(this.apiKey)}`;
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Bing GetQueryStats failed: HTTP ${res.status} — ${body.slice(0, 300)}`);
    }
    const json = (await res.json()) as { d?: BingQueryStat[] };
    return json.d ?? [];
  }
}
