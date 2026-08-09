import { fetchAccessToken, parseServiceAccountEnv, type GoogleServiceAccountKey } from "@/scripts/agents/seo/lib/google-service-account-auth";

/**
 * Minimal, real REST client for the two Google Search Console API surfaces
 * this system needs:
 *  - Search Analytics: query (POST .../searchAnalytics/query) — query,
 *    page, clicks, impressions, ctr, position, date. Endpoint and scope
 *    verified against current Google documentation before writing this
 *    (developers.google.com/webmaster-tools/v1/searchanalytics/query).
 *  - URL Inspection: index (POST .../urlInspection/index:inspect) — real
 *    DISCOVERED/CRAWLED/INDEXED state per URL, a different API surface
 *    (searchconsole.googleapis.com, not www.googleapis.com/webmasters).
 *
 * No `googleapis` dependency — plain `fetch` against the documented REST
 * endpoints, auth via google-service-account-auth.ts. Every function here
 * makes a real HTTP call; there is no mock/fake mode. Requires:
 *   GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT — the service account's JSON
 *     key (raw or base64), with that service account added as a
 *     Search Console user (read access) on the property below.
 *   GOOGLE_SEARCH_CONSOLE_PROPERTY — the exact property as it appears in
 *     Search Console: either a URL-prefix property like
 *     "https://miloosh.com/" or a domain property like "sc-domain:miloosh.com".
 */

const SEARCH_ANALYTICS_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

export type SearchAnalyticsRow = {
  keys: string[]; // one per requested dimension, in order
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type SearchAnalyticsQuery = {
  startDate: string; // YYYY-MM-DD
  endDate: string;
  dimensions: Array<"query" | "page" | "date" | "country" | "device">;
  rowLimit?: number;
};

export type UrlInspectionResult = {
  url: string;
  verdict: "PASS" | "PARTIAL" | "FAIL" | "NEUTRAL" | "UNKNOWN";
  coverageState: string | null;
  indexingState: string | null;
  lastCrawlTime: string | null;
};

export class GoogleSearchConsoleClient {
  constructor(
    private readonly key: GoogleServiceAccountKey,
    private readonly propertyUrl: string
  ) {}

  static fromEnv(): GoogleSearchConsoleClient | null {
    const rawKey = process.env.GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT;
    const property = process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY;
    if (!rawKey || !property) return null;
    return new GoogleSearchConsoleClient(parseServiceAccountEnv(rawKey), property);
  }

  private async accessToken(): Promise<string> {
    const token = await fetchAccessToken(this.key, SEARCH_ANALYTICS_SCOPE);
    return token.access_token;
  }

  /** Real POST to .../sites/{property}/searchAnalytics/query. */
  async querySearchAnalytics(query: SearchAnalyticsQuery): Promise<SearchAnalyticsRow[]> {
    const accessToken = await this.accessToken();
    const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(this.propertyUrl)}/searchAnalytics/query`;
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(query),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Search Analytics query failed: HTTP ${res.status} — ${body.slice(0, 300)}`);
    }
    const json = (await res.json()) as { rows?: SearchAnalyticsRow[] };
    return json.rows ?? [];
  }

  /** Real POST to searchconsole.googleapis.com's URL Inspection API. */
  async inspectUrl(inspectionUrl: string): Promise<UrlInspectionResult> {
    const accessToken = await this.accessToken();
    const res = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inspectionUrl, siteUrl: this.propertyUrl }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`URL Inspection failed: HTTP ${res.status} — ${body.slice(0, 300)}`);
    }
    const json = (await res.json()) as {
      inspectionResult?: {
        indexStatusResult?: { verdict?: string; coverageState?: string; indexingState?: string; lastCrawlTime?: string };
      };
    };
    const result = json.inspectionResult?.indexStatusResult;
    return {
      url: inspectionUrl,
      verdict: (result?.verdict as UrlInspectionResult["verdict"]) ?? "UNKNOWN",
      coverageState: result?.coverageState ?? null,
      indexingState: result?.indexingState ?? null,
      lastCrawlTime: result?.lastCrawlTime ?? null,
    };
  }
}
