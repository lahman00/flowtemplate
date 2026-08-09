import { makeFinding } from "@/lib/agents/finding";
import type { Finding, FindingKind, RiskLevel, Severity } from "@/types/agents";

/**
 * The indexation-analysis workflow's own discipline, made structural
 * rather than just a writing convention: "Do not assume causation. Every
 * recommendation should distinguish: OBSERVATION, HYPOTHESIS, EVIDENCE,
 * CONFIDENCE, PROPOSED TEST." A correlation between two groups (e.g.
 * "indexed pages have more inbound links than non-indexed ones") is an
 * OBSERVATION; "weak internal linking may be contributing to non-
 * indexing" is a HYPOTHESIS drawn from it — never asserted as the cause.
 *
 * Deliberately NOT a change to the core `Finding` type (which stays
 * generic for every other agent in the system) — this formats the five
 * sections into `Finding.description` as clearly labeled text, so any
 * consumer (CLI, dashboard, markdown report) that already knows how to
 * render a Finding renders this correctly with zero changes, while a
 * reader can still tell exactly which sentence is a measured fact and
 * which is a guess.
 */
export function makeEvidenceGradedFinding(input: {
  agentId: string;
  kind: FindingKind;
  severity: Severity;
  title: string;
  observation: string;
  hypothesis: string;
  evidence: string[];
  /** 0-1, distinct from Finding.confidence — this is confidence in the HYPOTHESIS specifically, not in the observation (the observation is a measured fact, effectively confidence 1, by construction). */
  hypothesisConfidence: number;
  proposedTest: string;
  location?: string | null;
  riskLevel: RiskLevel;
  requiresApproval?: boolean;
  artifactsReferenced?: string[];
  dedupeKey: string;
  idSuffix?: string;
}): Finding {
  const description = [
    `OBSERVATION: ${input.observation}`,
    `HYPOTHESIS: ${input.hypothesis}`,
    `CONFIDENCE: ${(input.hypothesisConfidence * 100).toFixed(0)}% — this is a hypothesis, not a confirmed cause.`,
    `PROPOSED TEST: ${input.proposedTest}`,
  ].join("\n");

  return makeFinding({
    agentId: input.agentId,
    kind: input.kind,
    severity: input.severity,
    title: input.title,
    description,
    location: input.location ?? null,
    evidence: input.evidence,
    confidence: input.hypothesisConfidence,
    recommendedAction: input.proposedTest,
    riskLevel: input.riskLevel,
    requiresApproval: input.requiresApproval,
    artifactsReferenced: input.artifactsReferenced,
    dedupeKey: input.dedupeKey,
    idSuffix: input.idSuffix,
  });
}
