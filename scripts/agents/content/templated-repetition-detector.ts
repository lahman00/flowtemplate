import { getAllSoftware } from "@/data/software";
import { makeFinding } from "@/lib/agents/finding";
import type { AgentRunFn } from "@/types/agents";

/**
 * Detects exact phrases reused verbatim across many different products in
 * fields meant to be product-specific (`bestFor`, `pros[]`, `cons[]`).
 * Legitimate short overlaps happen ("Free forever plan" as a pro is fine
 * on two or three genuinely free tools) — the signal here is a phrase
 * appearing on enough DIFFERENT products that it reads as templated
 * boilerplate rather than a real, specific claim about each one.
 */

const REPETITION_THRESHOLD = 5; // same exact phrase on 5+ different products
const MIN_PHRASE_LENGTH = 15; // characters — skip trivially short strings

function collectFieldOccurrences(field: "bestFor" | "pros" | "cons"): Map<string, string[]> {
  const occurrences = new Map<string, string[]>();
  for (const s of getAllSoftware()) {
    const values = field === "bestFor" ? [s.bestFor] : (s[field] ?? []);
    for (const raw of values) {
      const value = raw.trim();
      if (value.length < MIN_PHRASE_LENGTH) continue;
      const key = value.toLowerCase();
      const list = occurrences.get(key) ?? [];
      if (!list.includes(s.slug)) list.push(s.slug);
      occurrences.set(key, list);
    }
  }
  return occurrences;
}

export const run: AgentRunFn = async () => {
  const agentId = "content-templated-repetition-detector";
  const findings = [];
  const fields: Array<"bestFor" | "pros" | "cons"> = ["bestFor", "pros", "cons"];

  for (const field of fields) {
    const occurrences = collectFieldOccurrences(field);
    for (const [phrase, slugs] of occurrences) {
      if (slugs.length < REPETITION_THRESHOLD) continue;
      findings.push(
        makeFinding({
          agentId,
          kind: "issue",
          severity: "warning",
          title: `Templated phrase in ${field}: reused on ${slugs.length} products`,
          description: `The exact phrase "${phrase}" appears in ${field} for ${slugs.length} different products (${slugs.slice(0, 8).join(", ")}${slugs.length > 8 ? ", …" : ""}). A phrase this specific-sounding reused this widely reads as templated rather than researched per-product.`,
          location: null,
          evidence: slugs.map((s) => `/software/${s}`),
          confidence: 0.8,
          riskLevel: 1,
          recommendedAction: `Review whether "${phrase}" is genuinely true and specific for each listed product, or replace with product-specific language.`,
          dedupeKey: `${agentId}:${field}:${phrase}`,
        })
      );
    }
  }

  return {
    summary: `Scanned bestFor/pros/cons across the catalog for phrases repeated on ${REPETITION_THRESHOLD}+ different products. ${findings.length} finding(s).`,
    findings,
  };
};
