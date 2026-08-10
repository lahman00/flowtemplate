import { describe, it, expect, vi, afterEach } from "vitest";
import { checkUrl } from "@/lib/maintenance/http";

function response(status: number, headers: Record<string, string> = {}): Response {
  return {
    status,
    headers: new Headers(headers),
  } as Response;
}

describe("checkUrl — bot-protection classification (regression: a direct 403 from an edge WAF was previously reported as a generic client_error, indistinguishable from a genuinely dead link)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("classifies a Cloudflare-challenged 403 (cf-mitigated header) as bot_blocked, not client_error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => response(403, { server: "cloudflare", "cf-mitigated": "challenge" }))
    );
    const result = await checkUrl("https://example.com/blocked");
    expect(result.outcome).toBe("bot_blocked");
    expect(result.httpStatus).toBe(403);
  });

  it("classifies a 403 from Akamai's edge (server: AkamaiGHost) as bot_blocked", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response(403, { server: "AkamaiGHost" })));
    const result = await checkUrl("https://example.com/blocked");
    expect(result.outcome).toBe("bot_blocked");
  });

  it("still reports a plain 403 with no known bot-protection signature as a genuine client_error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response(403, {})));
    const result = await checkUrl("https://example.com/forbidden");
    expect(result.outcome).toBe("client_error");
    expect(result.httpStatus).toBe(403);
  });

  it("still reports 404 as not_found even when served behind Cloudflare", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response(404, { server: "cloudflare" })));
    const result = await checkUrl("https://example.com/missing");
    expect(result.outcome).toBe("not_found");
  });

  it("still reports other 4xx statuses (e.g. 401, 429) as client_error even behind Cloudflare — only 403 is treated as a bot-protection signal", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response(429, { server: "cloudflare", "cf-mitigated": "challenge" })));
    const result = await checkUrl("https://example.com/rate-limited");
    expect(result.outcome).toBe("client_error");
  });
});
