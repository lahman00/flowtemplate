import { describe, it, expect } from "vitest";
import { getSoftware } from "@/data/software";
import { isDomainEligible, isHardExcluded, passesEligibility } from "@/lib/recommend/eligibility";
import { DEFAULT_ANSWERS } from "@/lib/recommend/query";
import { PRODUCT_PROFILES, getProductProfile } from "@/data/recommend/product-profiles";
import { RECOMMEND_DOMAINS } from "@/lib/recommend/domains";

/**
 * Recommend Engine Rebuild (2026-08-21) — Phase 7 of the rebuild brief:
 * "Create tests proving cross-domain absurdities cannot happen." These
 * use the brief's own named examples directly, plus structural coverage
 * of the whole product-profiles.ts allowlist.
 */

describe("Domain eligibility — cross-domain absurdities are structurally impossible", () => {
  it("Todoist (task manager) is not eligible for accounting", () => {
    const software = getSoftware("todoist");
    expect(software).toBeDefined();
    expect(isDomainEligible(software!, { ...DEFAULT_ANSWERS, primaryNeed: "accounting" })).toBe(false);
  });

  it("Setmore (scheduling) is not eligible for CRM", () => {
    const software = getSoftware("setmore");
    expect(software).toBeDefined();
    expect(isDomainEligible(software!, { ...DEFAULT_ANSWERS, primaryNeed: "crm" })).toBe(false);
  });

  it("Pipedrive (CRM) is not eligible for password management", () => {
    const software = getSoftware("pipedrive");
    expect(software).toBeDefined();
    expect(isDomainEligible(software!, { ...DEFAULT_ANSWERS, primaryNeed: "password_manager" })).toBe(false);
  });

  it("Volza (trade/customs intelligence, shares the 'analytics' category tag) is not eligible for the analytics domain — deliberately excluded from product-profiles.ts", () => {
    const software = getSoftware("volza");
    expect(software).toBeDefined();
    expect(getProductProfile("volza")).toBeUndefined();
    expect(isDomainEligible(software!, { ...DEFAULT_ANSWERS, primaryNeed: "analytics" })).toBe(false);
  });

  it("a product with no profile at all is ineligible for every domain (absence of evidence never becomes eligibility)", () => {
    const software = getSoftware("figma"); // design category, no domain evidence
    expect(software).toBeDefined();
    for (const domain of RECOMMEND_DOMAINS) {
      expect(isDomainEligible(software!, { ...DEFAULT_ANSWERS, primaryNeed: domain })).toBe(false);
    }
  });

  it("every eligible product for a domain is genuinely correct: spot-checks one real product per domain against its own profile", () => {
    const spotChecks: Array<[string, (typeof RECOMMEND_DOMAINS)[number]]> = [
      ["freshdesk", "help_desk"],
      ["1password", "password_manager"],
      ["mailchimp", "email_marketing"],
      ["xero", "accounting"],
      ["calendly", "scheduling"],
      ["google-analytics", "analytics"],
      ["buffer", "social_media"],
      ["toggl-track", "time_tracking"],
    ];
    for (const [slug, domain] of spotChecks) {
      const software = getSoftware(slug);
      expect(software, `${slug} missing from catalog`).toBeDefined();
      expect(isDomainEligible(software!, { ...DEFAULT_ANSWERS, primaryNeed: domain }), `${slug} should be eligible for ${domain}`).toBe(true);
    }
  });

  it("with no domain selected (primaryNeed: null), every product is eligible — the original generic fallback is unchanged", () => {
    const software = getSoftware("figma");
    expect(isDomainEligible(software!, { ...DEFAULT_ANSWERS, primaryNeed: null })).toBe(true);
  });
});

describe("Hard negative signals — Phase 10 of the rebuild brief", () => {
  it("excludes a product with confirmed non-free pricing and no free tier when budget is 'free only'", () => {
    // keeper: pricing.model === "paid", no hasFreeTier — real stored data.
    const software = getSoftware("keeper");
    expect(software?.pricing?.model).toBe("paid");
    expect(isHardExcluded(software!, { ...DEFAULT_ANSWERS, budget: "free" })).toBe(true);
  });

  it("never excludes on budget=free when pricing is undocumented (absence of data is not evidence of exclusion)", () => {
    const software = getSoftware("calendly"); // pricing.model undefined in this catalog
    expect(software?.pricing?.model).toBeUndefined();
    expect(isHardExcluded(software!, { ...DEFAULT_ANSWERS, budget: "free" })).toBe(false);
  });

  it("excludes heavy-monitoring time trackers only when the buyer explicitly prefers lightweight, and only within time_tracking", () => {
    const hubstaff = getSoftware("hubstaff");
    expect(
      isHardExcluded(hubstaff!, { ...DEFAULT_ANSWERS, primaryNeed: "time_tracking", monitoringSensitivity: "prefer-lightweight" })
    ).toBe(true);
    // Same product, no stated preference -> not excluded.
    expect(
      isHardExcluded(hubstaff!, { ...DEFAULT_ANSWERS, primaryNeed: "time_tracking", monitoringSensitivity: "no-preference" })
    ).toBe(false);
    // Same preference, different domain -> never applies outside time_tracking.
    expect(
      isHardExcluded(hubstaff!, { ...DEFAULT_ANSWERS, primaryNeed: "crm", monitoringSensitivity: "prefer-lightweight" })
    ).toBe(false);
  });

  it("passesEligibility combines both gates: domain-correct AND not hard-excluded", () => {
    const keeper = getSoftware("keeper");
    // Right domain, but hard-excluded by budget.
    expect(passesEligibility(keeper!, { ...DEFAULT_ANSWERS, primaryNeed: "password_manager", budget: "free" })).toBe(false);
    // Right domain, no budget constraint -> passes.
    expect(passesEligibility(keeper!, { ...DEFAULT_ANSWERS, primaryNeed: "password_manager", budget: "flexible" })).toBe(true);
    // Wrong domain entirely -> fails regardless of budget.
    expect(passesEligibility(keeper!, { ...DEFAULT_ANSWERS, primaryNeed: "accounting", budget: "flexible" })).toBe(false);
  });
});

describe("Product profile data integrity — Phase 31 of the rebuild brief", () => {
  it("has no duplicate slugs", () => {
    const slugs = PRODUCT_PROFILES.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every profiled slug exists in the real catalog", () => {
    for (const profile of PRODUCT_PROFILES) {
      expect(getSoftware(profile.slug), `${profile.slug} in product-profiles.ts but not in the catalog`).toBeDefined();
    }
  });

  it("every profile lists at least one domain, and every listed domain is a real RecommendDomain", () => {
    for (const profile of PRODUCT_PROFILES) {
      expect(profile.domains.length, `${profile.slug} has no domains`).toBeGreaterThan(0);
      for (const domain of profile.domains) {
        expect(RECOMMEND_DOMAINS as readonly string[], `${profile.slug} has an unsupported domain "${domain}"`).toContain(domain);
      }
    }
  });

  it("every domain has at least 3 eligible products (Phase 3's 'enough real catalog products' bar)", () => {
    const counts: Record<string, number> = {};
    for (const profile of PRODUCT_PROFILES) {
      for (const domain of profile.domains) counts[domain] = (counts[domain] ?? 0) + 1;
    }
    for (const domain of RECOMMEND_DOMAINS) {
      expect(counts[domain] ?? 0, `domain "${domain}" has too few eligible products`).toBeGreaterThanOrEqual(3);
    }
  });
});
