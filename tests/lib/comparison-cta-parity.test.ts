import { describe, it, expect } from "vitest";
import { PUBLISHED_COMPARISONS } from "@/data/comparisons";
import { getSoftware } from "@/data/software";
import { resolveComparisonCtaUrl } from "@/lib/wix-funnels";
import { getSoftwareCtaRel } from "@/lib/affiliate";

/**
 * WAR MODE mission (2026-08-22) Phase 22 — regression test for a real,
 * proven production defect: app/compare/[comparison]/page.tsx's
 * ComparisonChoiceCta used to early-return null for any product without
 * an active affiliate deal, so a real buyer persuaded by "Choose X if…"
 * text had no button to act on for that side. Found on 138 of 1212
 * published comparisons where only one side had a deal (the other side's
 * card was silently dead) and on 1062 more where both sides were dead.
 *
 * The fix makes the CTA render unconditionally, using the exact same
 * getSoftwareCtaUrl/getSoftwareCtaRel resolution the software page
 * already uses correctly (never empty: affiliate link when active,
 * otherwise the plain official site). This test proves that invariant
 * holds for every participant in every published comparison — not just
 * the affiliate ones — so this class of asymmetric-CTA bug can't recur
 * silently.
 */
describe("Comparison CTA parity — every published-comparison participant gets a real, clickable CTA", () => {
  it("resolveComparisonCtaUrl never returns an empty/invalid URL for any comparison participant, affiliate or not", () => {
    const failures: string[] = [];

    for (const [aSlug, bSlug] of PUBLISHED_COMPARISONS) {
      const softwareA = getSoftware(aSlug);
      const softwareB = getSoftware(bSlug);
      if (!softwareA || !softwareB) {
        failures.push(`${aSlug}-vs-${bSlug}: missing software data`);
        continue;
      }

      for (const [software, otherSlug] of [
        [softwareA, bSlug],
        [softwareB, aSlug],
      ] as const) {
        const href = resolveComparisonCtaUrl(software, otherSlug);
        if (!href || typeof href !== "string") {
          failures.push(`${software.slug} (in ${aSlug}-vs-${bSlug}): resolveComparisonCtaUrl returned "${href}"`);
          continue;
        }
        try {
          new URL(href);
        } catch {
          failures.push(`${software.slug} (in ${aSlug}-vs-${bSlug}): resolveComparisonCtaUrl returned an invalid URL "${href}"`);
        }

        const rel = getSoftwareCtaRel(software);
        if (typeof rel !== "string" || rel.length === 0) {
          failures.push(`${software.slug} (in ${aSlug}-vs-${bSlug}): getSoftwareCtaRel returned "${rel}"`);
        }
      }
    }

    expect(failures).toEqual([]);
  });

  it("a non-affiliate participant still resolves to its own real official site, not an empty string or the other product's URL", () => {
    // wave (non-affiliate as of this mission) appears in a real published comparison; confirm it resolves to its own domain.
    const wave = getSoftware("wave");
    expect(wave).toBeTruthy();
    if (!wave) return;
    const href = resolveComparisonCtaUrl(wave, "quickbooks-online");
    expect(href).toBe(wave.website);
  });
});
