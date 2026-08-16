import { NextResponse, type NextRequest } from "next/server";
import { runPublishCycle } from "@/lib/social/publish";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron target — Phase 18 scheduling. Authenticated the same way
 * Vercel's own docs specify for cron routes: Vercel sends
 * `Authorization: Bearer ${CRON_SECRET}` on invocations it triggers
 * itself; this route rejects anything else, so it can't be triggered by
 * a stranger who finds the URL. Runs LIVE (dryRun: false) only when
 * CRON_SECRET is set and matches — otherwise it dry-runs, so a
 * misconfigured or missing secret fails safe (never silently posts for
 * real) rather than failing open.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const isAuthenticated = Boolean(secret) && authHeader === `Bearer ${secret}`;

  const summary = await runPublishCycle({ dryRun: !isAuthenticated });
  return NextResponse.json({ authenticated: isAuthenticated, ...summary });
}
