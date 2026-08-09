import { getAllSoftware } from "@/data/software";
import { getAllCategories } from "@/data/categories";
import { PUBLISHED_COMPARISONS, getComparisonSlug } from "@/data/comparisons";
import { SITE_URL } from "@/lib/site";
import { GoogleSearchConsoleClient, type UrlInspectionResult } from "@/scripts/agents/seo/lib/google-search-console-client";
import { makeFinding } from "@/lib/agents/finding";
import type { AgentRunFn } from "@/types/agents";

/**
 * "Index/search visibility" — real Search Console URL Inspection data per
 * sampled URL. This is the ONE piece genuinely blocked on a credential
 * this environment doesn't have (scripts/agents/seo/lib/google-search-console-client.ts
 * and google-service-account-auth.ts are fully implemented and unit-tested
 * — see tests/agents/google-search-console.test.ts — the code is real and
 * ready; it just has nothing to authenticate with here). Registered with
 * `enabled: false, run: null` in lib/agents/registry.ts until a real
 * Google Cloud service-account credential is configured — see
 * docs/agents-architecture.md "Turning on a blocked agent."
 *
 * Section C of the brief is explicit that DISCOVERED / CRAWLED /
 * INDEXABLE / INDEXED / GETTING IMPRESSIONS / GETTING CLICKS / RANKING
 * are different states, and "not indexed yet" isn't automatically a
 * technical failure. This agent reports Google's own real verdict/
 * coverageState/indexingState per URL rather than inferring anything from
 * sitemap presence — the correct way to answer that question is to ask
 * Google, not to guess.
 *
 * Required env vars once a credential exists:
 *   GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT — service account JSON (raw or base64)
 *   GOOGLE_SEARCH_CONSOLE_PROPERTY — exact GSC property, e.g.
 *     "https://miloosh.com/" (URL-prefix) or "sc-domain:miloosh.com" (domain)
 * The service account must be added as a user (read access is enough) on
 * that property in Search Console's own "Users and permissions" screen —
 * an owner-side step no code change can substitute for.
 */

const SAMPLE_SIZE = 25;

function buildSampleUrls(): string[] {
  const software = getAllSoftware();
  const categories = getAllCategories();
  const staticPaths = ["/", "/about", "/recommend", "/compare"];
  const categoryPaths = categories.map((c) => `/category/${c.slug}`);
  const softwareSample = software.slice(0, Math.max(0, SAMPLE_SIZE - staticPaths.length - categoryPaths.length)).map((s) => `/software/${s.slug}`);
  const comparisonSample = [...PUBLISHED_COMPARISONS].slice(0, 5).map(([a, b]) => `/compare/${getComparisonSlug(a, b)}`);
  return [...staticPaths, ...categoryPaths, ...softwareSample, ...comparisonSample].map((p) => `${SITE_URL}${p}`);
}

function classify(result: UrlInspectionResult): { severity: "critical" | "warning" | "info"; label: string } {
  if (result.verdict === "PASS" && result.coverageState?.toLowerCase().includes("indexed")) {
    return { severity: "info", label: "INDEXED" };
  }
  if (result.verdict === "FAIL") {
    return { severity: "critical", label: "EXCLUDED (Google inspected and rejected it)" };
  }
  if (result.verdict === "NEUTRAL" || result.verdict === "PARTIAL") {
    return { severity: "warning", label: "CRAWLED but not confirmed indexed" };
  }
  return { severity: "warning", label: "UNKNOWN — not yet inspected/crawled by Google" };
}

export const run: AgentRunFn = async () => {
  const agentId = "seo-search-console-signals";
  const client = GoogleSearchConsoleClient.fromEnv();
  if (!client) {
    throw new Error("GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT / GOOGLE_SEARCH_CONSOLE_PROPERTY not configured — this agent must not run without real credentials.");
  }

  const urls = buildSampleUrls();
  const findings = [];
  for (const url of urls) {
    const result = await client.inspectUrl(url);
    const { severity, label } = classify(result);
    if (severity === "info") continue;

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
        recommendedAction: severity === "critical" ? "Investigate why Google excluded this URL — check Search Console's own coverage report for the specific reason." : "Not necessarily a problem — Google hasn't confirmed indexing yet; re-check in a few days rather than resubmitting repeatedly.",
        dedupeKey: `${agentId}:${url}`,
      })
    );
  }

  return {
    summary: `Inspected ${urls.length} sampled URLs via the real Search Console URL Inspection API. ${findings.length} not confirmed indexed.`,
    findings,
  };
};
