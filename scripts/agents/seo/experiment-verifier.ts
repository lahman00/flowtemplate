import { SITE_URL } from "@/lib/site";
import { GoogleSearchConsoleClient } from "@/scripts/agents/seo/lib/google-search-console-client";
import { candidatesReadyForVerification, recordVerificationOutcome } from "@/lib/agents/experiment-tracker";
import { makeFinding } from "@/lib/agents/finding";
import type { AgentRunFn, Finding } from "@/types/agents";

/**
 * Item J: closes the loop item I opens. A candidate selected by
 * seo-priority-candidate-selector becomes eligible for re-checking after
 * MIN_EXPERIMENT_AGE_DAYS — long enough for a real crawl/recrawl cycle to
 * plausibly have happened, short enough to still be useful. Reports a
 * plain fact (did the verdict/coverageState change since selection),
 * never a causal claim — even if it changed, this alone doesn't prove
 * whatever change was made caused it (Google's own crawl schedule moves
 * independently). Directly implements "track whether indexing changes
 * later" (brief Section 8) as a real, running mechanism, not a one-off.
 */

const MIN_EXPERIMENT_AGE_DAYS = 14;
const MIN_EXPERIMENT_AGE_MS = MIN_EXPERIMENT_AGE_DAYS * 24 * 60 * 60 * 1000;

export const run: AgentRunFn = async () => {
  const agentId = "seo-experiment-verifier";
  const client = GoogleSearchConsoleClient.fromEnv();
  if (!client) {
    throw new Error("GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT / GOOGLE_SEARCH_CONSOLE_PROPERTY not configured — this agent must not run without real credentials.");
  }

  const ready = candidatesReadyForVerification(MIN_EXPERIMENT_AGE_MS);
  if (ready.length === 0) {
    return { summary: "No experiment candidates are old enough to verify yet (need >=14 days since selection).", findings: [] };
  }

  const findings: Finding[] = [];
  for (const candidate of ready) {
    const result = await client.inspectUrl(candidate.url);
    recordVerificationOutcome(candidate.url, result.verdict, result.coverageState);

    const changed = candidate.baselineCoverageState !== result.coverageState || candidate.baselineVerdict !== result.verdict;
    findings.push(
      makeFinding({
        agentId,
        kind: changed ? "regression" : "info",
        severity: "info",
        title: `${changed ? "Indexing state changed" : "No change yet"}: ${candidate.url.replace(SITE_URL, "")}`,
        description: `Selected ${candidate.selectedAt} for: ${candidate.reasons.join("; ")}. Baseline was verdict="${candidate.baselineVerdict}" coverageState="${candidate.baselineCoverageState}"; now verdict="${result.verdict}" coverageState="${result.coverageState}". ${changed ? "A real change occurred, but this does not by itself prove the experiment caused it — Google's own crawl schedule moves independently of any change made here." : "No change observed yet — this does not prove the experiment failed; indexing decisions can take longer than one verification window."}`,
        location: candidate.url.replace(SITE_URL, ""),
        evidence: [`baseline: ${candidate.baselineVerdict} / ${candidate.baselineCoverageState}`, `current: ${result.verdict} / ${result.coverageState}`],
        confidence: 1, // the observation itself (did the state change) is a measured fact
        riskLevel: 0,
        recommendedAction: changed ? "Review whether the change is consistent with the experiment's hypothesis, and note the outcome for future prioritization." : "Leave as-is; re-evaluate whether this candidate is still worth pursuing in a future full-mode run.",
        dedupeKey: `${agentId}:${candidate.url}:${candidate.selectedAt}`,
      })
    );
  }

  return {
    summary: `Verified ${ready.length} experiment candidate(s) that had reached the ${MIN_EXPERIMENT_AGE_DAYS}-day minimum age. ${findings.filter((f) => f.kind === "regression").length} showed a state change.`,
    findings,
  };
};
