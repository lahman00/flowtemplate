import { getAllSoftware, getSoftware } from "@/data/software";
import { getAllCategories } from "@/data/categories";
import { PUBLISHED_COMPARISONS, getComparisonSlug } from "@/data/comparisons";
import { SITE_URL } from "@/lib/site";
import { GoogleSearchConsoleClient } from "@/scripts/agents/seo/lib/google-search-console-client";
import { classifyUrlTemplate, type UrlTemplate } from "@/scripts/agents/seo/lib/url-template-classifier";
import { computeInboundCounts } from "@/scripts/agents/growth/internal-link-opportunity";
import { wordSet, jaccardSimilarity } from "@/scripts/agents/shared/text-similarity";
import { scoreSoftware } from "@/scripts/maintenance/freshness";
import { getRevenueScore } from "@/lib/revenue/scoring";
import { getRevenueTier, type RevenueTier } from "@/lib/revenue/tiers";
import { inspectSampleWithCache } from "@/scripts/agents/seo/lib/inspect-with-cache";
import { recentAndPriorWindows } from "@/scripts/agents/seo/lib/date-windows";
import { makeEvidenceGradedFinding } from "@/scripts/agents/shared/evidence-graded-finding";
import type { AgentRunFn, Finding } from "@/types/agents";
import type { UrlInspectionResult } from "@/scripts/agents/seo/lib/google-search-console-client";

/**
 * The centerpiece of the indexation-analysis workflow (item C of the
 * brief's A-J list): are there MEASURABLE differences between Miloosh's
 * indexed pages and its crawled-but-not-indexed pages? Reuses, rather
 * than duplicates:
 *   - D (internal link strength): computeInboundCounts, exported from
 *     growth-internal-link-opportunity.ts.
 *   - E (content similarity): wordSet/jaccardSimilarity, extracted to
 *     scripts/agents/shared/text-similarity.ts (already shared by two
 *     other agents before this one).
 *   - H (search demand overlay): the same Search Analytics
 *     dimension=page query the CTR/content-opportunity agents already use.
 * B (template distribution) is a dimension computed here via the pure
 * classifyUrlTemplate utility, not a separate scheduled agent — see
 * docs/agents-architecture.md for why.
 *
 * Every finding uses makeEvidenceGradedFinding: a measured group
 * difference is the OBSERVATION; a possible contributing factor is the
 * HYPOTHESIS, explicitly never asserted as the cause; CONFIDENCE is
 * capped well below 1.0 for every dimension, because a same-time
 * correlation across ~50 sampled URLs cannot establish causation on its
 * own, in either direction; each finding proposes a genuinely minimal,
 * verifiable next step, never a bulk content rewrite.
 *
 * Sampling strategy (why not just "inspect 50 random URLs"): with the
 * owner-reported baseline at ~2.8% indexed (38/1,358), a naive random
 * sample would very likely contain zero indexed pages by chance, making
 * any comparison impossible. This deliberately biases the sample toward
 * pages likely to be indexed (homepage, every category page, a spread of
 * software pages across revenue tiers) alongside a real sample of the
 * dominant unindexed population (comparison pages are ~1,107 of the
 * 1,358 sitemap URLs) — a genuine attempt to get both groups populated,
 * not proof that it will always succeed; if one group ends up empty, this
 * agent says so rather than fabricating a comparison.
 */

const SOFTWARE_SAMPLE_SIZE = 15;
const COMPARISON_SAMPLE_SIZE = 16;
const RELATIVE_DIFFERENCE_THRESHOLD = 0.3; // 30%+ relative gap between group averages before it's worth reporting

export type UrlProfile = {
  url: string;
  template: UrlTemplate;
  indexState: "indexed" | "crawled_not_indexed" | "other";
  inboundLinks: number | null;
  contentLength: number | null;
  freshnessScore: number | null;
  revenueTier: RevenueTier | null;
  maxSimilarityToOther: number | null;
  impressions: number | null;
  clicks: number | null;
};

/** Exported so seo-canonical-consistency-analyzer.ts and seo-crawl-recency-analyzer.ts sample the exact same URL set — sharing one inspection pass (via the state.ts cache) across all three agents instead of each independently re-inspecting, real quota discipline in practice, not just in principle. */
export function evenSample<T>(items: T[], size: number): T[] {
  if (items.length <= size) return items;
  const step = items.length / size;
  return Array.from({ length: size }, (_, i) => items[Math.floor(i * step)]);
}

export function buildSampleUrls(): string[] {
  const software = getAllSoftware();
  const categories = getAllCategories();
  const homepage = [`${SITE_URL}/`];
  const categoryUrls = categories.map((c) => `${SITE_URL}/category/${c.slug}`);
  const softwareUrls = evenSample(software, SOFTWARE_SAMPLE_SIZE).map((s) => `${SITE_URL}/software/${s.slug}`);
  const comparisonUrls = evenSample([...PUBLISHED_COMPARISONS], COMPARISON_SAMPLE_SIZE).map(([a, b]) => `${SITE_URL}/compare/${getComparisonSlug(a, b)}`);
  return [...homepage, ...categoryUrls, ...softwareUrls, ...comparisonUrls];
}

function classifyIndexState(inspection: UrlInspectionResult): UrlProfile["indexState"] {
  if (inspection.verdict === "PASS" && inspection.coverageState?.toLowerCase().includes("indexed") && !inspection.coverageState?.toLowerCase().includes("not indexed")) {
    return "indexed";
  }
  if (inspection.coverageState?.toLowerCase().includes("crawled") && inspection.coverageState?.toLowerCase().includes("not indexed")) {
    return "crawled_not_indexed";
  }
  return "other";
}

function extractSlugFromPath(path: string, prefix: string): string | null {
  return path.startsWith(prefix) ? path.slice(prefix.length) : null;
}

function buildProfile(url: string, inspection: UrlInspectionResult, allSoftware: ReturnType<typeof getAllSoftware>, inboundCounts: Map<string, number>, impressionsByPage: Map<string, { impressions: number; clicks: number }>): UrlProfile {
  const path = url.replace(SITE_URL, "");
  const template = classifyUrlTemplate(path);
  const indexState = classifyIndexState(inspection);
  const perf = impressionsByPage.get(url);

  let inboundLinks: number | null = null;
  let contentLength: number | null = null;
  let freshnessScore: number | null = null;
  let revenueTier: RevenueTier | null = null;
  let maxSimilarityToOther: number | null = null;

  const softwareSlug = extractSlugFromPath(path, "/software/");
  if (softwareSlug) {
    const software = getSoftware(softwareSlug);
    if (software) {
      inboundLinks = inboundCounts.get(softwareSlug) ?? null;
      contentLength = software.description.length;
      freshnessScore = scoreSoftware(software, new Date()).score;
      revenueTier = getRevenueTier(getRevenueScore(software).totalScore);
      const words = wordSet(software.description);
      maxSimilarityToOther = Math.max(0, ...allSoftware.filter((s) => s.slug !== softwareSlug).map((s) => jaccardSimilarity(words, wordSet(s.description))));
    }
  }

  return {
    url,
    template,
    indexState,
    inboundLinks,
    contentLength,
    freshnessScore,
    revenueTier,
    maxSimilarityToOther,
    impressions: perf?.impressions ?? null,
    clicks: perf?.clicks ?? null,
  };
}

type NumericDimension = "inboundLinks" | "contentLength" | "freshnessScore" | "maxSimilarityToOther" | "impressions" | "clicks";

const DIMENSION_LABELS: Record<NumericDimension, string> = {
  inboundLinks: "internal inbound link count",
  contentLength: "catalog description length (characters)",
  freshnessScore: "documentation freshness score",
  maxSimilarityToOther: "content similarity to its most similar other page",
  impressions: "Search Console impressions",
  clicks: "Search Console clicks",
};

const DIMENSION_HYPOTHESES: Record<NumericDimension, (indexedAvg: number, nonIndexedAvg: number) => string> = {
  inboundLinks: (i, n) => (i > n ? "Pages with more internal links may be easier for Google to discover and prioritize crawling/indexing." : "Higher internal link counts on non-indexed pages suggest link count alone isn't the limiting factor here."),
  contentLength: (i, n) => (i > n ? "Shorter descriptions may read as thinner content, a commonly cited (though not confirmed) factor in indexing decisions." : "Non-indexed pages having longer descriptions suggests length alone isn't the limiting factor."),
  freshnessScore: (i, n) => (i > n ? "Less-documented/staler entries may correlate with lower indexing priority." : "Freshness doesn't appear to distinguish the two groups here."),
  maxSimilarityToOther: (i, n) => (i < n ? "Higher similarity to another page may read as programmatic duplication, a documented reason Google excludes pages." : "Similarity to other pages doesn't appear to distinguish the two groups here."),
  impressions: (i, n) => (i > n ? "Indexed pages already receiving impressions could reflect existing rank rather than a cause of indexing." : "Impressions don't appear to distinguish the two groups here."),
  clicks: () => "Click data mirrors impressions and should be read alongside it, not as an independent factor.",
};

export function compareIndexationGroups(agentId: string, profiles: UrlProfile[]): { findings: Finding[]; summary: string } {
  const indexed = profiles.filter((p) => p.indexState === "indexed");
  const nonIndexed = profiles.filter((p) => p.indexState === "crawled_not_indexed");

  if (indexed.length === 0 || nonIndexed.length === 0) {
    return {
      findings: [],
      summary: `Sample had ${indexed.length} indexed and ${nonIndexed.length} crawled-not-indexed URL(s) — need at least one of each to compare; no comparison run.`,
    };
  }

  const findings: Finding[] = [];
  const dimensions: NumericDimension[] = ["inboundLinks", "contentLength", "freshnessScore", "maxSimilarityToOther", "impressions", "clicks"];

  for (const dim of dimensions) {
    const indexedValues = indexed.map((p) => p[dim]).filter((v): v is number => v !== null);
    const nonIndexedValues = nonIndexed.map((p) => p[dim]).filter((v): v is number => v !== null);
    if (indexedValues.length === 0 || nonIndexedValues.length === 0) continue;

    const indexedAvg = indexedValues.reduce((a, b) => a + b, 0) / indexedValues.length;
    const nonIndexedAvg = nonIndexedValues.reduce((a, b) => a + b, 0) / nonIndexedValues.length;
    const larger = Math.max(indexedAvg, nonIndexedAvg);
    const smaller = Math.min(indexedAvg, nonIndexedAvg);
    const relativeDiff = larger === 0 ? 0 : (larger - smaller) / larger;
    if (relativeDiff < RELATIVE_DIFFERENCE_THRESHOLD) continue;

    findings.push(
      makeEvidenceGradedFinding({
        agentId,
        kind: "issue",
        severity: "info",
        title: `Indexed vs. non-indexed pages differ in ${DIMENSION_LABELS[dim]}`,
        observation: `Across this sample, indexed pages average ${indexedAvg.toFixed(1)} ${DIMENSION_LABELS[dim]} (n=${indexedValues.length}) vs. ${nonIndexedAvg.toFixed(1)} for crawled-but-not-indexed pages (n=${nonIndexedValues.length}) — a ${(relativeDiff * 100).toFixed(0)}% relative difference.`,
        hypothesis: DIMENSION_HYPOTHESES[dim](indexedAvg, nonIndexedAvg),
        evidence: [
          `Indexed group avg: ${indexedAvg.toFixed(2)} (n=${indexedValues.length})`,
          `Non-indexed group avg: ${nonIndexedAvg.toFixed(2)} (n=${nonIndexedValues.length})`,
          ...indexed.slice(0, 3).map((p) => `indexed: ${p.url.replace(SITE_URL, "")} = ${p[dim]}`),
          ...nonIndexed.slice(0, 3).map((p) => `non-indexed: ${p.url.replace(SITE_URL, "")} = ${p[dim]}`),
        ],
        hypothesisConfidence: 0.4, // deliberately capped — one dimension, one sample, correlational only
        proposedTest: `Select 3-5 non-indexed pages with the weakest ${DIMENSION_LABELS[dim]} value, make one minimal, reversible improvement to just that dimension, and re-check their indexing status after 2-4 weeks via seo-experiment-verifier.`,
        location: null,
        riskLevel: 2,
        dedupeKey: `${agentId}:${dim}`,
      })
    );
  }

  // Template distribution (B) — always reported, not gated by a numeric threshold, since it's a straight count comparison.
  const templateCounts = (group: UrlProfile[]) => {
    const counts: Record<string, number> = {};
    for (const p of group) counts[p.template] = (counts[p.template] ?? 0) + 1;
    return counts;
  };
  const indexedTemplates = templateCounts(indexed);
  const nonIndexedTemplates = templateCounts(nonIndexed);
  findings.push(
    makeEvidenceGradedFinding({
      agentId,
      kind: "info",
      severity: "info",
      title: "Template distribution across indexed vs. non-indexed sample",
      observation: `Indexed sample by template: ${JSON.stringify(indexedTemplates)}. Non-indexed sample by template: ${JSON.stringify(nonIndexedTemplates)}.`,
      hypothesis: "If one template type (e.g. comparison pages) dominates the non-indexed group far more than its overall share of the sitemap, that template may warrant closer investigation as a group — not proof any individual page in it is deficient.",
      evidence: [`Indexed: ${JSON.stringify(indexedTemplates)}`, `Non-indexed: ${JSON.stringify(nonIndexedTemplates)}`],
      hypothesisConfidence: 0.3,
      proposedTest: "Compare this sample's template mix against the full sitemap's actual template mix (217 software / 18 category / 1,107 comparison / statics) to see if the non-indexed sample's skew simply reflects the sitemap's own composition rather than a template-specific problem.",
      location: null,
      riskLevel: 1,
      dedupeKey: `${agentId}:template-distribution`,
    })
  );

  return {
    findings,
    summary: `Compared ${indexed.length} indexed vs ${nonIndexed.length} crawled-not-indexed URLs across ${dimensions.length} dimensions + template distribution. ${findings.length} finding(s), each evidence-graded (observation/hypothesis/confidence/proposed test) — none asserts causation.`,
  };
}

export const run: AgentRunFn = async () => {
  const agentId = "seo-indexed-vs-nonindexed-comparator";
  const client = GoogleSearchConsoleClient.fromEnv();
  if (!client) {
    throw new Error("GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT / GOOGLE_SEARCH_CONSOLE_PROPERTY not configured — this agent must not run without real credentials.");
  }

  const allSoftware = getAllSoftware();
  const sampleUrls = buildSampleUrls();

  const { results: allInspections, cachedCount, freshCount } = await inspectSampleWithCache(client, sampleUrls);

  const { recent } = recentAndPriorWindows();
  const analyticsRows = await client.querySearchAnalytics({ ...recent, dimensions: ["page"], rowLimit: 1000 });
  const impressionsByPage = new Map(analyticsRows.map((r) => [r.keys[0], { impressions: r.impressions, clicks: r.clicks }]));

  const inboundCounts = computeInboundCounts(allSoftware);

  const profiles = sampleUrls
    .map((url) => {
      const inspection = allInspections.get(url);
      return inspection ? buildProfile(url, inspection, allSoftware, inboundCounts, impressionsByPage) : null;
    })
    .filter((p): p is UrlProfile => p !== null);

  const { findings, summary } = compareIndexationGroups(agentId, profiles);

  return {
    summary: `${summary} (${cachedCount} URLs served from cache, ${freshCount} freshly inspected.)`,
    findings,
  };
};
