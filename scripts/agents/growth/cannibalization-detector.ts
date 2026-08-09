import { getAllSoftware } from "@/data/software";
import { makeFinding } from "@/lib/agents/finding";
import type { AgentRunFn } from "@/types/agents";

/**
 * A different concern from content-duplicate-description-detector (which
 * catches copy that reads as duplicated/templated). This agent asks a
 * growth question: within the SAME category, do two products target such
 * similar buyer intent (their `bestFor` framing) that they're effectively
 * competing with each other for the same search query rather than serving
 * two distinct use cases? That's a real internal cannibalization risk —
 * splitting ranking signal across two pages instead of concentrating it.
 */

const CANNIBALIZATION_THRESHOLD = 0.6;

function wordSet(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const word of a) if (b.has(word)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export const run: AgentRunFn = async () => {
  const agentId = "growth-cannibalization-detector";
  const byCategory = new Map<string, ReturnType<typeof getAllSoftware>>();
  for (const s of getAllSoftware()) {
    byCategory.set(s.category, [...(byCategory.get(s.category) ?? []), s]);
  }

  const findings = [];
  for (const [category, entries] of byCategory) {
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const a = entries[i];
        const b = entries[j];
        const similarity = jaccard(wordSet(a.bestFor), wordSet(b.bestFor));
        if (similarity < CANNIBALIZATION_THRESHOLD) continue;

        findings.push(
          makeFinding({
            agentId,
            kind: "opportunity",
            severity: "info",
            title: `Possible intent overlap: ${a.name} / ${b.name} (${category})`,
            description: `Both are in the "${category}" category and their "best for" framing overlaps ${(similarity * 100).toFixed(0)}% ("${a.bestFor}" vs "${b.bestFor}"). If these two pages target the same search intent, they may split ranking signal instead of each owning a distinct angle.`,
            location: `/software/${a.slug}, /software/${b.slug}`,
            evidence: [`bestFor word-overlap: ${(similarity * 100).toFixed(1)}%`, `Shared category: ${category}`],
            confidence: 0.6,
            riskLevel: 2,
            recommendedAction: "Review whether these two products' framing should be differentiated, or whether a single comparison page (if not already published) better serves this overlap than two competing standalone pages.",
            dedupeKey: `${agentId}:${[a.slug, b.slug].sort().join(",")}`,
          })
        );
      }
    }
  }

  return {
    summary: `Compared bestFor framing within ${byCategory.size} categories for same-category intent overlap (≥${CANNIBALIZATION_THRESHOLD * 100}%). ${findings.length} finding(s).`,
    findings,
  };
};
