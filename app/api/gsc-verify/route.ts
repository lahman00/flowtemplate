import { NextResponse, type NextRequest } from "next/server";
import { GoogleSearchConsoleClient } from "@/scripts/agents/seo/lib/google-search-console-client";

/**
 * One-off route, fourth incarnation (2026-08-14, First Click Strike):
 * GSC auth is already verified working (see git history for the prior
 * three incarnations). Restored verbatim from the Operation First Click
 * pull (commit b6dfb2b) to get the complete, current query+page pair
 * dataset for auditing additional non-cohort opportunities — the raw
 * data from that pull was deleted after use and only partial top-N
 * slices survive in conversation context, not the full set needed to
 * properly satisfy "up to 5 additional URLs in the 3-20 position range."
 * Token-gated, same posture as before, removed once its job is done.
 */

export const maxDuration = 120;

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.GSC_VERIFY_TOKEN;
  if (!expected) return false;
  return request.headers.get("x-verify-token") === expected;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const client = GoogleSearchConsoleClient.fromEnv();
  if (!client) {
    return NextResponse.json({ configured: false, error: "env vars not present in this runtime" });
  }

  const endDate = new Date();
  endDate.setUTCDate(endDate.getUTCDate() - 3);
  const startDate = new Date(endDate);
  startDate.setUTCDate(startDate.getUTCDate() - 27);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  try {
    const rows = await client.queryAllSearchAnalytics(
      { startDate: fmt(startDate), endDate: fmt(endDate), dimensions: ["query", "page"], rowLimit: 1000 },
      1000
    );
    const pairs = rows.map((r) => ({
      query: r.keys[0] ?? "",
      page: r.keys[1] ?? "",
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: r.position,
    }));

    return NextResponse.json({
      configured: true,
      dateRange: { start: fmt(startDate), end: fmt(endDate) },
      pairCount: pairs.length,
      pairs,
    });
  } catch (e) {
    return NextResponse.json({ configured: true, error: e instanceof Error ? e.message : String(e) });
  }
}
