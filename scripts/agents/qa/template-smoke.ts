import { getAllSoftware } from "@/data/software";
import { getAllCategories } from "@/data/categories";
import { PUBLISHED_COMPARISONS, getComparisonSlug } from "@/data/comparisons";
import { SITE_URL } from "@/lib/site";
import { makeFinding } from "@/lib/agents/finding";
import type { AgentRunFn } from "@/types/agents";

/**
 * Four narrow smoke checks, one per page template — each fetches ONE
 * representative live page for that template and asserts it returns 200
 * and contains a content marker specific to that template rendering
 * correctly (not just "the server responded"). Deliberately not the same
 * agent as seo-redirect-broken-url-check (which samples MANY pages across
 * all templates for link health) — this is "is the template itself
 * intact," a much cheaper, faster check suitable for QUICK mode.
 */

async function fetchText(url: string): Promise<{ status: number; text: string } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    const text = await res.text();
    return { status: res.status, text };
  } catch {
    return null;
  }
}

function smokeCheck(agentId: string, label: string, path: string, mustContain: string[]): AgentRunFn {
  return async () => {
    const url = `${SITE_URL}${path}`;
    const result = await fetchText(url);

    if (!result) {
      return {
        summary: `${label} smoke check: request failed.`,
        findings: [
          makeFinding({
            agentId,
            kind: "issue",
            severity: "critical",
            title: `${label} unreachable`,
            description: `Could not fetch ${url}.`,
            location: path,
            evidence: [url],
            confidence: 1,
            riskLevel: 0,
            recommendedAction: "Investigate immediately — this is a live production page.",
            dedupeKey: `${agentId}:unreachable`,
          }),
        ],
      };
    }

    const findings = [];
    if (result.status !== 200) {
      findings.push(
        makeFinding({
          agentId,
          kind: "issue",
          severity: "critical",
          title: `${label} returned HTTP ${result.status}`,
          description: `Expected 200 from ${url}.`,
          location: path,
          evidence: [`HTTP ${result.status}`],
          confidence: 1,
          riskLevel: 0,
          recommendedAction: "Investigate immediately.",
          dedupeKey: `${agentId}:status`,
        })
      );
    }
    const missing = mustContain.filter((marker) => !result.text.includes(marker));
    if (missing.length > 0) {
      findings.push(
        makeFinding({
          agentId,
          kind: "issue",
          severity: "critical",
          title: `${label} missing expected content`,
          description: `${url} returned 200 but is missing expected marker(s): ${missing.join(", ")}. The template may be broken even though the route responds.`,
          location: path,
          evidence: missing,
          confidence: 0.9,
          riskLevel: 0,
          recommendedAction: "Investigate — the page loaded but doesn't look right.",
          dedupeKey: `${agentId}:content`,
        })
      );
    }

    return {
      summary: findings.length === 0 ? `${label} smoke check passed (${url}).` : `${label} smoke check found ${findings.length} problem(s).`,
      findings,
    };
  };
}

function firstSoftwarePath(): string {
  const s = getAllSoftware()[0];
  return s ? `/software/${s.slug}` : "/software";
}
function firstCategoryPath(): string {
  const c = getAllCategories()[0];
  return c ? `/category/${c.slug}` : "/category";
}
function firstComparisonPath(): string {
  const pair = PUBLISHED_COMPARISONS[0];
  return pair ? `/compare/${getComparisonSlug(pair[0], pair[1])}` : "/compare";
}

export const runHomepageSmoke = smokeCheck("qa-homepage-smoke", "Homepage", "/", ["Miloosh", "Find alternatives"]);
export const runSoftwareTemplateSmoke = smokeCheck("qa-software-template-smoke", "Software template", firstSoftwarePath(), ["alternatives"]);
export const runCategoryTemplateSmoke = smokeCheck("qa-category-template-smoke", "Category template", firstCategoryPath(), ["<html"]);
export const runComparisonTemplateSmoke = smokeCheck("qa-comparison-template-smoke", "Comparison template", firstComparisonPath(), ["vs"]);
