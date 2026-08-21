/**
 * Recommend Engine Integrity Patch (2026-08-21) — sessions recorded before
 * the isTest synthetic marker existed (see lib/analytics/synthetic.ts),
 * whose provenance was investigated and could not be proven organic.
 *
 * This is NOT a mechanism for silently pruning inconvenient data. Every
 * entry here required a real forensic look at the raw stored events
 * (timestamps, paths, visitor/session IDs — the only fields this
 * codebase's privacy model stores; no user-agent, no IP, see
 * lib/analytics/events.ts's module header) before being added, and the
 * `reason` field is the actual basis for the classification, not a
 * placeholder. Events themselves are never deleted or mutated — Vercel
 * Blob objects for first-party analytics are immutable by design in this
 * codebase (recordFirstPartyEvent always writes a new object, never
 * overwrites one) — this file is an explicit, auditable, non-destructive
 * annotation applied only at report time by scripts/analytics/report.ts.
 *
 * Add an entry here only after a real investigation, same rigor as the
 * one behind the first entry below. Never add one merely because a
 * number looks inconvenient — that would violate the same truth rule
 * this file exists to uphold.
 */

export type LegacyContaminatedSession = {
  sessionId: string;
  visitorId: string;
  classification: "UNKNOWN_POSSIBLE_OPERATOR_QA";
  investigatedAt: string;
  reason: string;
};

export const LEGACY_CONTAMINATED_SESSIONS: readonly LegacyContaminatedSession[] = [
  {
    sessionId: "s_tjvabxoqmt2s7kdu",
    visitorId: "v_ob2uyamdmt2s7kdt",
    classification: "UNKNOWN_POSSIBLE_OPERATOR_QA",
    investigatedAt: "2026-08-21",
    reason:
      "10 events spanning 2026-08-21T10:03:36.219Z to 2026-08-21T10:05:21.661Z (under 2 minutes), " +
      "single visitor+session throughout. Paths limited to /recommend and /recommend/results only " +
      "(2 visits each) — no software/comparison/category/guide page ever visited despite results " +
      "being shown, which is atypical of organic evaluation but is exactly the shape of a scripted " +
      "or manual QA walkthrough of the Recommend feature. Navigation pattern: /recommend -> " +
      "/recommend/results -> /recommend/results (revisited) -> /recommend (returned to) -> done. " +
      "Recorded three hours before the browser-based production QA performed later the same day in " +
      "this same investigation session, so it cannot be that specific QA pass, but the browser tool " +
      "used for that later QA reported connecting to a REUSED tab (not a freshly created one) — " +
      "meaning a browser session of unknown origin (operator, an earlier agent turn, or otherwise) " +
      "was already open against this site before this investigation began, and could plausibly have " +
      "generated this exact traffic. No user-agent is stored per-event in this codebase's privacy " +
      "model, so UA-based confirmation is not possible for this or any historical event — this is an " +
      "architectural limitation being weighed here honestly, not treated as proof either way. " +
      "Provenance could not be proven organic OR operator-QA with the data actually available. Per " +
      "the non-negotiable rule that unproven traffic is never reported as organic, classified " +
      "UNKNOWN_POSSIBLE_OPERATOR_QA and excluded from REAL HUMAN metrics by default.",
  },
];

export function isLegacyContaminatedSession(sessionId: string): boolean {
  return LEGACY_CONTAMINATED_SESSIONS.some((s) => s.sessionId === sessionId);
}
