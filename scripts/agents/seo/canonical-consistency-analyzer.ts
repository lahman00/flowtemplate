import { SITE_URL } from "@/lib/site";
import { GoogleSearchConsoleClient, type UrlInspectionResult } from "@/scripts/agents/seo/lib/google-search-console-client";
import { inspectSampleWithCache } from "@/scripts/agents/seo/lib/inspect-with-cache";
import { buildSampleUrls } from "@/scripts/agents/seo/indexed-vs-nonindexed-comparator";
import { makeFinding } from "@/lib/agents/finding";
import type { AgentRunFn, Finding } from "@/types/agents";

/**
 * Item F of the indexation-analysis workflow: does Google's own
 * `googleCanonical` for a URL agree with our own `userCanonical`
 * (effectively: does the page's <link rel="canonical"> declare itself,
 * which it always should here — Miloosh has no cross-page
 * canonicalization by design, every page canonicalizes to itself)? A
 * mismatch is a real, checkable technical fact — Google choosing a
 * different canonical than the one the page declares is exactly the kind
 * of thing that can suppress indexing independent of content quality.
 * This is a real finding (OBSERVATION-only, no hypothesis needed — a
 * canonical mismatch is a fact, not a correlation), not evidence-graded
 * like the comparator's cross-group findings.
 */

export function analyzeCanonicalConsistency(agentId: string, inspections: Map<string, UrlInspectionResult>): Finding[] {
  const findings: Finding[] = [];
  for (const [url, inspection] of inspections) {
    if (!inspection.googleCanonical && !inspection.userCanonical) continue; // no canonical data returned for this URL — not itself a finding, just missing data

    const expectedSelfCanonical = url;
    const declaredMatchesExpected = !inspection.userCanonical || inspection.userCanonical === expectedSelfCanonical;
    const googleAgreesWithDeclared = !inspection.googleCanonical || !inspection.userCanonical || inspection.googleCanonical === inspection.userCanonical;

    if (!declaredMatchesExpected) {
      findings.push(
        makeFinding({
          agentId,
          kind: "issue",
          severity: "warning",
          title: `Declared canonical doesn't match the page's own URL: ${url.replace(SITE_URL, "")}`,
          description: `Google's URL Inspection reports this page's user-declared canonical as "${inspection.userCanonical}", not its own URL. Every page on this site is expected to canonicalize to itself.`,
          location: url.replace(SITE_URL, ""),
          evidence: [`userCanonical=${inspection.userCanonical}`, `expected=${expectedSelfCanonical}`],
          confidence: 1,
          riskLevel: 1,
          recommendedAction: "Check this route's alternates.canonical metadata — it may be pointing at the wrong URL.",
          dedupeKey: `${agentId}:declared-mismatch:${url}`,
        })
      );
    } else if (!googleAgreesWithDeclared) {
      findings.push(
        makeFinding({
          agentId,
          kind: "regression",
          severity: "warning",
          title: `Google selected a different canonical than declared: ${url.replace(SITE_URL, "")}`,
          description: `This page declares "${inspection.userCanonical}" as its canonical, but Google's own selected canonical (googleCanonical) is "${inspection.googleCanonical}" — a real signal Google may be treating this as duplicate/near-duplicate content of another URL.`,
          location: url.replace(SITE_URL, ""),
          evidence: [`userCanonical=${inspection.userCanonical}`, `googleCanonical=${inspection.googleCanonical}`],
          confidence: 0.9,
          riskLevel: 1,
          recommendedAction: `Investigate why Google prefers "${inspection.googleCanonical}" — check for near-duplicate content between the two URLs (see content-duplicate-description-detector / seo-indexed-vs-nonindexed-comparator's similarity dimension).`,
          dedupeKey: `${agentId}:google-override:${url}`,
        })
      );
    }
  }
  return findings;
}

export const run: AgentRunFn = async () => {
  const agentId = "seo-canonical-consistency-analyzer";
  const client = GoogleSearchConsoleClient.fromEnv();
  if (!client) {
    throw new Error("GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT / GOOGLE_SEARCH_CONSOLE_PROPERTY not configured — this agent must not run without real credentials.");
  }

  const sampleUrls = buildSampleUrls();
  const { results, cachedCount, freshCount } = await inspectSampleWithCache(client, sampleUrls);
  const findings = analyzeCanonicalConsistency(agentId, results);

  return {
    summary: `Checked canonical consistency for ${results.size} URLs (${cachedCount} cached, ${freshCount} freshly inspected). ${findings.length} mismatch(es).`,
    findings,
  };
};
