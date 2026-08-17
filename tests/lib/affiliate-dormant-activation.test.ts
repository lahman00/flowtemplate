import { describe, it, expect } from "vitest";
import { getSoftwareCtaUrl, getSoftwareCtaRel, shouldShowAffiliateDisclosure } from "@/lib/affiliate";
import { getSoftware } from "@/data/software";
import { AFFILIATE_PROGRAMS } from "@/data/revenue/affiliate-programs";

/**
 * Regression coverage for the 2026-08-17 growth-sprint audit finding:
 * shopify, airtable, whatconverts, and monday were all "approved" in the
 * affiliate pipeline with real, verified affiliate URLs, but none were
 * ever wired into data/software/*.json — meaning zero monetization from
 * four programs Miloosh already had access to. Also covers the
 * duplicate-URL bug the same audit found and fixed: miro's pipeline
 * entry had monday.com's URL copy-pasted into it (never wired into
 * miro.json, so no production impact, but corrected in the pipeline).
 */

const ACTIVATED = [
  { slug: "shopify", url: "https://shopify.pxf.io/L0EG9O" },
  { slug: "airtable", url: "https://airtable.partnerlinks.io/b0dz88v48tek" },
  { slug: "whatconverts", url: "https://partners.whatconverts.com/bmckzlf0vnl8" },
  { slug: "monday", url: "https://try.monday.com/1p2fpizulcj7" },
];

describe.each(ACTIVATED)("$slug — newly activated (2026-08-17)", ({ slug, url }) => {
  it("the software page CTA resolves to the real, verified affiliate URL", () => {
    const software = getSoftware(slug)!;
    expect(getSoftwareCtaUrl(software)).toBe(url);
  });

  it("uses rel=sponsored now that it's live", () => {
    const software = getSoftware(slug)!;
    expect(getSoftwareCtaRel(software)).toContain("sponsored");
  });

  it("shows the affiliate disclosure note", () => {
    const software = getSoftware(slug)!;
    expect(shouldShowAffiliateDisclosure(software)).toBe(true);
  });

  it("the official website and sources are untouched by activation", () => {
    const software = getSoftware(slug)!;
    expect(software.website).not.toContain(url);
    for (const source of software.sources) {
      expect(source).not.toBe(url);
    }
  });
});

describe("no duplicate affiliate URLs across distinct products", () => {
  it("shopify and airtable and whatconverts and monday each have their own distinct URL — none share a URL with another", () => {
    const urls = ACTIVATED.map((p) => p.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("miro (a real, separate product) does not carry any of the four newly-activated URLs — the pipeline's copy-paste bug never reached the catalog", () => {
    const miro = getSoftware("miro")!;
    for (const { url } of ACTIVATED) {
      expect(getSoftwareCtaUrl(miro)).not.toBe(url);
    }
    expect(shouldShowAffiliateDisclosure(miro)).toBe(false); // miro has no real affiliate URL of its own yet — must fall back to the plain official site, not monday's link
  });

  it("no duplicate research records exist for any of the four", () => {
    for (const { slug } of ACTIVATED) {
      expect(AFFILIATE_PROGRAMS.filter((p) => p.slug === slug).length).toBeLessThanOrEqual(1);
    }
  });
});
