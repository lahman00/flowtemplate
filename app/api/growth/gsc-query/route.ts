import { NextResponse, type NextRequest } from "next/server";
import { GoogleSearchConsoleClient, type SearchAnalyticsQuery } from "@/scripts/agents/seo/lib/google-search-console-client";

/**
 * Growth War Room mission (2026-08-21) — Phase 1.
 *
 * Problem this solves: GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT is a
 * Vercel-only "Sensitive" env var. `vercel env pull` correctly redacts
 * it to the literal string "[SENSITIVE]" — this local CLI environment
 * can never read the real credential, by design, and this route does
 * not change that. What it adds is a real, narrowly-scoped, read-only
 * path for a FUTURE authenticated caller (the owner, or a differently-
 * privileged process) to pull bounded Search Analytics rows through the
 * Vercel runtime, which DOES have the credential, without ever exposing
 * it in a response.
 *
 * Security model — deliberately not a generic Google API proxy:
 *   - Auth: the same CRON_SECRET bearer-token check every other
 *     server-triggered route in this codebase already uses
 *     (app/api/cron/seo-factory/route.ts). Not rotated, not revealed,
 *     not weakened — this route adds one more consumer of an existing
 *     secret, nothing new to leak.
 *   - Property: NEVER a request parameter. Always resolved server-side
 *     via GoogleSearchConsoleClient.fromEnv(), which reads
 *     GOOGLE_SEARCH_CONSOLE_PROPERTY — the one configured Miloosh
 *     property, full stop. There is no way to point this route at any
 *     other Search Console property.
 *   - Dimensions: an explicit allowlist (query, page, date) — country
 *     and device are excluded because nothing in this project's growth
 *     workflow needs them, and a narrower allowlist is a narrower attack
 *     surface.
 *   - Bounds: date window capped at MAX_WINDOW_DAYS, row count capped at
 *     MAX_ROW_LIMIT — both enforced server-side regardless of what the
 *     caller asks for.
 *   - Errors: generic, HTTP-status-only. Never echoes the real upstream
 *     error body back to the caller — that body could describe the
 *     service account/property in ways worth not exposing even to an
 *     authenticated caller.
 *   - Response: only the bounded Search Analytics rows requested. No
 *     credential material, no raw upstream response, ever.
 *
 * This local session cannot verify a successful authenticated call —
 * it does not have the real CRON_SECRET value either (also Sensitive-
 * flagged, also redacted on `vercel env pull`). What it CAN and does
 * verify: the route correctly rejects an unauthenticated/wrongly-
 * authenticated request with 401, live in production — see the mission
 * report for that proof. Documented here rather than weakening auth to
 * make local verification possible.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_WINDOW_DAYS = 90;
const MAX_ROW_LIMIT = 500;
const DEFAULT_ROW_LIMIT = 100;
const ALLOWED_DIMENSIONS = ["query", "page", "date"] as const;
type AllowedDimension = (typeof ALLOWED_DIMENSIONS)[number];

function isAllowedDimension(value: string): value is AllowedDimension {
  return (ALLOWED_DIMENSIONS as readonly string[]).includes(value);
}

function isValidDate(value: string | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return NextResponse.json({ error: "startDate and endDate are required, format YYYY-MM-DD" }, { status: 400 });
  }

  const windowDays = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (24 * 60 * 60 * 1000));
  if (windowDays < 0 || windowDays > MAX_WINDOW_DAYS) {
    return NextResponse.json({ error: `date window must be between 0 and ${MAX_WINDOW_DAYS} days` }, { status: 400 });
  }

  const dimensionsParam = searchParams.get("dimensions") ?? "query,page";
  const dimensions = dimensionsParam
    .split(",")
    .map((d) => d.trim())
    .filter((d) => d.length > 0);
  if (dimensions.length === 0 || !dimensions.every(isAllowedDimension)) {
    return NextResponse.json({ error: `dimensions must be a non-empty subset of: ${ALLOWED_DIMENSIONS.join(", ")}` }, { status: 400 });
  }

  const rowLimitParam = searchParams.get("rowLimit");
  let rowLimit = DEFAULT_ROW_LIMIT;
  if (rowLimitParam !== null) {
    const parsed = Number.parseInt(rowLimitParam, 10);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > MAX_ROW_LIMIT) {
      return NextResponse.json({ error: `rowLimit must be an integer between 1 and ${MAX_ROW_LIMIT}` }, { status: 400 });
    }
    rowLimit = parsed;
  }

  // Optional exact-match filter on the "page" dimension, applied AFTER
  // the bounded fetch returns — never forwarded upstream as a raw
  // Search Console API filter (that surface is far larger than this
  // route intentionally exposes).
  const pageFilter = searchParams.get("page");

  const client = GoogleSearchConsoleClient.fromEnv();
  if (!client) {
    return NextResponse.json({ error: "Search Console is not configured on this deployment" }, { status: 503 });
  }

  const query: SearchAnalyticsQuery = { startDate, endDate, dimensions: dimensions as AllowedDimension[], rowLimit };

  try {
    let rows = await client.querySearchAnalytics(query);
    if (pageFilter && dimensions.includes("page")) {
      const pageIndex = dimensions.indexOf("page");
      rows = rows.filter((row) => row.keys[pageIndex] === pageFilter);
    }
    return NextResponse.json({
      startDate,
      endDate,
      dimensions,
      rowCount: rows.length,
      rows,
    });
  } catch {
    // Never echo the real upstream error body — see module header.
    return NextResponse.json({ error: "upstream Search Console query failed" }, { status: 502 });
  }
}
