import { SITE_URL } from "@/lib/site";
import { GoogleSearchConsoleClient, type UrlInspectionResult } from "@/scripts/agents/seo/lib/google-search-console-client";
import { inspectSampleWithCache } from "@/scripts/agents/seo/lib/inspect-with-cache";
import { buildSampleUrls } from "@/scripts/agents/seo/indexed-vs-nonindexed-comparator";
import { makeFinding } from "@/lib/agents/finding";
import type { AgentRunFn, Finding } from "@/types/agents";

/**
 * Item G of the indexation-analysis workflow: among crawled-but-not-
 * indexed pages specifically, which ones haven't been (re-)crawled
 * recently? A stale lastCrawlTime on a non-indexed page is a real,
 * checkable fact — it doesn't prove why the page isn't indexed, but it
 * does mean Google hasn't looked at it again since whatever state it was
 * in at that crawl, so any content change since then hasn't been seen.
 * `robotsTxtState`/`pageFetchState` are reported as evidence alongside
 * crawl age, not treated as separate findings — a page Google was
 * BLOCKED or FAILED to fetch is a materially different, more urgent
 * situation than one it simply hasn't revisited in a while.
 */

const STALE_CRAWL_DAYS = 30;

export function analyzeCrawlRecency(agentId: string, inspections: Map<string, UrlInspectionResult>, now = new Date()): Finding[] {
  const findings: Finding[] = [];

  for (const [url, inspection] of inspections) {
    const isCrawledNotIndexed = inspection.coverageState?.toLowerCase().includes("crawled") && inspection.coverageState?.toLowerCase().includes("not indexed");
    if (!isCrawledNotIndexed) continue;

    if (inspection.robotsTxtState && inspection.robotsTxtState !== "ALLOWED") {
      findings.push(
        makeFinding({
          agentId,
          kind: "issue",
          severity: "critical",
          title: `robots.txt blocks a crawled page: ${url.replace(SITE_URL, "")}`,
          description: `Google reports robotsTxtState="${inspection.robotsTxtState}" for a page it has crawled but not indexed — this is a direct, checkable technical blocker, not a content-quality question.`,
          location: url.replace(SITE_URL, ""),
          evidence: [`robotsTxtState=${inspection.robotsTxtState}`],
          confidence: 1,
          riskLevel: 1,
          recommendedAction: "Check app/robots.ts and this route's own robots metadata — this should not be blocked.",
          dedupeKey: `${agentId}:robots-blocked:${url}`,
        })
      );
      continue; // a robots block is the whole story for this URL; crawl age is not the next-most-relevant fact
    }

    if (inspection.pageFetchState && inspection.pageFetchState !== "SUCCESSFUL") {
      findings.push(
        makeFinding({
          agentId,
          kind: "issue",
          severity: "critical",
          title: `Google could not successfully fetch a crawled page: ${url.replace(SITE_URL, "")}`,
          description: `pageFetchState="${inspection.pageFetchState}" — Google's crawler did not get a clean fetch of this URL.`,
          location: url.replace(SITE_URL, ""),
          evidence: [`pageFetchState=${inspection.pageFetchState}`],
          confidence: 1,
          riskLevel: 1,
          recommendedAction: "Fetch this exact URL yourself and check for a real error (5xx, timeout, unusual response) — this is a technical fact, not a content question.",
          dedupeKey: `${agentId}:fetch-failed:${url}`,
        })
      );
      continue;
    }

    if (!inspection.lastCrawlTime) {
      findings.push(
        makeFinding({
          agentId,
          kind: "issue",
          severity: "info",
          title: `No recorded crawl time for a crawled-not-indexed page: ${url.replace(SITE_URL, "")}`,
          description: `Google's coverageState says this page was crawled, but no lastCrawlTime was returned — possibly a very early or edge-case crawl record.`,
          location: url.replace(SITE_URL, ""),
          evidence: [`coverageState=${inspection.coverageState}`, "lastCrawlTime=null"],
          confidence: 0.6,
          riskLevel: 1,
          recommendedAction: "Re-check this URL's inspection result in a future run — a missing timestamp with an otherwise-normal crawled state is unusual but not necessarily actionable on its own.",
          dedupeKey: `${agentId}:no-crawl-time:${url}`,
        })
      );
      continue;
    }

    const ageDays = (now.getTime() - new Date(inspection.lastCrawlTime).getTime()) / (24 * 60 * 60 * 1000);
    if (ageDays > STALE_CRAWL_DAYS) {
      findings.push(
        makeFinding({
          agentId,
          kind: "issue",
          severity: "info",
          title: `Stale crawl on a non-indexed page: ${url.replace(SITE_URL, "")} (${Math.round(ageDays)}d ago)`,
          description: `This crawled-but-not-indexed page was last crawled ${Math.round(ageDays)} days ago (>${STALE_CRAWL_DAYS}-day threshold) — any content changes since then haven't been seen by Google yet.`,
          location: url.replace(SITE_URL, ""),
          evidence: [`lastCrawlTime=${inspection.lastCrawlTime}`, `ageDays=${Math.round(ageDays)}`],
          confidence: 0.8,
          riskLevel: 1,
          recommendedAction: "If this page's content has meaningfully changed since the last crawl, submitting it via seo-indexnow-submit (already live) is a legitimate, low-effort nudge — do not mass-resubmit unchanged pages.",
          dedupeKey: `${agentId}:stale:${url}`,
        })
      );
    }
  }

  return findings;
}

export const run: AgentRunFn = async () => {
  const agentId = "seo-crawl-recency-analyzer";
  const client = GoogleSearchConsoleClient.fromEnv();
  if (!client) {
    throw new Error("GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT / GOOGLE_SEARCH_CONSOLE_PROPERTY not configured — this agent must not run without real credentials.");
  }

  const sampleUrls = buildSampleUrls();
  const { results, cachedCount, freshCount } = await inspectSampleWithCache(client, sampleUrls);
  const findings = analyzeCrawlRecency(agentId, results);

  return {
    summary: `Checked crawl recency/fetch/robots state for ${results.size} URLs (${cachedCount} cached, ${freshCount} freshly inspected). ${findings.length} finding(s).`,
    findings,
  };
};
