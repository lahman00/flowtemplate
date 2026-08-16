import { describe, it, expect } from "vitest";
import { getSoftwareCtaUrl, getSoftwareCtaRel, shouldShowAffiliateDisclosure } from "@/lib/affiliate";
import { getSoftware } from "@/data/software";
import { AFFILIATE_PROGRAMS } from "@/data/revenue/affiliate-programs";

/**
 * Regression coverage for the real Wix affiliate integration
 * (2026-08-16) — Wix's affiliate manager issued a real Impact.com
 * tracking link for the English Website Builder / Headless LP campaign,
 * recorded as data/software/wix.json's own `affiliate_url` (the Sprint 6
 * static mechanism, not a test fixture — this is real production data,
 * unlike affiliate-activation.test.ts's deliberately fake env-var URL).
 */

const REAL_WIX_AFFILIATE_URL = "https://wix.pxf.io/c/7623171/3972832/25616?trafcat=headless";

describe("Wix affiliate link (real, static data/software/wix.json entry)", () => {
  it("the software page CTA resolves to the real Impact.com tracking link", () => {
    const wix = getSoftware("wix")!;
    expect(getSoftwareCtaUrl(wix)).toBe(REAL_WIX_AFFILIATE_URL);
  });

  it("uses rel=sponsored (plus noopener/noreferrer) now that it's a real affiliate link", () => {
    const wix = getSoftware("wix")!;
    const rel = getSoftwareCtaRel(wix);
    expect(rel).toContain("sponsored");
    expect(rel).toContain("noopener");
    expect(rel).toContain("noreferrer");
  });

  it("shows the affiliate disclosure note", () => {
    const wix = getSoftware("wix")!;
    expect(shouldShowAffiliateDisclosure(wix)).toBe(true);
  });

  it("the official website field is untouched — still the plain wix.com URL, not the tracking link", () => {
    const wix = getSoftware("wix")!;
    expect(wix.website).toBe("https://www.wix.com");
  });

  it("source citations are untouched — still official wix.com pages, never the affiliate link", () => {
    const wix = getSoftware("wix")!;
    for (const source of wix.sources) {
      expect(source).not.toContain("wix.pxf.io");
      expect(source).not.toContain("7623171");
    }
  });

  it("Wix's affiliate research record still confirms a real, existing program (not fabricated)", () => {
    const research = AFFILIATE_PROGRAMS.find((p) => p.slug === "wix");
    expect(research?.programExists).toBe("yes");
  });

  it("editorial content (bestFor, alternatives) carries no affiliate-derived language — commercial status never rewrites the editorial fields", () => {
    const wix = getSoftware("wix")!;
    expect(wix.bestFor.toLowerCase()).not.toContain("sponsor");
    expect(wix.bestFor.toLowerCase()).not.toContain("affiliate");
    expect(wix.description.toLowerCase()).not.toContain("sponsor");
  });

  it("a product with no affiliate_url set still resolves to its plain official site (no accidental global default)", () => {
    // wordpress lists wix as an alternative but has no affiliate program of its own recorded here — its own CTA must stay unaffected.
    const wordpress = getSoftware("wordpress")!;
    expect(getSoftwareCtaUrl(wordpress)).toBe(wordpress.website);
    expect(shouldShowAffiliateDisclosure(wordpress)).toBe(false);
  });
});
