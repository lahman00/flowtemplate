import fs from "node:fs";
import path from "node:path";
import { getAllSoftware, getSoftware } from "@/data/software";
import { PUBLISHED_COMPARISONS, getComparisonSlug, getComparisonsInvolving } from "@/data/comparisons";

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
 *              days old by the time this runs, AND only present in
 *              environments that happen to have this local/ephemeral
 *              agent-output file — /var/ is gitignored (never committed,
 *              by design: it's agent working state, not source), so nothing
 *              guarantees it exists on a clean clone or in the Vercel build.
 *              Loaded at RUNTIME via fs, never as a compile-time import
 *              (2026-08-22 production incident: a static JSON import of
 *              this exact file broke the Vercel build with "Cannot find
 *              module" the moment it built from a checkout that never had
 *              this ephemeral file locally generated). Missing or invalid
 *              cache degrades cleanly to zero CACHED rows — never
 *              fabricated, never crashes.
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

export const GSC_CACHE_PATH = path.join(process.cwd(), "var", "agents", "gsc-opportunity-mining.json");

function isGscOpportunity(value: unknown): value is GscOpportunity {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.targetSlug === "string" && typeof v.baselineImpressions === "number" && typeof v.baselinePosition === "number";
}

/**
 * Never throws, never fabricates: a missing file, a malformed file, or a
 * file whose shape doesn't match what's expected all resolve to the same
 * safe outcome — an empty map, i.e. every page falls back to INFERRED.
 */
export function loadCachedGscOpportunities(): Map<string, GscOpportunity> {
  try {
    const raw = fs.readFileSync(GSC_CACHE_PATH, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    const list = parsed && typeof parsed === "object" && Array.isArray((parsed as Record<string, unknown>).allOpportunities)
      ? (parsed as { allOpportunities: unknown[] }).allOpportunities
      : [];
    const valid = list.filter(isGscOpportunity);
    return new Map(valid.map((o) => [o.targetSlug, o]));
  } catch {
    return new Map();
  }
}

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
  const gscBySlug = loadCachedGscOpportunities();
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
  const cacheAvailable = loadCachedGscOpportunities().size > 0;
  const rows = buildIndexationPriorityList(50);
  const cachedCount = rows.filter((r) => r.evidenceType === "CACHED").length;
  console.log("========================================================================================");
  if (!cacheAvailable) {
    console.log(` NOTE: ${GSC_CACHE_PATH} is missing, empty, or invalid on this run — every row below is INFERRED (structural proxies only, no real GSC demand evidence).`);
  }
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
