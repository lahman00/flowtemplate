import type { Software } from "@/data/software";
import type { Explanation, ScoringResult } from "@/lib/recommend/types";

/**
 * Recommend Engine Rebuild (2026-08-21) — Phase 12 of the rebuild brief:
 * every recommendation must explain WHY IT MATCHED and WHAT TRADEOFF TO
 * KNOW, built from the actual scored factors, never a vague "great
 * choice with powerful features." This is pure text assembly over
 * ScoringResult.factors, which are themselves already grounded in real
 * fields (see scoring.ts) — this file invents no new facts, it just
 * turns the factor list into two readable sentences.
 */

function joinNatural(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0]!;
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function buildExplanation(software: Software, scoring: ScoringResult): Explanation {
  const positives = scoring.factors.filter((f) => f.direction === "positive");
  const negatives = scoring.factors.filter((f) => f.direction === "negative");

  let whyItMatched: string;
  if (positives.length === 0) {
    whyItMatched = `No strong positive signal from your answers — ${software.name} was simply the closest match available among eligible products.`;
  } else {
    // Lead with the two highest-weight positives (already sorted desc by
    // scoring.ts) — enough to be concrete without reading like a dump of
    // every factor.
    const lead = positives.slice(0, 2).map((f) => f.label.charAt(0).toLowerCase() + f.label.slice(1));
    whyItMatched = `Best fit because ${joinNatural(lead)} — ${software.name} has real, checked evidence for ${positives.length === 1 ? "that" : "those"}.`;
  }

  const tradeoff = negatives.length > 0 ? `${negatives[0]!.label} — ${negatives[0]!.explanation}` : null;

  return { whyItMatched, tradeoff };
}
