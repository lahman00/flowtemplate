import { getAllSoftware, getSoftware } from "@/data/software";
import { PUBLISHED_COMPARISONS, getComparisonSlug, getComparisonsInvolving } from "@/data/comparisons";
import gscOpportunityMining from "@/var/agents/gsc-opportunity-mining.json";

/**
 * ROAD TO THE FIRST 1,000 REAL HUMANS mission (2026-08-22) Priority 2 —
 * "Google trusts 50 excellent Miloosh pages before Google indexes 1,500
 * mediocre ones." Every row is explicitly labeled by evidence type, per
 * instruction:
 *
 *   CURRENT  — would require a fresh GSC pull; never available this
 *              session (access remains blocked).
 *   CACHED   — a real number from var/agents/gsc-opportunity-mining.json,
 *              an authenticated API pull from 2026-08-13. Real, but 9+
 *              days old by the time this runs.
 *   INFERRED — no direct demand evidence exists for this specific page;
 *              scored only on structural proxies (comparison-graph
 *              connectivity, freshness). Never presented as if it were
 *              real demand data.
 *
 * Scoring is deliberately simple and auditable (no learned weights, no
 * black box): real evidence always outranks inferred evidence, and within
 * each tier, more connectivity + fresher data wins.
 */

type GscOpportunity = { targetSlug: string; baselineImpressions: number; baselinePosition: number };
const gscBySlug = new Map<string, GscOpportunity>((gscOpportunityMining.allOpportunities as GscOpportunity[]).map((o) => [o.targetSlug, o]));

export interface IndexationPriorityRow {
  url: string;
  kind: "software" | "comparison";
  evidenceType: "CACHED" | "INFERRED";
  gscImpressions?: number;
  gscPosition?: number;
  connectivity: number;
  accessedAt: string;
  score: number;
}

function daysSince(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / (24 * 60 * 60 * 1000);
}

export function buildIndexationPriorityList(topN = 50): IndexationPriorityRow[] {
  const rows: IndexationPriorityRow[] = [];

  for (const software of getAllSoftware()) {
    const gsc = gscBySlug.get(software.slug);
    const connectivity = getComparisonsInvolving(software.slug).length;
    const freshnessScore = Math.max(0, 30 - daysSince(software.accessedAt)); // real signal within a 30-day window; older data contributes nothing extra, never penalized below 0
    const score = gsc ? gsc.baselineImpressions * 10 + (100 - Math.min(100, gsc.baselinePosition)) + connectivity + freshnessScore : connectivity * 2 + freshnessScore;
    rows.push({
      url: `/software/${software.slug}`,
      kind: "software",
      evidenceType: gsc ? "CACHED" : "INFERRED",
      ...(gsc ? { gscImpressions: gsc.baselineImpressions, gscPosition: gsc.baselinePosition } : {}),
      connectivity,
      accessedAt: software.accessedAt,
      score: Math.round(score * 10) / 10,
    });
  }

  for (const [aSlug, bSlug] of PUBLISHED_COMPARISONS) {
    const slug = getComparisonSlug(aSlug, bSlug);
    const gsc = gscBySlug.get(slug);
    const softwareA = getSoftware(aSlug);
    const softwareB = getSoftware(bSlug);
    if (!softwareA || !softwareB) continue;
    const connectivity = getComparisonsInvolving(aSlug).length + getComparisonsInvolving(bSlug).length;
    const accessedAt = [softwareA.accessedAt, softwareB.accessedAt].sort().at(-1)!;
    const freshnessScore = Math.max(0, 30 - daysSince(accessedAt));
    const score = gsc ? gsc.baselineImpressions * 10 + (100 - Math.min(100, gsc.baselinePosition)) + connectivity * 0.5 + freshnessScore : connectivity * 0.5 + freshnessScore;
    rows.push({
      url: `/compare/${slug}`,
      kind: "comparison",
      evidenceType: gsc ? "CACHED" : "INFERRED",
      ...(gsc ? { gscImpressions: gsc.baselineImpressions, gscPosition: gsc.baselinePosition } : {}),
      connectivity,
      accessedAt,
      score: Math.round(score * 10) / 10,
    });
  }

  return rows.sort((a, b) => b.score - a.score).slice(0, topN);
}

async function main() {
  const rows = buildIndexationPriorityList(50);
  const cachedCount = rows.filter((r) => r.evidenceType === "CACHED").length;
  console.log("========================================================================================");
  console.log(` TOP 50 PAGES TO STRENGTHEN FOR INDEXATION TRUST (${cachedCount} backed by real cached GSC evidence, ${rows.length - cachedCount} inferred from structural proxies only)`);
  console.log("========================================================================================");
  for (const r of rows) {
    const evidence = r.evidenceType === "CACHED" ? `CACHED: ${r.gscImpressions} impr @ pos ${r.gscPosition?.toFixed(1)}` : "INFERRED (no direct demand evidence)";
    console.log(`   ${r.url.padEnd(45)} score ${r.score.toString().padStart(6)} | ${evidence}`);
  }
  console.log("========================================================================================\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
