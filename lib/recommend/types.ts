import type { Software } from "@/data/software";

/**
 * Sprint 10 — the recommendation engine's input/output contract.
 *
 * Every field here is honored by lib/recommend/scoring.ts using ONLY real
 * stored fields (category, pricing.model, platforms, and text search over
 * features/description/bestFor) — never an invented capability. One field,
 * `industry`, is collected but deliberately never scored: no software
 * entry in this dataset stores an industry/vertical, so scoring on it
 * would mean inventing a match. It's kept on the type so the wizard can
 * still ask (for future use, once the dataset supports it) and the
 * results page can honestly disclose that it had no effect — see
 * docs/recommendation-engine.md.
 */

export type TeamSize = "solo" | "small" | "medium" | "large" | "unspecified";
export type Budget = "free" | "low" | "flexible" | "unspecified";
export type CompanyStage = "startup" | "growth" | "enterprise" | "unspecified";
export type WorkStyle = "remote" | "office" | "hybrid" | "unspecified";
export type DifficultyPreference = "simple" | "powerful" | "no-preference";

export type RecommendationAnswers = {
  teamSize: TeamSize;
  budget: Budget;
  companyStage: CompanyStage;
  /** Collected, never scored — see module doc comment above. */
  industry: string;
  workStyle: WorkStyle;
  /** Free-text tool/integration names the user typed, e.g. ["Slack", "Google Drive"]. */
  requiredIntegrations: string[];
  needsAi: boolean;
  needsProjectManagement: boolean;
  needsCrm: boolean;
  needsKnowledgeBase: boolean;
  needsAutomation: boolean;
  needsCommunication: boolean;
  difficultyPreference: DifficultyPreference;
};

export type ScoreFactorDirection = "positive" | "negative" | "informational";

export type ScoreFactor = {
  label: string;
  /** Signed point contribution. 0 for informational factors (e.g. "industry wasn't used"). */
  points: number;
  direction: ScoreFactorDirection;
  /** Plain-language reason, naming the real field the factor is based on. */
  explanation: string;
};

export type ScoringResult = {
  totalScore: number;
  /** Sum of every factor's best-case positive value for this answer set — the denominator behind matchPercent. Documented in docs/recommendation-engine.md. */
  maxPossibleScore: number;
  /** 0-100, `max(0, totalScore) / maxPossibleScore`. 0 when maxPossibleScore is 0 (no scorable answers given). */
  matchPercent: number;
  factors: ScoreFactor[];
};

/**
 * Phase 6 — the seam a future AI-based scorer would implement instead.
 * Same inputs, same output shape (a score plus a human-readable factor
 * list), so swapping the engine never touches the wizard, the results
 * page, or the ranking/assembly logic in lib/recommend/engine.ts.
 */
export type ScoringStrategy = (software: Software, answers: RecommendationAnswers) => ScoringResult;

export type SoftwareRecommendation = {
  software: Software;
  rank: number;
  scoring: ScoringResult;
  pros: string[];
  consDisclosure: string;
  relatedComparisonSlugs: string[];
};
