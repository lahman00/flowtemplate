import type { Finding } from "@/types/agents";

/**
 * Cross-agent finding deduplication (Section G: "Do not allow ten agents to
 * recommend the same title change"). Findings are considered duplicates when
 * they share a `dedupeKey` — each agent constructs that key itself (usually
 * `${agentDomain}:${checkKind}:${location}`), so two agents that both notice
 * "software X is missing a category link" only need to agree on the key
 * shape, not on any central coordination at runtime.
 *
 * Merge rule: keep the highest-confidence finding for a given key; if tied,
 * keep whichever has the higher severity (critical > warning > info > none
 * for "info"/"opportunity" kinds, which don't carry severity urgency the
 * same way). Ties beyond that keep the first-seen finding (stable order).
 */

const SEVERITY_RANK: Record<Finding["severity"], number> = {
  critical: 2,
  warning: 1,
  info: 0,
};

export type DedupeResult = {
  findings: Finding[];
  duplicatesMerged: number;
};

export function dedupeFindings(findings: Finding[]): DedupeResult {
  const bestByKey = new Map<string, Finding>();
  let duplicatesMerged = 0;

  for (const finding of findings) {
    const existing = bestByKey.get(finding.dedupeKey);
    if (!existing) {
      bestByKey.set(finding.dedupeKey, finding);
      continue;
    }

    duplicatesMerged += 1;
    if (shouldReplace(existing, finding)) {
      bestByKey.set(finding.dedupeKey, finding);
    }
  }

  return { findings: Array.from(bestByKey.values()), duplicatesMerged };
}

function shouldReplace(existing: Finding, candidate: Finding): boolean {
  if (candidate.confidence !== existing.confidence) {
    return candidate.confidence > existing.confidence;
  }
  return SEVERITY_RANK[candidate.severity] > SEVERITY_RANK[existing.severity];
}
