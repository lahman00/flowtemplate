import { getAllSoftware } from "@/data/software";
import { makeFinding } from "@/lib/agents/finding";
import type { AgentRunFn } from "@/types/agents";

/**
 * scripts/maintenance/seo.ts already catches duplicate <title>/meta
 * description (the generated SEO tags). This agent checks a different
 * field entirely: the raw catalog `description` (data/software/*.json),
 * which is rendered as real body copy on the software page and read by
 * humans, not just search engines. Exact duplicates here would mean two
 * different products literally share a description — a real content bug.
 * Near-duplicates (high word overlap) are a softer "this reads templated"
 * signal.
 */

const NEAR_DUPLICATE_THRESHOLD = 0.75;

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
  const agentId = "content-duplicate-description-detector";
  const software = getAllSoftware();
  const findings = [];

  const exactByDescription = new Map<string, string[]>();
  for (const s of software) {
    const key = s.description.trim().toLowerCase();
    exactByDescription.set(key, [...(exactByDescription.get(key) ?? []), s.slug]);
  }
  for (const [description, slugs] of exactByDescription) {
    if (slugs.length < 2) continue;
    findings.push(
      makeFinding({
        agentId,
        kind: "issue",
        severity: "critical",
        title: `Exact duplicate description across ${slugs.length} products`,
        description: `These products share the literal same catalog description: ${slugs.join(", ")}. "${description.slice(0, 120)}${description.length > 120 ? "…" : ""}"`,
        location: slugs.map((s) => `/software/${s}`).join(", "),
        evidence: slugs.map((s) => `/software/${s}`),
        confidence: 1,
        riskLevel: 1,
        recommendedAction: "Write distinct, product-specific descriptions for each — duplicate body copy reads as low-effort to both visitors and search engines.",
        dedupeKey: `${agentId}:exact:${[...slugs].sort().join(",")}`,
      })
    );
  }

  const wordSets = software.map((s) => ({ slug: s.slug, words: wordSet(s.description) }));
  const seen = new Set<string>();
  for (let i = 0; i < wordSets.length; i++) {
    for (let j = i + 1; j < wordSets.length; j++) {
      const a = wordSets[i];
      const b = wordSets[j];
      const pairKey = [a.slug, b.slug].sort().join(",");
      if (seen.has(pairKey)) continue;
      const similarity = jaccard(a.words, b.words);
      if (similarity < NEAR_DUPLICATE_THRESHOLD) continue;
      seen.add(pairKey);
      findings.push(
        makeFinding({
          agentId,
          kind: "issue",
          severity: "warning",
          title: `Near-duplicate description: ${a.slug} / ${b.slug}`,
          description: `Word-overlap similarity ${(similarity * 100).toFixed(0)}% between ${a.slug} and ${b.slug}'s descriptions (threshold ${NEAR_DUPLICATE_THRESHOLD * 100}%). Not necessarily wrong — similar products can have similar descriptions — but worth a human glance.`,
          location: `/software/${a.slug}, /software/${b.slug}`,
          evidence: [`Jaccard word-overlap: ${(similarity * 100).toFixed(1)}%`],
          confidence: 0.7,
          riskLevel: 1,
          recommendedAction: "Review both descriptions — differentiate if they read as interchangeable.",
          dedupeKey: `${agentId}:near:${pairKey}`,
        })
      );
    }
  }

  return {
    summary: `Checked ${software.length} descriptions for exact and near-duplicates (≥${NEAR_DUPLICATE_THRESHOLD * 100}% word overlap). ${findings.length} finding(s).`,
    findings,
  };
};
