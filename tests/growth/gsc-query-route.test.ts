import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GET } from "@/app/api/growth/gsc-query/route";

/**
 * Growth War Room mission (2026-08-21) — Phase 1. Tests the route's own
 * logic (auth, bounds, dimension allowlist) using a TEST secret set on
 * process.env for this suite only — never the real production
 * CRON_SECRET, which this environment does not have access to (also
 * Sensitive-flagged, also redacted by `vercel env pull`). Confirms the
 * security properties the route promises, without ever needing a real
 * Search Console call to succeed.
 */

const TEST_SECRET = "test-only-secret-not-real";
let realSecret: string | undefined;

beforeEach(() => {
  realSecret = process.env.CRON_SECRET;
  process.env.CRON_SECRET = TEST_SECRET;
});

afterEach(() => {
  if (realSecret !== undefined) process.env.CRON_SECRET = realSecret;
  else delete process.env.CRON_SECRET;
  vi.restoreAllMocks();
});

function request(url: string, headers: Record<string, string> = {}): Request {
  return new Request(url, { headers });
}

describe("GET /api/growth/gsc-query — auth", () => {
  it("rejects a request with no Authorization header", async () => {
    const res = await GET(request("https://miloosh.com/api/growth/gsc-query?startDate=2026-08-01&endDate=2026-08-07") as never);
    expect(res.status).toBe(401);
  });

  it("rejects a request with the wrong bearer token", async () => {
    const res = await GET(request("https://miloosh.com/api/growth/gsc-query?startDate=2026-08-01&endDate=2026-08-07", { authorization: "Bearer wrong-secret" }) as never);
    expect(res.status).toBe(401);
  });

  it("rejects when CRON_SECRET is unset on the server, even with a matching-looking token", async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(request("https://miloosh.com/api/growth/gsc-query?startDate=2026-08-01&endDate=2026-08-07", { authorization: `Bearer ${TEST_SECRET}` }) as never);
    expect(res.status).toBe(401);
  });
});

describe("GET /api/growth/gsc-query — bounds and validation (authenticated)", () => {
  const auth = { authorization: `Bearer ${TEST_SECRET}` };

  it("rejects a missing startDate/endDate", async () => {
    const res = await GET(request("https://miloosh.com/api/growth/gsc-query", auth) as never);
    expect(res.status).toBe(400);
  });

  it("rejects a malformed date", async () => {
    const res = await GET(request("https://miloosh.com/api/growth/gsc-query?startDate=not-a-date&endDate=2026-08-07", auth) as never);
    expect(res.status).toBe(400);
  });

  it("rejects a date window wider than 90 days", async () => {
    const res = await GET(request("https://miloosh.com/api/growth/gsc-query?startDate=2026-01-01&endDate=2026-12-31", auth) as never);
    expect(res.status).toBe(400);
  });

  it("rejects endDate before startDate", async () => {
    const res = await GET(request("https://miloosh.com/api/growth/gsc-query?startDate=2026-08-07&endDate=2026-08-01", auth) as never);
    expect(res.status).toBe(400);
  });

  it("rejects a disallowed dimension (e.g. country)", async () => {
    const res = await GET(request("https://miloosh.com/api/growth/gsc-query?startDate=2026-08-01&endDate=2026-08-07&dimensions=query,country", auth) as never);
    expect(res.status).toBe(400);
  });

  it("rejects an out-of-range rowLimit", async () => {
    const res = await GET(request("https://miloosh.com/api/growth/gsc-query?startDate=2026-08-01&endDate=2026-08-07&rowLimit=999999", auth) as never);
    expect(res.status).toBe(400);
  });

  it("returns 503 (not 500, not a credential leak) when Search Console isn't configured on this deployment", async () => {
    const original = process.env.GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT;
    delete process.env.GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT;
    const res = await GET(request("https://miloosh.com/api/growth/gsc-query?startDate=2026-08-01&endDate=2026-08-07", auth) as never);
    expect(res.status).toBe(503);
    if (original !== undefined) process.env.GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT = original;
  });
});

describe("GET /api/growth/gsc-query — no arbitrary property, no upstream error leakage", () => {
  it("never accepts a property/site parameter — the route source has no such request parameter at all", async () => {
    const fs = await import("node:fs");
    const source = fs.readFileSync("app/api/growth/gsc-query/route.ts", "utf-8");
    expect(source).not.toMatch(/searchParams\.get\(["'](property|site|siteUrl)["']\)/);
  });
});
