/**
 * Analytics Zero-Drop Production Proof Mega Mission (2026-08-21) — Phase 7:
 * formalized reporting classes for "was this event a real/unknown human,
 * synthetic QA, or otherwise excluded" — deliberately never "organic",
 * which is a traffic-SOURCE concept (see lib/analytics/attribution.ts),
 * not a human-authenticity one. A visitor classified REAL_OR_UNKNOWN_HUMAN
 * can be human + direct, human + organic_search, human + social, human +
 * referral, or human + unknown-source — those are two independent
 * dimensions and this file only formalizes the first.
 */

export type HumanClassification =
  /** Passed every check; not marked isTest; not a known legacy-contaminated session. The honest label is "not excluded", not "confirmed organic human" — we cannot positively verify humanity, only the absence of a known reason to exclude it. */
  | "REAL_OR_UNKNOWN_HUMAN"
  /** isTest:true — explicit Miloosh QA traffic, marked via ?qa=1. Stored, excluded from real-human reports by default. */
  | "SYNTHETIC_QA"
  /** A session recorded before the isTest marker existed, investigated, and found unable to be proven organic. See lib/analytics/legacy-contaminated-sessions.ts. */
  | "LEGACY_CONTAMINATED"
  /** Rejected before storage (bot user-agent or Vercel platform/prefetch noise). Never stored, so this classification is only ever visible in server logs, never in stored event data. */
  | "BOT_REJECTED";

export const HUMAN_CLASSIFICATIONS: readonly HumanClassification[] = [
  "REAL_OR_UNKNOWN_HUMAN",
  "SYNTHETIC_QA",
  "LEGACY_CONTAMINATED",
  "BOT_REJECTED",
];
