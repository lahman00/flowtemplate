import { NextResponse, type NextRequest } from "next/server";
import { GoogleSearchConsoleClient } from "@/scripts/agents/seo/lib/google-search-console-client";
import { SITE_URL } from "@/lib/site";

/**
 * One-off, temporary diagnostic route for a single purpose: prove whether
 * GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT / GOOGLE_SEARCH_CONSOLE_PROPERTY
 * actually authenticate against the real Search Console API — evidence,
 * not a claim. Both vars are marked "Sensitive" in Vercel, which means
 * they're injected into this deployed runtime but are NOT retrievable via
 * `vercel env pull` or the dashboard, so this can't be verified locally;
 * this route runs the real check where the credential actually lives.
 *
 * Gated by a random, self-generated bearer token (GSC_VERIFY_TOKEN) in a
 * header — deliberately NOT under /internal/ (keeps this fully isolated
 * from the existing Basic-Auth-gated dashboard) and returns 404 rather
 * than 401 on a missing/wrong token, so its existence isn't advertised.
 * Never returns the service-account key or access token — only booleans,
 * counts, and the same non-secret Search Console fields the rest of this
 * system already stores in var/agents/ (which is gitignored, never
 * committed). Intended to be deleted once its one job is done.
 */

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.GSC_VERIFY_TOKEN;
  if (!expected) return false;
  return request.headers.get("x-verify-token") === expected;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  let client: GoogleSearchConsoleClient | null;
  try {
    client = GoogleSearchConsoleClient.fromEnv();
  } catch (e) {
    // fromEnv() parses the service-account value synchronously and throws
    // on malformed JSON/base64 — confirmed live 2026-08-10: this crashed
    // the route with an opaque empty 500 before this try/catch existed.
    return NextResponse.json({
      configured: true,
      authenticated: false,
      propertyAccessible: false,
      error: e instanceof Error ? e.message : String(e),
      searchAnalytics: null,
      urlInspections: [],
    });
  }
  if (!client) {
    // Diagnostic only: variable NAMES are not secrets, only values are —
    // this reveals a naming/scoping mismatch without ever touching a value.
    const relevantKeys = Object.keys(process.env).filter((k) => k.includes("GOOGLE") || k.includes("SEARCH_CONSOLE"));
    return NextResponse.json({
      configured: false,
      authenticated: false,
      propertyAccessible: false,
      error: "env vars not present in this runtime",
      relevantEnvKeysPresent: relevantKeys,
      // Lengths only, never content — disambiguates "key missing" from "key present but empty string."
      serviceAccountValueLength: process.env.GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT?.length ?? null,
      propertyValueLength: process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY?.length ?? null,
      totalEnvKeyCount: Object.keys(process.env).length,
      searchAnalytics: null,
      urlInspections: [],
    });
  }

  const endDate = new Date();
  endDate.setUTCDate(endDate.getUTCDate() - 3); // GSC data typically lags 2-3 days
  const startDate = new Date(endDate);
  startDate.setUTCDate(startDate.getUTCDate() - 27); // 28-day window
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  let authenticated = false;
  let propertyAccessible = false;
  let error: string | null = null;
  let totals: { clicks: number; impressions: number; ctr: number; position: number } | null = null;
  let topQueries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }> = [];
  let topPages: Array<{ page: string; clicks: number; impressions: number; ctr: number; position: number }> = [];

  try {
    // No dimensions = one aggregate row for the whole window (real totals
    // regardless of daily granularity). A real HTTP 200 here — even with
    // zero rows, which is a valid outcome, not a failure — is proof both
    // authentication and property access succeeded.
    const aggregate = await client.querySearchAnalytics({ startDate: fmt(startDate), endDate: fmt(endDate), dimensions: [], rowLimit: 1 });
    authenticated = true;
    propertyAccessible = true;
    if (aggregate.length > 0) {
      const row = aggregate[0]!;
      totals = { clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position };
    } else {
      totals = { clicks: 0, impressions: 0, ctr: 0, position: 0 };
    }

    const queryRows = await client.querySearchAnalytics({ startDate: fmt(startDate), endDate: fmt(endDate), dimensions: ["query"], rowLimit: 10 });
    topQueries = queryRows.map((r) => ({ query: r.keys[0] ?? "", clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position }));

    const pageRows = await client.querySearchAnalytics({ startDate: fmt(startDate), endDate: fmt(endDate), dimensions: ["page"], rowLimit: 10 });
    topPages = pageRows.map((r) => ({ page: r.keys[0] ?? "", clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position }));
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const sampleUrls = [
    SITE_URL,
    `${SITE_URL}/software/notion`,
    `${SITE_URL}/category/project-management`,
    `${SITE_URL}/compare/notion-vs-clickup`,
  ];

  const urlInspections: Array<{ url: string; verdict: string; coverageState: string | null; indexingState: string | null; lastCrawlTime: string | null; robotsTxtState: string | null; pageFetchState: string | null; googleCanonical: string | null; userCanonical: string | null; error?: string }> = [];

  for (const url of sampleUrls) {
    try {
      const result = await client.inspectUrl(url);
      urlInspections.push({
        url: result.url,
        verdict: result.verdict,
        coverageState: result.coverageState,
        indexingState: result.indexingState,
        lastCrawlTime: result.lastCrawlTime,
        robotsTxtState: result.robotsTxtState,
        pageFetchState: result.pageFetchState,
        googleCanonical: result.googleCanonical,
        userCanonical: result.userCanonical,
      });
    } catch (e) {
      urlInspections.push({
        url,
        verdict: "UNKNOWN",
        coverageState: null,
        indexingState: null,
        lastCrawlTime: null,
        robotsTxtState: null,
        pageFetchState: null,
        googleCanonical: null,
        userCanonical: null,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return NextResponse.json({
    configured: true,
    authenticated,
    propertyAccessible,
    error,
    dateRange: { start: fmt(startDate), end: fmt(endDate) },
    searchAnalytics: { totals, topQueries, topPages },
    urlInspections,
  });
}
