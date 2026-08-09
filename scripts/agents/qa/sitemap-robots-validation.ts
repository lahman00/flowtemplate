import { getAllSoftware } from "@/data/software";
import { getAllCategories } from "@/data/categories";
import { PUBLISHED_COMPARISONS } from "@/data/comparisons";
import { SITE_URL } from "@/lib/site";
import { makeFinding } from "@/lib/agents/finding";
import type { AgentRunFn } from "@/types/agents";

/**
 * maint-seo already validates app/sitemap.ts and app/robots.ts by calling
 * those functions DIRECTLY — a codebase-correctness check. This agent
 * checks something maint-seo structurally cannot: what the LIVE, deployed
 * /sitemap.xml and /robots.txt actually return over HTTP, which can
 * legitimately drift from the code (a stale deployment, an edge-cache
 * issue, a CDN misconfiguration) even when the code itself is correct.
 */

const EXPECTED_MIN_URL_COUNT_FACTOR = 0.95; // allow tiny drift without false-alarming

export const runSitemapLiveValidation: AgentRunFn = async () => {
  const agentId = "qa-sitemap-live-validation";
  const expectedCount = getAllSoftware().length + getAllCategories().length + PUBLISHED_COMPARISONS.length;

  try {
    const res = await fetch(`${SITE_URL}/sitemap.xml`, { signal: AbortSignal.timeout(10_000) });
    const text = await res.text();
    const urlCount = (text.match(/<loc>/g) ?? []).length;

    const findings = [];
    if (res.status !== 200) {
      findings.push(
        makeFinding({
          agentId,
          kind: "issue",
          severity: "critical",
          title: `Live sitemap.xml returned HTTP ${res.status}`,
          description: `${SITE_URL}/sitemap.xml did not return 200.`,
          location: "/sitemap.xml",
          evidence: [`HTTP ${res.status}`],
          confidence: 1,
          riskLevel: 0,
          recommendedAction: "Investigate immediately.",
          dedupeKey: `${agentId}:status`,
        })
      );
    } else if (urlCount < expectedCount * EXPECTED_MIN_URL_COUNT_FACTOR) {
      findings.push(
        makeFinding({
          agentId,
          kind: "issue",
          severity: "critical",
          title: `Live sitemap has fewer URLs than expected`,
          description: `Live /sitemap.xml has ${urlCount} <loc> entries; the current dataset implies at least ~${Math.floor(expectedCount * EXPECTED_MIN_URL_COUNT_FACTOR)}. This may mean the deployed sitemap is stale relative to the current dataset.`,
          location: "/sitemap.xml",
          evidence: [`Live count: ${urlCount}`, `Expected (from current dataset): ~${expectedCount}`],
          confidence: 0.8,
          riskLevel: 0,
          recommendedAction: "Check whether the deployed build matches the current data/ contents.",
          dedupeKey: `${agentId}:count`,
        })
      );
    }

    return {
      summary: findings.length === 0 ? `Live sitemap.xml OK (${urlCount} URLs).` : `Live sitemap.xml check found ${findings.length} problem(s).`,
      findings,
    };
  } catch (err) {
    return {
      summary: "Could not fetch live sitemap.xml.",
      findings: [
        makeFinding({
          agentId,
          kind: "issue",
          severity: "critical",
          title: "Live sitemap.xml unreachable",
          description: `Fetch failed: ${err instanceof Error ? err.message : String(err)}`,
          location: "/sitemap.xml",
          evidence: [String(err)],
          confidence: 1,
          riskLevel: 0,
          recommendedAction: "Investigate immediately.",
          dedupeKey: `${agentId}:unreachable`,
        }),
      ],
    };
  }
};

export const runRobotsLiveValidation: AgentRunFn = async () => {
  const agentId = "qa-robots-live-validation";
  try {
    const res = await fetch(`${SITE_URL}/robots.txt`, { signal: AbortSignal.timeout(10_000) });
    const text = await res.text();

    const findings = [];
    if (res.status !== 200) {
      findings.push(
        makeFinding({
          agentId,
          kind: "issue",
          severity: "critical",
          title: `Live robots.txt returned HTTP ${res.status}`,
          description: `${SITE_URL}/robots.txt did not return 200.`,
          location: "/robots.txt",
          evidence: [`HTTP ${res.status}`],
          confidence: 1,
          riskLevel: 0,
          recommendedAction: "Investigate immediately.",
          dedupeKey: `${agentId}:status`,
        })
      );
    } else {
      if (!text.includes("/internal/")) {
        findings.push(
          makeFinding({
            agentId,
            kind: "issue",
            severity: "critical",
            title: "Live robots.txt does not disallow /internal/",
            description: "The deployed robots.txt is missing the /internal/ disallow rule that protects the maintenance/growth dashboards from being crawled/indexed.",
            location: "/robots.txt",
            evidence: [text.slice(0, 300)],
            confidence: 1,
            riskLevel: 0,
            recommendedAction: "Investigate immediately — this is a real exposure risk.",
            dedupeKey: `${agentId}:disallow`,
          })
        );
      }
      if (!text.includes("sitemap.xml")) {
        findings.push(
          makeFinding({
            agentId,
            kind: "issue",
            severity: "warning",
            title: "Live robots.txt missing sitemap reference",
            description: "The deployed robots.txt doesn't reference /sitemap.xml.",
            location: "/robots.txt",
            evidence: [text.slice(0, 300)],
            confidence: 1,
            riskLevel: 0,
            recommendedAction: "Investigate.",
            dedupeKey: `${agentId}:sitemap-ref`,
          })
        );
      }
    }

    return {
      summary: findings.length === 0 ? "Live robots.txt OK." : `Live robots.txt check found ${findings.length} problem(s).`,
      findings,
    };
  } catch (err) {
    return {
      summary: "Could not fetch live robots.txt.",
      findings: [
        makeFinding({
          agentId,
          kind: "issue",
          severity: "critical",
          title: "Live robots.txt unreachable",
          description: `Fetch failed: ${err instanceof Error ? err.message : String(err)}`,
          location: "/robots.txt",
          evidence: [String(err)],
          confidence: 1,
          riskLevel: 0,
          recommendedAction: "Investigate immediately.",
          dedupeKey: `${agentId}:unreachable`,
        }),
      ],
    };
  }
};
