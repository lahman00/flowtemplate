import { describe, it, expect } from "vitest";
import { run as ga4CodeAuditRun } from "@/scripts/agents/qa/ga4-consent-code-audit";

/**
 * Runs the real qa-ga4-consent-code-audit agent against this actual
 * repository's current source files — a genuine regression test: if a
 * future change removes lib/consent.ts, ConsentBanner.tsx,
 * GoogleAnalyticsConsent.tsx, or CookiePreferencesControl.tsx, or makes
 * components/Analytics.tsx stop delegating to the consent-gated
 * component, this test fails. This directly satisfies the brief's "Do not
 * remove or weaken this implementation... add automated regression checks
 * where technically practical" for GA4/consent (Section F).
 */
describe("GA4 consent code audit (Section F regression guard)", () => {
  it("finds no regressions in the current repository state", async () => {
    const result = await ga4CodeAuditRun({ mode: "quick", previousFindings: [], swarmFindingsSoFar: [] });
    expect(result.findings, JSON.stringify(result.findings, null, 2)).toEqual([]);
    expect(result.summary).toContain("passed");
  });
});
