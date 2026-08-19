import { describe, it, expect, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

/**
 * Regression tests for the /internal/ access gate added during the
 * production-exposure review (see docs/agents-architecture.md "Access
 * control"). The critical property is fail-closed: this must never
 * silently become "open" because an env var was forgotten.
 */

const ORIGINAL_USER = process.env.INTERNAL_DASHBOARD_USER;
const ORIGINAL_PASS = process.env.INTERNAL_DASHBOARD_PASSWORD;

function basicAuthHeader(user: string, pass: string): string {
  return `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
}

function requestTo(path: string, authHeader?: string): NextRequest {
  const headers = new Headers();
  if (authHeader) headers.set("authorization", authHeader);
  return new NextRequest(new URL(path, "https://miloosh.com"), { headers });
}

describe("internal dashboard access gate (proxy.ts)", () => {
  afterEach(() => {
    if (ORIGINAL_USER === undefined) delete process.env.INTERNAL_DASHBOARD_USER;
    else process.env.INTERNAL_DASHBOARD_USER = ORIGINAL_USER;
    if (ORIGINAL_PASS === undefined) delete process.env.INTERNAL_DASHBOARD_PASSWORD;
    else process.env.INTERNAL_DASHBOARD_PASSWORD = ORIGINAL_PASS;
  });

  it("fails closed (401) when no credentials are configured at all, even with no Authorization header", () => {
    delete process.env.INTERNAL_DASHBOARD_USER;
    delete process.env.INTERNAL_DASHBOARD_PASSWORD;
    const res = proxy(requestTo("/internal/growth"));
    expect(res.status).toBe(401);
  });

  it("fails closed (401) when credentials are configured but no Authorization header is sent", () => {
    process.env.INTERNAL_DASHBOARD_USER = "operator";
    process.env.INTERNAL_DASHBOARD_PASSWORD = "correct-horse-battery-staple";
    const res = proxy(requestTo("/internal/growth"));
    expect(res.status).toBe(401);
    expect(res.headers.get("WWW-Authenticate")).toContain("Basic");
  });

  it("rejects (401) wrong credentials", () => {
    process.env.INTERNAL_DASHBOARD_USER = "operator";
    process.env.INTERNAL_DASHBOARD_PASSWORD = "correct-horse-battery-staple";
    const res = proxy(requestTo("/internal/growth", basicAuthHeader("operator", "wrong-password")));
    expect(res.status).toBe(401);
  });

  it("allows through (no 401) with correct credentials", () => {
    process.env.INTERNAL_DASHBOARD_USER = "operator";
    process.env.INTERNAL_DASHBOARD_PASSWORD = "correct-horse-battery-staple";
    const res = proxy(requestTo("/internal/growth", basicAuthHeader("operator", "correct-horse-battery-staple")));
    expect(res.status).not.toBe(401);
  });

  it("rejects a correct password paired with the wrong username", () => {
    process.env.INTERNAL_DASHBOARD_USER = "operator";
    process.env.INTERNAL_DASHBOARD_PASSWORD = "correct-horse-battery-staple";
    const res = proxy(requestTo("/internal/maintenance", basicAuthHeader("someone-else", "correct-horse-battery-staple")));
    expect(res.status).toBe(401);
  });
});
