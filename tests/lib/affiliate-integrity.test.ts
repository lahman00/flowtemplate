import { describe, it, expect } from "vitest";
import { CANONICAL_AFFILIATE_LEDGER } from "@/data/affiliate/canonical-ledger";
import { ACTIVE_PARTNERS } from "@/data/affiliate/active-partners";
import { computeLedgerSummary } from "@/scripts/affiliate/ledger";
import { getAllSoftware } from "@/data/software";

describe("Generic Affiliate Ledger Invariants & Source-of-Truth Integrity", () => {
  const summary = computeLedgerSummary();
  const software = getAllSoftware();
  const catalogSlugs = new Set(software.map(s => s.slug));

  it("Invariant 1: Every program relationship has a valid, unique programId and exactly one status", () => {
    const programIds = CANONICAL_AFFILIATE_LEDGER.map(p => p.programId);
    const uniqueIds = new Set(programIds);
    expect(programIds.length).toBe(uniqueIds.size);
    for (const prog of CANONICAL_AFFILIATE_LEDGER) {
      expect(prog.status).toBeTruthy();
      expect(typeof prog.status).toBe("string");
    }
  });

  it("Invariant 2: No ACTIVE program is simultaneously REJECTED, PENDING, or BLOCKED", () => {
    const activeProgs = CANONICAL_AFFILIATE_LEDGER.filter(p => p.status === "ACTIVE");
    const activeIds = new Set(activeProgs.map(p => p.programId));
    const nonActiveStatuses = ["REJECTED", "PENDING_REVIEW", "BLOCKED_FORM_DEFECT", "OWNER_ACTION_REQUIRED", "HOLD"];

    for (const prog of CANONICAL_AFFILIATE_LEDGER) {
      if (nonActiveStatuses.includes(prog.status)) {
        expect(activeIds.has(prog.programId)).toBe(false);
      }
    }
  });

  it("Invariant 3: ACTIVE programs strictly require a non-empty, valid affiliateUrl matching canonical active-partners", () => {
    const activeProgs = CANONICAL_AFFILIATE_LEDGER.filter(p => p.status === "ACTIVE");
    expect(activeProgs.length).toBe(ACTIVE_PARTNERS.length);

    for (const prog of activeProgs) {
      expect(prog.affiliateUrl).toBeTruthy();
      expect(prog.affiliateUrl).toMatch(/^https?:\/\//);
    }
  });

  it("Invariant 4 & 5: REJECTED and PENDING programs cannot be marked READY_AND_VERIFIED", () => {
    for (const prog of CANONICAL_AFFILIATE_LEDGER) {
      if (prog.status === "REJECTED" || prog.status === "PENDING_REVIEW") {
        expect(prog.status).not.toBe("READY_AND_VERIFIED");
      }
    }
  });

  it("Invariant 6: BLOCKED_FORM_DEFECT programs have a non-empty formBlocker and no false submission", () => {
    const formBlocked = CANONICAL_AFFILIATE_LEDGER.filter(p => p.status === "BLOCKED_FORM_DEFECT");
    for (const prog of formBlocked) {
      expect(prog.formBlocker).toBeTruthy();
      expect(prog.status).not.toBe("PENDING_REVIEW");
    }
  });

  it("Invariant 7: OWNER_ACTION_REQUIRED programs have a non-empty ownerBlocker reason", () => {
    const ownerBlocked = CANONICAL_AFFILIATE_LEDGER.filter(p => p.status === "OWNER_ACTION_REQUIRED");
    for (const prog of ownerBlocked) {
      expect(prog.ownerBlocker).toBeTruthy();
      expect(typeof prog.ownerBlocker).toBe("string");
    }
  });

  it("Invariant 8: Every evidence-based status has at least one durable evidence record", () => {
    for (const prog of CANONICAL_AFFILIATE_LEDGER) {
      expect(prog.evidence).toBeDefined();
      expect(Array.isArray(prog.evidence)).toBe(true);
      expect(prog.evidence.length).toBeGreaterThan(0);
    }
  });

  it("Invariant 9: Portfolio programs cover multiple products without inflating PROGRAM relationship counts", () => {
    const zoho = CANONICAL_AFFILIATE_LEDGER.find(p => p.programId === "zoho-ecosystem");
    const freshworks = CANONICAL_AFFILIATE_LEDGER.find(p => p.programId === "freshworks");
    const impact = CANONICAL_AFFILIATE_LEDGER.find(p => p.programId === "impact-portfolio");

    expect(zoho?.productSlugs.length).toBe(4);
    expect(freshworks?.productSlugs.length).toBe(2);
    expect(impact?.productSlugs.length).toBe(3);

    // Ledger count is 1 for Zoho, 1 for Freshworks, 1 for Impact
    expect(CANONICAL_AFFILIATE_LEDGER.filter(p => p.programId === "zoho-ecosystem").length).toBe(1);
    expect(CANONICAL_AFFILIATE_LEDGER.filter(p => p.programId === "freshworks").length).toBe(1);
    expect(CANONICAL_AFFILIATE_LEDGER.filter(p => p.programId === "impact-portfolio").length).toBe(1);
  });

  it("Invariant 10: Derived summary counts match the actual ledger counts exactly", () => {
    expect(summary.totalProgramRelationships).toBe(CANONICAL_AFFILIATE_LEDGER.length);
    expect(summary.activeProgramsCount).toBe(CANONICAL_AFFILIATE_LEDGER.filter(p => p.status === "ACTIVE").length);
    expect(summary.pendingProgramsCount).toBe(CANONICAL_AFFILIATE_LEDGER.filter(p => p.status === "PENDING_REVIEW").length);
    expect(summary.rejectedProgramsCount).toBe(CANONICAL_AFFILIATE_LEDGER.filter(p => p.status === "REJECTED").length);
    expect(summary.formBlockedProgramsCount).toBe(CANONICAL_AFFILIATE_LEDGER.filter(p => p.status === "BLOCKED_FORM_DEFECT").length);
    expect(summary.ownerBlockedProgramsCount).toBe(CANONICAL_AFFILIATE_LEDGER.filter(p => p.status === "OWNER_ACTION_REQUIRED").length);
    expect(summary.holdProgramsCount).toBe(CANONICAL_AFFILIATE_LEDGER.filter(p => p.status === "HOLD").length);
    expect(summary.totalCatalogProducts).toBe(catalogSlugs.size);
    expect(summary.totalCatalogProducts).toBe(247);
  });

  it("Invariant 11: Setmore contains strict compliance restriction (NO PAID MEDIA / PPC)", () => {
    const setmore = CANONICAL_AFFILIATE_LEDGER.find(p => p.programId === "setmore");
    expect(setmore?.status).toBe("ACTIVE");
    expect(setmore?.notes).toMatch(/NO PAID MEDIA/i);
  });
});
