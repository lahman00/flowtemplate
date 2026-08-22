import { describe, it, expect } from "vitest";
import { getSoftware, getAllSoftware } from "@/data/software";
import { PUBLISHED_COMPARISONS } from "@/data/comparisons";
import { getProductProfile } from "@/data/recommend/product-profiles";
import { CANONICAL_AFFILIATE_LEDGER } from "@/data/affiliate/canonical-ledger";
import { getActivePartner } from "@/data/affiliate/active-partners";

/**
 * WAR MODE mission (2026-08-22) Phase 26 — permanent regression proof for
 * the "Flippa firewall": Flippa is a real, verified affiliate relationship
 * (data/affiliate/canonical-ledger.ts, status APPROVED_NEEDS_EDITORIAL_CONTENT)
 * that was deliberately never turned into a live page, CTA, comparison, or
 * Recommend result, because no independently-justified editorial category
 * for business/website marketplaces exists on Miloosh today — the program's
 * own existence must never be the reason a page gets built (see that file's
 * "gate question" comment: "would this page exist even if commission = $0").
 *
 * This is the mission's own non-negotiable rule made concrete:
 * affiliate-availability must never become an editorial-recommendation.
 * Structurally, the firewall is airtight today (no data/software entry for
 * "flippa" means it cannot appear on a comparison or Recommend result
 * either, since both require a real software record) — this test exists so
 * that stays true if anyone ever adds one without also making the
 * independent editorial decision the ledger's notes call for.
 */
describe("Flippa firewall — a real affiliate relationship that must stay commercially inert", () => {
  it("has no live software page (getSoftware returns undefined)", () => {
    expect(getSoftware("flippa")).toBeUndefined();
  });

  it("is absent from every published comparison", () => {
    const involvesFlippa = PUBLISHED_COMPARISONS.some(([a, b]) => a === "flippa" || b === "flippa");
    expect(involvesFlippa).toBe(false);
  });

  it("is absent from every Recommend product profile", () => {
    expect(getProductProfile("flippa")).toBeUndefined();
  });

  it("is absent from the active-partners list (not resolvable as a live CTA target)", () => {
    expect(getActivePartner("flippa")).toBeUndefined();
  });

  it("the canonical ledger still records it as APPROVED_NEEDS_EDITORIAL_CONTENT, not ACTIVE", () => {
    const entry = CANONICAL_AFFILIATE_LEDGER.find((e) => e.programId === "flippa");
    expect(entry).toBeTruthy();
    expect(entry?.status).toBe("APPROVED_NEEDS_EDITORIAL_CONTENT");
    expect(entry?.productSlugs).toEqual([]);
  });

  it("no software entry anywhere on the site is secretly named/aliased as flippa", () => {
    const allSlugs = getAllSoftware().map((s) => s.slug);
    expect(allSlugs).not.toContain("flippa");
  });
});
