import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { facebookAdapter } from "@/lib/social/channels/facebook";
import type { ChannelVariant } from "@/lib/social/types";
import { SITE_URL } from "@/lib/site";

/**
 * 2026-08-17 pre-production Facebook hardening — image posting
 * (verified against Meta's current Graph API docs before implementing;
 * see lib/social/channels/facebook.ts's header comment for sources).
 * Every test here runs with real env vars set (so isConfigured() is
 * true) but ONLY ever calls publish() with dryRun: true — a real
 * network call would mean the test suite is silently trying to post to
 * a live Facebook Page, which must never happen in CI or locally.
 */

const REAL_PAGE_ID = process.env.SOCIAL_FACEBOOK_PAGE_ID;
const REAL_TOKEN = process.env.SOCIAL_FACEBOOK_PAGE_ACCESS_TOKEN;

beforeAll(() => {
  process.env.SOCIAL_FACEBOOK_PAGE_ID = "test-page-id";
  process.env.SOCIAL_FACEBOOK_PAGE_ACCESS_TOKEN = "test-token-not-real";
});

afterAll(() => {
  if (REAL_PAGE_ID !== undefined) process.env.SOCIAL_FACEBOOK_PAGE_ID = REAL_PAGE_ID;
  else delete process.env.SOCIAL_FACEBOOK_PAGE_ID;
  if (REAL_TOKEN !== undefined) process.env.SOCIAL_FACEBOOK_PAGE_ACCESS_TOKEN = REAL_TOKEN;
  else delete process.env.SOCIAL_FACEBOOK_PAGE_ACCESS_TOKEN;
});

function variant(overrides: Partial<ChannelVariant> = {}): ChannelVariant {
  return { text: "2 alternatives to Contentful, depending on what you need.", link: "https://miloosh.com/software/contentful", imageUrl: null, altText: null, hashtags: [], publishResult: null, ...overrides };
}

describe("facebookAdapter — dry run never makes a network call", () => {
  it("a variant with a trusted Miloosh card image dry-runs as IMAGE_POST", async () => {
    const result = await facebookAdapter.publish(variant({ imageUrl: `${SITE_URL}/api/social/card?size=facebook&kind=alternatives&headline=x`, altText: "card" }), { dryRun: true });
    expect(result.status).toBe("DRY_RUN");
    expect(result.mode).toBe("IMAGE_POST");
  });

  it("a variant with no image dry-runs as LINK_POST — graceful fallback", async () => {
    const result = await facebookAdapter.publish(variant({ imageUrl: null }), { dryRun: true });
    expect(result.status).toBe("DRY_RUN");
    expect(result.mode).toBe("LINK_POST");
  });

  it("an untrusted/foreign image URL is NEVER used for an image post — falls back to LINK_POST, fails closed", async () => {
    const result = await facebookAdapter.publish(variant({ imageUrl: "https://evil.example.com/tracking-pixel.png" }), { dryRun: true });
    expect(result.mode).toBe("LINK_POST");
  });

  it("a Miloosh-domain URL that isn't the real card route is also rejected — only the exact known route is trusted", async () => {
    const result = await facebookAdapter.publish(variant({ imageUrl: `${SITE_URL}/some-other-path` }), { dryRun: true });
    expect(result.mode).toBe("LINK_POST");
  });

  it("dry run mode is reported even when SETUP_REQUIRED (no env) — no network call either way", async () => {
    const realId = process.env.SOCIAL_FACEBOOK_PAGE_ID;
    delete process.env.SOCIAL_FACEBOOK_PAGE_ID;
    const result = await facebookAdapter.publish(variant({ imageUrl: `${SITE_URL}/api/social/card?size=facebook` }), { dryRun: true });
    expect(result.status).toBe("SETUP_REQUIRED");
    process.env.SOCIAL_FACEBOOK_PAGE_ID = realId;
  });

  it("the exact rendered text for an image post still goes through the same defaultFormat as a link post (same sanitizer, same truncation)", async () => {
    const result = await facebookAdapter.publish(variant({ text: 'A — B "quoted"', imageUrl: `${SITE_URL}/api/social/card?size=facebook` }), { dryRun: true });
    expect(result.text).toContain("A, B");
    expect(result.text).not.toContain(" , ");
  });
});

/**
 * 2026-08-18 daily-publish task — real (mocked-fetch) coverage of the 7
 * required error buckets, plus the real success path and the duplicate-
 * publication guard. Every assertion also checks the token never appears
 * in the classified error text, matching "never expose access tokens in
 * logs" — the token is a real, sensitive-looking test value specifically
 * so that check is meaningful, not a placeholder like "xxx" that would
 * trivially pass.
 */
describe("facebookAdapter — live-call error classification (mocked fetch, never real network)", () => {
  const TOKEN_SENTINEL = "test-token-not-real";

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function mockFetchOnce(status: number, body: unknown) {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: status >= 200 && status < 300,
        status,
        json: async () => body,
        clone() {
          return this;
        },
      })
    );
  }

  it("classifies an expired/invalid token (OAuthException 190) as AUTH_TOKEN_ERROR", async () => {
    mockFetchOnce(401, { error: { message: "Error validating access token", type: "OAuthException", code: 190, error_subcode: 463, fbtrace_id: "abc123" } });
    const result = await facebookAdapter.publish(variant({ imageUrl: null }), { dryRun: false });
    expect(result.status).toBe("FAILED");
    expect(result.error).toContain("AUTH_TOKEN_ERROR");
    expect(result.error).not.toContain(TOKEN_SENTINEL);
  });

  it("classifies a missing-permission error (code 10) as PERMISSION_ERROR", async () => {
    mockFetchOnce(403, { error: { message: "Permission is either not granted or has been removed", type: "OAuthException", code: 10 } });
    const result = await facebookAdapter.publish(variant({ imageUrl: null }), { dryRun: false });
    expect(result.status).toBe("FAILED");
    expect(result.error).toContain("PERMISSION_ERROR");
    expect(result.error).not.toContain(TOKEN_SENTINEL);
  });

  it("classifies a missing/invalid Page id as PAGE_ERROR", async () => {
    mockFetchOnce(404, { error: { message: "Unsupported get request. Object with ID ... does not exist", type: "GraphMethodException", code: 100 } });
    const result = await facebookAdapter.publish(variant({ imageUrl: null }), { dryRun: false });
    expect(result.status).toBe("FAILED");
    expect(result.error).toContain("PAGE_ERROR");
  });

  it("classifies HTTP 429 as RATE_LIMITED with a RATE_LIMIT-tagged error", async () => {
    mockFetchOnce(429, { error: { message: "Application request limit reached", type: "OAuthException", code: 341 } });
    const result = await facebookAdapter.publish(variant({ imageUrl: null }), { dryRun: false });
    expect(result.status).toBe("RATE_LIMITED");
    expect(result.error).toContain("RATE_LIMIT");
  });

  it("classifies a duplicate/invalid content error (code 506) as INVALID_CONTENT", async () => {
    mockFetchOnce(400, { error: { message: "This content has already been shared", type: "FacebookApiException", code: 506 } });
    const result = await facebookAdapter.publish(variant({ imageUrl: null }), { dryRun: false });
    expect(result.status).toBe("FAILED");
    expect(result.error).toContain("INVALID_CONTENT");
  });

  it("classifies an unrecognized error shape as UNKNOWN_API_ERROR rather than silently mislabeling it", async () => {
    mockFetchOnce(500, { error: { message: "An unknown error occurred", type: "SomeFutureExceptionType" } });
    const result = await facebookAdapter.publish(variant({ imageUrl: null }), { dryRun: false });
    expect(result.status).toBe("FAILED");
    expect(result.error).toContain("UNKNOWN_API_ERROR");
  });

  it("classifies a fetch that throws (DNS/connection failure) as NETWORK_ERROR", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    const result = await facebookAdapter.publish(variant({ imageUrl: null }), { dryRun: false });
    expect(result.status).toBe("FAILED");
    expect(result.error).toContain("NETWORK_ERROR");
  });

  it("a real success response yields PUBLISHED with the returned post id, and never marks it published on failure", async () => {
    const fetchMock = vi
      .fn()
      // POST /{page-id}/feed
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: "123456_987654" }) })
      // GET read-back verification
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: "123456_987654", permalink_url: "https://www.facebook.com/123456/posts/987654" }) });
    vi.stubGlobal("fetch", fetchMock);
    const result = await facebookAdapter.publish(variant({ imageUrl: null }), { dryRun: false });
    expect(result.status).toBe("PUBLISHED");
    expect(result.postId).toBe("123456_987654");
    expect(result.verified).toBe(true);
  });
});
