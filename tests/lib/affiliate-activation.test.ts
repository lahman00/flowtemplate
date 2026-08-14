import { describe, it, expect, afterEach } from "vitest";
import { getAffiliateActivation } from "@/lib/revenue/affiliate-activation";
import { getSoftwareCtaUrl, getSoftwareCtaRel, shouldShowAffiliateDisclosure } from "@/lib/affiliate";
import { getSoftware } from "@/data/software";

/**
 * Affiliate Revenue Engine, Priority 6 (Completion Pass, 2026-08-14) —
 * verifies the post-approval resolver end to end using a FAKE URL set only
 * on `process.env` for the duration of this test process. Nothing here
 * touches Vercel's real environment variables or any production data —
 * per the owner's explicit instruction not to insert a fake affiliate
 * link into production, this is the fixture-only test that instruction
 * asked for.
 */

const ENV_VAR = "NEXT_PUBLIC_AFFILIATE_URL_CLICKUP";
const FAKE_URL = "https://example.com/test-fixture-affiliate-link?ref=test";

afterEach(() => {
  delete process.env[ENV_VAR];
});

describe("post-approval affiliate URL resolver (fixture only)", () => {
  it("stays inactive for a confirmed-program product with no URL set", () => {
    const activation = getAffiliateActivation("clickup");
    expect(activation.isActive).toBe(false);
    expect(activation.affiliateUrl).toBeNull();
  });

  it("activates once a URL is set for a product with a confirmed program", () => {
    process.env[ENV_VAR] = FAKE_URL;
    const activation = getAffiliateActivation("clickup");
    expect(activation.isActive).toBe(true);
    expect(activation.affiliateUrl).toBe(FAKE_URL);
    expect(activation.source).toBe("env");
  });

  it("the software page CTA resolves to the fixture affiliate URL once activated", () => {
    process.env[ENV_VAR] = FAKE_URL;
    const software = getSoftware("clickup")!;
    expect(getSoftwareCtaUrl(software)).toBe(FAKE_URL);
    expect(getSoftwareCtaRel(software)).toContain("sponsored");
    expect(shouldShowAffiliateDisclosure(software)).toBe(true);
  });

  it("falls back to the plain official site when not activated", () => {
    const software = getSoftware("clickup")!;
    expect(getSoftwareCtaUrl(software)).toBe(software.website);
    expect(shouldShowAffiliateDisclosure(software)).toBe(false);
  });

  it("never activates for a product without a confirmed program, even if a URL is set", () => {
    // trello is recorded programExists: "no" in data/revenue/affiliate-programs.ts
    process.env.NEXT_PUBLIC_AFFILIATE_URL_TRELLO = FAKE_URL;
    const activation = getAffiliateActivation("trello");
    expect(activation.isActive).toBe(false);
    expect(activation.affiliateUrl).toBeNull();
    delete process.env.NEXT_PUBLIC_AFFILIATE_URL_TRELLO;
  });
});
