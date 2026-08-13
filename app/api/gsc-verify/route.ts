import { NextResponse, type NextRequest } from "next/server";
import { GoogleSearchConsoleClient } from "@/scripts/agents/seo/lib/google-search-console-client";
import { buildSampleUrls } from "@/scripts/agents/seo/indexed-vs-nonindexed-comparator";
import { SITE_URL } from "@/lib/site";

/**
 * One-off route, second incarnation (2026-08-10): the owner corrected
 * GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT and redeployed. This verifies real
 * authentication AND, if it succeeds, pulls everything needed for the
 * indexation-analysis workflow in one pass — real Search Analytics
 * aggregate/top-queries/top-pages, plus real URL Inspection for the
 * standard representative sample (buildSampleUrls — homepage + all
 * categories + a software/comparison spread) and the 15-URL experiment
 * cohort. Same posture as the first version: token-gated (not under
 * /internal/), returns only non-secret fields, never the service-account
 * key or an access token, removed once its job is done.
 */

export const maxDuration = 280;

const EXPERIMENT_COHORT_URLS = [
  `${SITE_URL}/compare/notion-vs-clickup`,
  `${SITE_URL}/compare/notion-vs-coda`,
  `${SITE_URL}/compare/notion-vs-todoist`,
  `${SITE_URL}/compare/clickup-vs-asana`,
  `${SITE_URL}/compare/clickup-vs-trello`,
  `${SITE_URL}/compare/asana-vs-monday`,
  `${SITE_URL}/compare/todoist-vs-asana`,
  `${SITE_URL}/compare/trello-vs-monday`,
  `${SITE_URL}/compare/clickup-vs-todoist`,
  `${SITE_URL}/category/project-management`,
  `${SITE_URL}/category/ai`,
  `${SITE_URL}/category/crm`,
  `${SITE_URL}/software/asana`,
  `${SITE_URL}/software/clickup`,
  `${SITE_URL}/software/hubspot`,
];

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
    return NextResponse.json({
      configured: false,
      authenticated: false,
      propertyAccessible: false,
      error: "env vars not present in this runtime",
      searchAnalytics: null,
      urlInspections: [],
    });
  }

  const endDate = new Date();
  endDate.setUTCDate(endDate.getUTCDate() - 3);
  const startDate = new Date(endDate);
  startDate.setUTCDate(startDate.getUTCDate() - 27);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  let authenticated = false;
  let propertyAccessible = false;
  let error: string | null = null;
  let totals: { clicks: number; impressions: number; ctr: number; position: number } | null = null;
  let topQueries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }> = [];
  let topPages: Array<{ page: string; clicks: number; impressions: number; ctr: number; position: number }> = [];

  try {
    const aggregate = await client.querySearchAnalytics({ startDate: fmt(startDate), endDate: fmt(endDate), dimensions: [], rowLimit: 1 });
    authenticated = true;
    propertyAccessible = true;
    totals = aggregate.length > 0 ? { clicks: aggregate[0]!.clicks, impressions: aggregate[0]!.impressions, ctr: aggregate[0]!.ctr, position: aggregate[0]!.position } : { clicks: 0, impressions: 0, ctr: 0, position: 0 };

    const queryRows = await client.querySearchAnalytics({ startDate: fmt(startDate), endDate: fmt(endDate), dimensions: ["query"], rowLimit: 50 });
    topQueries = queryRows.map((r) => ({ query: r.keys[0] ?? "", clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position }));

    const pageRows = await client.querySearchAnalytics({ startDate: fmt(startDate), endDate: fmt(endDate), dimensions: ["page"], rowLimit: 250 });
    topPages = pageRows.map((r) => ({ page: r.keys[0] ?? "", clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position }));
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ configured: true, authenticated, propertyAccessible, error, dateRange: { start: fmt(startDate), end: fmt(endDate) }, searchAnalytics: { totals, topQueries, topPages }, urlInspections: [] });
  }

  const sampleUrls = buildSampleUrls();
  const allInspectionUrls = [...new Set([...sampleUrls, ...EXPERIMENT_COHORT_URLS])];

  const urlInspections: Array<{ url: string; verdict: string; coverageState: string | null; indexingState: string | null; lastCrawlTime: string | null; robotsTxtState: string | null; pageFetchState: string | null; googleCanonical: string | null; userCanonical: string | null; error?: string }> = [];

  for (const url of allInspectionUrls) {
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
    error: null,
    dateRange: { start: fmt(startDate), end: fmt(endDate) },
    searchAnalytics: { totals, topQueries, topPages },
    urlInspectionsRequested: allInspectionUrls.length,
    urlInspections,
  });
}
