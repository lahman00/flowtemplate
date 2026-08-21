/**
 * Sprint 10 — centralized keyword dictionaries the scoring engine
 * (lib/recommend/scoring.ts) uses to search real stored text
 * (`features`, `description`, `bestFor`) for a signal. Kept in one file
 * so every heuristic used to justify a score is auditable in one place —
 * "no black box" per Phase 2.
 *
 * These are text-match heuristics, not verified capability flags: a
 * product that doesn't use one of these words isn't confirmed to lack the
 * trait, it just contributes no evidence either way. Every place these
 * are used, the resulting ScoreFactor explanation says "based on stored
 * feature/description text," not "confirmed," to keep that distinction
 * honest in the UI too.
 */

import type { TeamSize, CompanyStage, DifficultyPreference } from "@/lib/recommend/types";

export const AI_KEYWORDS = ["\\bai\\b", "artificial intelligence", "machine learning"];

const TEAM_SIZE_KEYWORDS: Record<Exclude<TeamSize, "unspecified">, string[]> = {
  solo: ["solo", "freelancer", "individual"],
  small: ["small team", "small business"],
  medium: ["growing team", "mid-size", "mid-market"],
  large: ["enterprise", "large team", "large organization"],
};

/** Vendors that explicitly claim to fit every team size, e.g. "teams of any size." */
export const ANY_SIZE_KEYWORDS = ["any size", "all sizes", "teams of any size"];

export function getTeamSizeKeywords(size: Exclude<TeamSize, "unspecified">): string[] {
  return TEAM_SIZE_KEYWORDS[size];
}

const COMPANY_STAGE_KEYWORDS: Record<Exclude<CompanyStage, "unspecified">, string[]> = {
  startup: ["startup", "early-stage", "small business"],
  growth: ["growing", "scaling", "mid-market"],
  enterprise: ["enterprise", "large organization"],
};

export function getCompanyStageKeywords(stage: Exclude<CompanyStage, "unspecified">): string[] {
  return COMPANY_STAGE_KEYWORDS[stage];
}

export const DIFFICULTY_KEYWORDS: Record<Exclude<DifficultyPreference, "no-preference">, string[]> = {
  simple: ["simple", "easy to use", "intuitive", "easy-to-use"],
  powerful: ["powerful", "advanced", "enterprise-grade", "robust"],
};

/** True if `haystack` contains any of the given patterns (case-insensitive, `\b` supported). */
export function matchesAny(haystack: string, patterns: readonly string[]): boolean {
  const lower = haystack.toLowerCase();
  return patterns.some((pattern) => new RegExp(pattern, "i").test(lower));
}
