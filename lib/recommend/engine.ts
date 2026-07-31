import { getAllSoftware } from "@/data/software";
import { getComparisonsInvolving, getComparisonSlug } from "@/data/comparisons";
import { CONS_DISCLOSURE, generateProsList } from "@/lib/comparison";
import { scoreSoftwareForAnswers } from "@/lib/recommend/scoring";
import type { RecommendationAnswers, ScoringStrategy, SoftwareRecommendation } from "@/lib/recommend/types";

/**
 * Sprint 10 — assembles the top-N recommendations from the scoring engine.
 * Ranking, pros/cons, and related-comparison lookups all come from real
 * data already in the codebase: pros reuse the same
 * generateProsList(software) that /compare pages use (a product's own
 * sourced features, not editorial praise), and cons reuse the same
 * CONS_DISCLOSURE honesty note rather than inventing weaknesses.
 *
 * Phase 6: `scorer` defaults to the deterministic scoreSoftwareForAnswers
 * but can be swapped for any function matching the ScoringStrategy shape
 * — nothing else in this file, the wizard, or the results page needs to
 * change for a future AI-based scorer to plug in.
 */
export function getRecommendations(
  answers: RecommendationAnswers,
  limit = 3,
  scorer: ScoringStrategy = scoreSoftwareForAnswers
): SoftwareRecommendation[] {
  const scored = getAllSoftware().map((software) => ({
    software,
    scoring: scorer(software, answers),
  }));

  scored.sort((a, b) => b.scoring.totalScore - a.scoring.totalScore);

  return scored.slice(0, limit).map(({ software, scoring }, index) => {
    const relatedComparisonSlugs = getComparisonsInvolving(software.slug).map(([slugA, slugB]) =>
      getComparisonSlug(slugA, slugB)
    );

    return {
      software,
      rank: index + 1,
      scoring,
      pros: generateProsList(software),
      consDisclosure: CONS_DISCLOSURE,
      relatedComparisonSlugs,
    };
  });
}
