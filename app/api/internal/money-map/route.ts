import { NextResponse, type NextRequest } from "next/server";
import { buildMoneyMap } from "@/lib/revenue/money-map";

export const dynamic = "force-dynamic";

/**
 * Phase 12 — JSON export of the Money Map, for automation/verification
 * (e.g. pulling real numbers for a report) without a browser session.
 * NOT covered by proxy.ts's Basic Auth (that matcher is scoped to
 * /internal/:path*, not /api/*), so this route authenticates itself the
 * same way app/api/cron/social-publish/route.ts already does: a bearer
 * secret Vercel — or here, an operator — supplies via the Authorization
 * header. Fails closed: if MONEY_MAP_API_SECRET isn't set, or the
 * header doesn't match, every request gets 401. Never falls back to
 * "open."
 */
export async function GET(request: NextRequest) {
  const secret = process.env.MONEY_MAP_API_SECRET;
  const authHeader = request.headers.get("authorization");
  const isAuthenticated = Boolean(secret) && authHeader === `Bearer ${secret}`;

  if (!isAuthenticated) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const data = await buildMoneyMap();
  return NextResponse.json(data);
}
