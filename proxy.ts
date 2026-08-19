import { NextResponse, type NextRequest } from "next/server";

/**
 * Gates the entire /internal/ prefix behind HTTP Basic Auth. Every page
 * under /internal/ (maintenance, growth, revenue, outbound-clicks,
 * recommendations) was previously "protected" only by noindex + not being
 * linked from the public site — real for search-engine exclusion, but not
 * real access control: the URL still resolves to a 200 for any
 * unauthenticated visitor who finds or guesses it. This closes that gap
 * with the smallest mechanism that fits (no new dependency, no new UI,
 * no redesign) rather than building a full auth system for a handful of
 * read-only operator dashboards.
 *
 * Fails CLOSED: if INTERNAL_DASHBOARD_USER/PASSWORD aren't set, every
 * /internal/ request gets 401 — never falls back to "open," which would
 * silently undo the protection in an environment where the credentials
 * were simply forgotten.
 *
 * Uses Next.js 16's proxy.ts convention. The matcher remains limited to
 * /internal/*; public routes do not pass through this access gate.
 */
export function proxy(request: NextRequest) {
  const user = process.env.INTERNAL_DASHBOARD_USER;
  const pass = process.env.INTERNAL_DASHBOARD_PASSWORD;

  const unauthorized = () =>
    new NextResponse("Authentication required.", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Miloosh internal"' },
    });

  if (!user || !pass) {
    return unauthorized();
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) {
    return unauthorized();
  }

  const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf-8");
  const separatorIndex = decoded.indexOf(":");
  const providedUser = separatorIndex === -1 ? decoded : decoded.slice(0, separatorIndex);
  const providedPass = separatorIndex === -1 ? "" : decoded.slice(separatorIndex + 1);

  if (providedUser !== user || providedPass !== pass) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/internal/:path*",
};
