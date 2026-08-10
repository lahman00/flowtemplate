import { getAllSoftware } from "@/data/software";
import { PUBLISHED_COMPARISONS, getComparisonSlug } from "@/data/comparisons";
import { generateComparisonData } from "@/lib/comparison";
import { wordSet, jaccardSimilarity } from "@/scripts/agents/shared/text-similarity";
import { makeFinding } from "@/lib/agents/finding";
import type { AgentRunFn } from "@/types/agents";

/**
 * A content-forensics pass (2026-08-10, part of investigating the low
 * indexed-to-sitemap ratio without GSC access — see
 * docs/agents-architecture.md) found that comparison pages are 81.5% of
 * the entire sitemap (1,107 of 1,358 URLs) and that pages sharing one
 * product (e.g. every notion-vs-X page) run high word-overlap similarity
 * against each other. Reporting per-pair would mean thousands of findings
 * for a corpus this size (10,000+ shared-product pairs) — this agent
 * follows the same systemic-threshold pattern as
 * growth-title-description-quality: one aggregate finding describing the
 * distribution, plus the single most extreme example as evidence, not one
 * finding per pair.
 *
 * This does NOT claim similarity causes non-indexation — no GSC data
 * exists yet to test that. It's a measured, objective content-overlap
 * fact, reported so it's visible before and after GSC connects.
 */

const HIGH_SIMILARITY_THRESHOLD = 0.5;
const SYSTEMIC_RATE_THRESHOLD = 0.5; // report once if >=50% of shared-product pairs exceed the threshold

function comparisonFullText(a: ReturnType<typeof getAllSoftware>[number], b: ReturnType<typeof getAllSoftware>[number]): string {
  const data = generateComparisonData(a, b);
  const rowsText = data.rows.map((r) => `${r.label}: ${r.a} / ${r.b}`).join(" ");
  return [data.intro, rowsText, ...data.keyDifferences, data.whoShouldChooseA, data.whoShouldChooseB].join(" ");
}

export const run: AgentRunFn = async () => {
  const agentId = "content-comparison-similarity-analyzer";
  const software = getAllSoftware();
  const bySlug = new Map(software.map((s) => [s.slug, s]));

  const wordsBySlug = new Map<string, Set<string>>();
  const comparisonsByProduct = new Map<string, string[]>();

  for (const [slugA, slugB] of PUBLISHED_COMPARISONS) {
    const a = bySlug.get(slugA);
    const b = bySlug.get(slugB);
    if (!a || !b) continue;
    const slug = getComparisonSlug(slugA, slugB);
    wordsBySlug.set(slug, wordSet(comparisonFullText(a, b)));
    for (const s of [slugA, slugB]) {
      const list = comparisonsByProduct.get(s) ?? [];
      list.push(slug);
      comparisonsByProduct.set(s, list);
    }
  }

  let totalChecked = 0;
  let highSimilarityCount = 0;
  let mostSimilarPair: [string, string, number] | null = null;

  for (const [, slugs] of comparisonsByProduct) {
    if (slugs.length < 2) continue;
    for (let i = 0; i < slugs.length; i++) {
      for (let j = i + 1; j < slugs.length; j++) {
        totalChecked++;
        const similarity = jaccardSimilarity(wordsBySlug.get(slugs[i])!, wordsBySlug.get(slugs[j])!);
        if (similarity >= HIGH_SIMILARITY_THRESHOLD) {
          highSimilarityCount++;
          if (!mostSimilarPair || similarity > mostSimilarPair[2]) {
            mostSimilarPair = [slugs[i], slugs[j], similarity];
          }
        }
      }
    }
  }

  const rate = totalChecked === 0 ? 0 : highSimilarityCount / totalChecked;
  const findings = [];

  if (rate >= SYSTEMIC_RATE_THRESHOLD) {
    findings.push(
      makeFinding({
        agentId,
        kind: "issue",
        severity: "warning",
        title: `${(rate * 100).toFixed(0)}% of comparison-page pairs sharing a product exceed ${(HIGH_SIMILARITY_THRESHOLD * 100).toFixed(0)}% word-overlap similarity`,
        description: `Checked ${totalChecked} pairs of comparison pages that share one product (e.g. every notion-vs-X page against every other notion-vs-Y page) across ${PUBLISHED_COMPARISONS.length} published comparisons. ${highSimilarityCount} of them (${(rate * 100).toFixed(1)}%) have Jaccard word-overlap similarity ≥${HIGH_SIMILARITY_THRESHOLD}. Reported once, systemically, rather than as one finding per pair. This is a measured content-overlap fact, not a claim that it causes non-indexation — no GSC data exists yet to test that (see seo-indexed-vs-nonindexed-comparator once connected).`,
        location: "lib/comparison.ts (generateComparisonData)",
        evidence: mostSimilarPair
          ? [`Most similar pair: /compare/${mostSimilarPair[0]} <-> /compare/${mostSimilarPair[1]} (${(mostSimilarPair[2] * 100).toFixed(0)}% overlap)`, `${totalChecked} shared-product pairs checked`, `${highSimilarityCount} pairs at or above threshold`]
          : [`${totalChecked} shared-product pairs checked`],
        confidence: 1,
        riskLevel: 2,
        recommendedAction: "Treat as a candidate hypothesis for the indexation-analysis workflow once GSC is connected, not an immediate mass-rewrite trigger — Phase 3/5 of the indexation brief specifically warns against mass-editing 1,100+ pages without confirming evidence first.",
        dedupeKey: `${agentId}:systemic-shared-product-similarity`,
      })
    );
  }

  return {
    summary: `Checked ${totalChecked} shared-product comparison-page pairs across ${PUBLISHED_COMPARISONS.length} published comparisons. ${highSimilarityCount} (${(rate * 100).toFixed(1)}%) exceed ${(HIGH_SIMILARITY_THRESHOLD * 100).toFixed(0)}% word-overlap similarity. ${findings.length} finding(s).`,
    findings,
  };
};
