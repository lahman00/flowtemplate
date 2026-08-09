import type { Finding, FindingKind, RiskLevel, Severity } from "@/types/agents";

/**
 * Constructs a Finding with sensible defaults so individual agents don't
 * repeat boilerplate. `estimatedImpact` is deliberately left null here —
 * the orchestrator (lib/agents/orchestrator.ts) fills it in centrally via
 * lib/agents/scoring.ts after dedup, so every finding is scored by the
 * same formula regardless of which agent produced it.
 */
export function makeFinding(input: {
  agentId: string;
  kind: FindingKind;
  severity: Severity;
  title: string;
  description: string;
  location?: string | null;
  evidence?: string[];
  confidence: number;
  recommendedAction?: string | null;
  riskLevel: RiskLevel;
  requiresApproval?: boolean;
  artifactsReferenced?: string[];
  dedupeKey: string;
  idSuffix?: string;
}): Finding {
  return {
    id: `${input.agentId}:${input.idSuffix ?? input.dedupeKey}`,
    agentId: input.agentId,
    kind: input.kind,
    severity: input.severity,
    title: input.title,
    description: input.description,
    location: input.location ?? null,
    evidence: input.evidence ?? [],
    confidence: input.confidence,
    recommendedAction: input.recommendedAction ?? null,
    estimatedImpact: null,
    riskLevel: input.riskLevel,
    requiresApproval: input.requiresApproval ?? input.riskLevel >= 2,
    artifactsReferenced: input.artifactsReferenced ?? [],
    dedupeKey: input.dedupeKey,
  };
}
