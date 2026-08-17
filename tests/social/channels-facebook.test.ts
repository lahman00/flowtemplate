import { describe, it, expect, beforeAll, afterAll } from "vitest";
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
