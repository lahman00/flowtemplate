import { describe, it, expect } from "vitest";
import { isPricingStale, hasNumericPricingClaim, DEFAULT_PRICING_STALE_DAYS } from "@/lib/pricing-freshness";
import type { Software } from "@/data/software";

function fixture(pricing: Software["pricing"]): Software {
  return { name: "x", slug: "x", category: "x", description: "x", website: "https://x.com", bestFor: "x", features: ["x"], alternatives: [], sources: ["https://x.com"], accessedAt: "2026-01-01", pricing } as Software;
}

describe("isPricingStale", () => {
  it("is not stale when lastVerified is recent", () => {
    const now = new Date("2026-08-17");
    const s = fixture({ lastVerified: "2026-08-01" });
    expect(isPricingStale(s, now)).toBe(false);
  });

  it("is stale when lastVerified is older than the default 90-day window", () => {
    const now = new Date("2026-08-17");
    const s = fixture({ lastVerified: "2026-01-01" });
    expect(isPricingStale(s, now)).toBe(true);
  });

  it("is never stale when there's no lastVerified at all — nothing to go stale", () => {
    const now = new Date("2026-08-17");
    expect(isPricingStale(fixture(undefined), now)).toBe(false);
    expect(isPricingStale(fixture({ model: "paid" }), now)).toBe(false);
  });

  it("respects a custom stale-days window", () => {
    const now = new Date("2026-08-17");
    const s = fixture({ lastVerified: "2026-08-10" }); // 7 days old
    expect(isPricingStale(s, now, 5)).toBe(true);
    expect(isPricingStale(s, now, 30)).toBe(false);
  });

  it("default window is 90 days", () => {
    expect(DEFAULT_PRICING_STALE_DAYS).toBe(90);
  });
});

describe("hasNumericPricingClaim", () => {
  it("true when entryPaid is set", () => {
    expect(hasNumericPricingClaim(fixture({ entryPaid: { amount: "10", currency: "USD", billingPeriod: "monthly" } }))).toBe(true);
  });
  it("true when tiers is non-empty", () => {
    expect(hasNumericPricingClaim(fixture({ tiers: [{ name: "Basic" }] }))).toBe(true);
  });
  it("false when only the legacy status/model fields are set", () => {
    expect(hasNumericPricingClaim(fixture({ status: "contact_sales" }))).toBe(false);
  });
  it("false when pricing is undefined", () => {
    expect(hasNumericPricingClaim(fixture(undefined))).toBe(false);
  });
});
