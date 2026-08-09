import { getAllSoftware } from "@/data/software";
import { getCategoryName } from "@/data/categories";
import { makeFinding } from "@/lib/agents/finding";
import type { AgentRunFn } from "@/types/agents";

/**
 * "Best X for Y" discovery (brief Marketing item 10), scoped to what's
 * actually computable without inventing anything: each product's own
 * `bestFor` field, already real editorial text, is scanned for a fixed
 * list of common persona/use-case keywords. If enough products in the
 * SAME category explicitly serve the same persona, that's a real,
 * data-backed content-format opportunity — not a claim that a page should
 * be built (Miloosh has no /best route today, and building one is out of
 * scope for this task), just a flagged, evidenced opportunity for a human
 * to decide on.
 */

const PERSONA_KEYWORDS = [
  "startup", "startups",
  "small team", "small teams", "small business", "small businesses",
  "enterprise", "enterprises",
  "remote team", "remote teams",
  "freelancer", "freelancers",
  "agency", "agencies",
  "developer", "developers",
  "marketing team", "marketing teams",
  "nonprofit", "nonprofits",
  "solo", "individuals",
];

const MIN_CLUSTER_SIZE = 4;

function findPersonaMatches(bestFor: string): string[] {
  const lower = bestFor.toLowerCase();
  return PERSONA_KEYWORDS.filter((kw) => lower.includes(kw));
}

export const run: AgentRunFn = async () => {
  const agentId = "growth-best-for-persona-opportunity";
  const software = getAllSoftware();

  // key: `${category}::${persona}` -> slugs
  const clusters = new Map<string, string[]>();
  for (const s of software) {
    for (const persona of findPersonaMatches(s.bestFor)) {
      const key = `${s.category}::${persona}`;
      clusters.set(key, [...(clusters.get(key) ?? []), s.slug]);
    }
  }

  const findings = [];
  for (const [key, slugs] of clusters) {
    if (slugs.length < MIN_CLUSTER_SIZE) continue;
    const [category, persona] = key.split("::");
    const categoryName = getCategoryName(category);

    findings.push(
      makeFinding({
        agentId,
        kind: "opportunity",
        severity: "info",
        title: `"Best ${categoryName} for ${persona}" — ${slugs.length} qualifying products`,
        description: `${slugs.length} products already in the "${categoryName}" category explicitly describe themselves (in bestFor) as suited to "${persona}": ${slugs.join(", ")}. A themed roundup or filtered view targeting this persona has real supporting content already written.`,
        location: `/category/${category}`,
        evidence: slugs.map((s) => `/software/${s}`),
        confidence: 0.75,
        riskLevel: 3,
        recommendedAction: `Consider a "Best ${categoryName} for ${persona}" content format — no such route exists yet, so this requires a product decision before any page is built, not just a data change.`,
        dedupeKey: `${agentId}:${key}`,
      })
    );
  }

  return {
    summary: `Scanned bestFor text across ${software.length} products for persona clusters within categories (min ${MIN_CLUSTER_SIZE} products). ${findings.length} finding(s).`,
    findings,
  };
};
