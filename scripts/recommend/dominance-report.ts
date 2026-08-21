import "../social/_load-env";
import { getRecommendations } from "@/lib/recommend/engine";
import { DEFAULT_ANSWERS } from "@/lib/recommend/query";
import { RECOMMEND_DOMAINS } from "@/lib/recommend/domains";
import type { RecommendDomain } from "@/lib/recommend/domains";
import type { RecommendationAnswers } from "@/lib/recommend/types";

/**
 * Recommend Engine Integrity Patch (2026-08-21) — Phase 5. Runs a varied
 * set of scenarios per domain (team size, budget, difficulty preference,
 * AI need) and measures top-1 / top-3 frequency per product, per domain.
 * A product appearing as the top-1 pick in more than 70% of a domain's
 * scenarios is flagged for a human editorial look — not automatically
 * penalized, per the brief's explicit "fix evidence/profile errors, not
 * output statistics" instruction.
 */

const VARIATIONS: Array<Partial<RecommendationAnswers>> = [
  {},
  { teamSize: "solo", budget: "free", difficultyPreference: "simple" },
  { teamSize: "small", budget: "low" },
  { teamSize: "medium", companyStage: "growth" },
  { teamSize: "large", companyStage: "enterprise", difficultyPreference: "powerful" },
  { needsAi: true },
  { budget: "flexible", difficultyPreference: "powerful" },
  { workStyle: "remote" },
];

function main() {
  const dominanceFlags: string[] = [];
  let totalScenariosAcrossAllDomains = 0;
  let tiedScenariosAcrossAllDomains = 0;

  for (const domain of RECOMMEND_DOMAINS as readonly RecommendDomain[]) {
    const top1Counts = new Map<string, number>();
    const top3Counts = new Map<string, number>();
    let totalScenarios = 0;
    let tiedScenarios = 0;

    for (const variation of VARIATIONS) {
      const answers: RecommendationAnswers = { ...DEFAULT_ANSWERS, primaryNeed: domain, ...variation };
      const { recommendations } = getRecommendations(answers, 3);
      if (recommendations.length === 0) continue;
      totalScenarios++;
      top1Counts.set(recommendations[0].software.slug, (top1Counts.get(recommendations[0].software.slug) ?? 0) + 1);
      for (const rec of recommendations) {
        top3Counts.set(rec.software.slug, (top3Counts.get(rec.software.slug) ?? 0) + 1);
      }
      // Phase 18/32 — tie frequency: does rank 1 share its score with rank 2?
      if (recommendations.length > 1 && recommendations[1].scoring.totalScore === recommendations[0].scoring.totalScore) {
        tiedScenarios++;
      }
    }

    totalScenariosAcrossAllDomains += totalScenarios;
    tiedScenariosAcrossAllDomains += tiedScenarios;

    console.log(`\n${domain} (${totalScenarios} scenarios, ${tiedScenarios} tied at max score = ${totalScenarios > 0 ? ((tiedScenarios / totalScenarios) * 100).toFixed(0) : 0}%):`);
    const sortedTop1 = [...top1Counts.entries()].sort((a, b) => b[1] - a[1]);
    for (const [slug, count] of sortedTop1) {
      const pct = (count / totalScenarios) * 100;
      const flag = pct > 70 ? "  <-- >70% of scenarios, review" : "";
      console.log(`  top-1: ${slug.padEnd(28)} ${count}/${totalScenarios} (${pct.toFixed(0)}%)${flag}`);
      if (pct > 70) dominanceFlags.push(`${domain}: ${slug} is the top-1 pick in ${pct.toFixed(0)}% of scenarios`);
    }
    const sortedTop3 = [...top3Counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    console.log(`  top-3 appearances (top 5 shown):`);
    for (const [slug, count] of sortedTop3) {
      console.log(`    ${slug.padEnd(28)} ${count}/${totalScenarios}`);
    }
  }

  console.log(`\n${dominanceFlags.length === 0 ? "No dominance flags." : "DOMINANCE FLAGS:"}`);
  for (const flag of dominanceFlags) console.log(`  - ${flag}`);

  console.log(`\nOVERALL TIE FREQUENCY: ${tiedScenariosAcrossAllDomains}/${totalScenariosAcrossAllDomains} scenarios (${((tiedScenariosAcrossAllDomains / totalScenariosAcrossAllDomains) * 100).toFixed(0)}%) had a tie at the max score.`);
}

main();
