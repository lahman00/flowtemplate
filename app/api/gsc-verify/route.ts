import { NextResponse, type NextRequest } from "next/server";
import { GoogleSearchConsoleClient } from "@/scripts/agents/seo/lib/google-search-console-client";

/**
 * One-off route, third incarnation (2026-08-14, Operation First Click):
 * GSC auth is already verified working (see git history for the prior two
 * incarnations). This pulls real query+page PAIR data — the previous pulls
 * only had separate query-only and page-only aggregates, which can't tell
 * you which specific query drove impressions to which specific page.
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
