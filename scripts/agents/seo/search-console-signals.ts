import { SITE_URL } from "@/lib/site";
import { GoogleSearchConsoleClient } from "@/scripts/agents/seo/lib/google-search-console-client";
import { inspectSampleWithCache } from "@/scripts/agents/seo/lib/inspect-with-cache";
import { buildSampleUrls } from "@/scripts/agents/seo/indexed-vs-nonindexed-comparator";
import { makeFinding } from "@/lib/agents/finding";
import type { AgentRunFn } from "@/types/agents";
import type { UrlInspectionResult } from "@/scripts/agents/seo/lib/google-search-console-client";

/**
 * Item A: "index/search visibility" — real Search Console URL Inspection
 * data per sampled URL. This is the foundation the rest of the
 * indexation-analysis workflow (items C, F, G, I, J — all in this same
 * scripts/agents/seo/ directory) builds on; they share this exact sample
 * (buildSampleUrls, exported from indexed-vs-nonindexed-comparator.ts)
 * and the same inspection cache (inspectSampleWithCache) so one swarm run
 * makes one set of URL Inspection calls, not five.
 *
 * Section C of the brief is explicit that DISCOVERED / CRAWLED /
 * INDEXABLE / INDEXED / GETTING IMPRESSIONS / GETTING CLICKS / RANKING
 * are different states, and "not indexed yet" isn't automatically a
 * technical failure. The classification below matches Google's own
 * documented coverageState strings (e.g. "Crawled - currently not
 * indexed" is a real, common, often-benign state — see
 * developers.google.com's IndexStatusInspectionResult reference) rather
 * than collapsing everything non-PASS into one bucket.
 *
 * Real code, fully unit-tested (tests/agents/google-search-console.test.ts
 * covers the client; this file's classify() is simple enough to be
 * covered by the same real-world coverageState strings used throughout
 * the indexation-workflow tests) — blocked only on a real credential.
 * Required env vars once one exists:
 *   GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT — service account JSON (raw or base64)
 *   GOOGLE_SEARCH_CONSOLE_PROPERTY — exact GSC property, e.g.
 *     "sc-domain:miloosh.com" (the target property here) or a URL-prefix
 *     form like "https://miloosh.com/"
 * The service account must be added as a user (read access is enough) on
 * that property in Search Console's own "Users and permissions" screen —
 * an owner-side step no code change can substitute for.
 */

export type IndexCoverageLabel = "INDEXED" | "CRAWLED_NOT_INDEXED" | "EXCLUDED" | "UNKNOWN";

export function classify(result: UrlInspectionResult): { severity: "critical" | "warning" | "info"; label: IndexCoverageLabel } {
  const coverage = result.coverageState?.toLowerCase() ?? "";
  if (result.verdict === "PASS" && coverage.includes("indexed") && !coverage.includes("not indexed")) {
    return { severity: "info", label: "INDEXED" };
  }
  if (coverage.includes("crawled") && coverage.includes("not indexed")) {
    return { severity: "info", label: "CRAWLED_NOT_INDEXED" }; // Section C: not automatically a failure — reported as info, not warning
  }
  if (result.verdict === "FAIL") {
    return { severity: "warning", label: "EXCLUDED" };
  }
  return { severity: "warning", label: "UNKNOWN" };
}

export const run: AgentRunFn = async () => {
  const agentId = "seo-search-console-signals";
  const client = GoogleSearchConsoleClient.fromEnv();
  if (!client) {
    throw new Error("GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT / GOOGLE_SEARCH_CONSOLE_PROPERTY not configured — this agent must not run without real credentials.");
  }

  const urls = buildSampleUrls();
  const { results, cachedCount, freshCount } = await inspectSampleWithCache(client, urls);

  const distribution: Record<IndexCoverageLabel, number> = { INDEXED: 0, CRAWLED_NOT_INDEXED: 0, EXCLUDED: 0, UNKNOWN: 0 };
  const findings = [];

  for (const [url, result] of results) {
    const { severity, label } = classify(result);
    distribution[label] += 1;
    if (label === "INDEXED" || label === "CRAWLED_NOT_INDEXED") continue; // both are real, non-alarming states per Section C — not individually reported as issues here (the crawled-not-indexed population is exactly what items C/F/G/I analyze in depth)

    findings.push(
      makeFinding({
        agentId,
        kind: "issue",
        severity,
        title: `${label}: ${url.replace(SITE_URL, "")}`,
        description: `Google Search Console's real URL Inspection API reports verdict="${result.verdict}", coverageState="${result.coverageState}", indexingState="${result.indexingState}" for this URL.`,
        location: url.replace(SITE_URL, ""),
        evidence: [`verdict=${result.verdict}`, `coverageState=${result.coverageState ?? "n/a"}`, `lastCrawlTime=${result.lastCrawlTime ?? "never"}`],
        confidence: 1,
        riskLevel: 0,
        recommendedAction: label === "EXCLUDED" ? "Investigate why Google excluded this URL — check Search Console's own coverage report for the specific reason." : "Not yet inspected/crawled by Google, or an unrecognized state — re-check in a future run rather than resubmitting.",
        dedupeKey: `${agentId}:${url}`,
      })
    );
  }

  return {
    summary: `Inspected ${results.size} sampled URLs (${cachedCount} cached, ${freshCount} freshly inspected). Distribution: ${JSON.stringify(distribution)}. ${findings.length} excluded/unknown finding(s) — indexed and crawled-not-indexed states are not treated as failures (see items C/F/G/I for in-depth analysis of the crawled-not-indexed population).`,
    findings,
  };
};
