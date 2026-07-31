import type {
  Budget,
  CompanyStage,
  DifficultyPreference,
  RecommendationAnswers,
  TeamSize,
  WorkStyle,
} from "@/lib/recommend/types";

/**
 * Sprint 10 — the wizard (client component) hands answers to the results
 * page (server component) via a plain query string, so results are
 * server-rendered, shareable, and bookmarkable, without needing a separate
 * API round-trip just to compute a recommendation.
 */

export const DEFAULT_ANSWERS: RecommendationAnswers = {
  teamSize: "unspecified",
  budget: "unspecified",
  companyStage: "unspecified",
  industry: "",
  workStyle: "unspecified",
  requiredIntegrations: [],
  needsAi: false,
  needsProjectManagement: false,
  needsCrm: false,
  needsKnowledgeBase: false,
  needsAutomation: false,
  needsCommunication: false,
  difficultyPreference: "no-preference",
};

const TEAM_SIZES: TeamSize[] = ["solo", "small", "medium", "large", "unspecified"];
const BUDGETS: Budget[] = ["free", "low", "flexible", "unspecified"];
const COMPANY_STAGES: CompanyStage[] = ["startup", "growth", "enterprise", "unspecified"];
const WORK_STYLES: WorkStyle[] = ["remote", "office", "hybrid", "unspecified"];
const DIFFICULTY_PREFERENCES: DifficultyPreference[] = ["simple", "powerful", "no-preference"];

function pick<T extends string>(value: string | null, allowed: T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function answersToSearchParams(answers: RecommendationAnswers): URLSearchParams {
  const params = new URLSearchParams();
  params.set("team", answers.teamSize);
  params.set("budget", answers.budget);
  params.set("stage", answers.companyStage);
  if (answers.industry.trim()) params.set("industry", answers.industry.trim());
  params.set("work", answers.workStyle);
  if (answers.requiredIntegrations.length > 0) {
    params.set("integrations", answers.requiredIntegrations.join(","));
  }
  params.set("ai", answers.needsAi ? "1" : "0");
  params.set("pm", answers.needsProjectManagement ? "1" : "0");
  params.set("crm", answers.needsCrm ? "1" : "0");
  params.set("kb", answers.needsKnowledgeBase ? "1" : "0");
  params.set("automation", answers.needsAutomation ? "1" : "0");
  params.set("comms", answers.needsCommunication ? "1" : "0");
  params.set("difficulty", answers.difficultyPreference);
  return params;
}

export function searchParamsToAnswers(
  params: URLSearchParams | Record<string, string | string[] | undefined>
): RecommendationAnswers {
  const get = (key: string): string | null => {
    if (params instanceof URLSearchParams) return params.get(key);
    const value = params[key];
    return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
  };

  const integrations = (get("integrations") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  return {
    teamSize: pick(get("team"), TEAM_SIZES, DEFAULT_ANSWERS.teamSize),
    budget: pick(get("budget"), BUDGETS, DEFAULT_ANSWERS.budget),
    companyStage: pick(get("stage"), COMPANY_STAGES, DEFAULT_ANSWERS.companyStage),
    industry: (get("industry") ?? "").slice(0, 200),
    workStyle: pick(get("work"), WORK_STYLES, DEFAULT_ANSWERS.workStyle),
    requiredIntegrations: integrations.slice(0, 10),
    needsAi: get("ai") === "1",
    needsProjectManagement: get("pm") === "1",
    needsCrm: get("crm") === "1",
    needsKnowledgeBase: get("kb") === "1",
    needsAutomation: get("automation") === "1",
    needsCommunication: get("comms") === "1",
    difficultyPreference: pick(get("difficulty"), DIFFICULTY_PREFERENCES, DEFAULT_ANSWERS.difficultyPreference),
  };
}

/** Compact, human-readable summary of an answer set — for analytics/audit logs, not for display. */
export function summarizeAnswers(answers: RecommendationAnswers): string {
  const parts: string[] = [];
  if (answers.teamSize !== "unspecified") parts.push(`team=${answers.teamSize}`);
  if (answers.budget !== "unspecified") parts.push(`budget=${answers.budget}`);
  if (answers.companyStage !== "unspecified") parts.push(`stage=${answers.companyStage}`);
  if (answers.workStyle !== "unspecified") parts.push(`work=${answers.workStyle}`);
  const needs = [
    answers.needsProjectManagement && "pm",
    answers.needsCrm && "crm",
    answers.needsKnowledgeBase && "kb",
    answers.needsAutomation && "automation",
    answers.needsCommunication && "comms",
    answers.needsAi && "ai",
  ].filter(Boolean);
  if (needs.length > 0) parts.push(`needs=${needs.join("+")}`);
  if (answers.requiredIntegrations.length > 0) {
    parts.push(`integrations=${answers.requiredIntegrations.length}`);
  }
  if (answers.difficultyPreference !== "no-preference") parts.push(`difficulty=${answers.difficultyPreference}`);
  return parts.length > 0 ? parts.join(",") : "no-answers";
}

/** True if the answer set has at least one non-default value — used to tell "no answers yet" apart from "answered but nothing matched." */
export function hasAnyAnswer(answers: RecommendationAnswers): boolean {
  return (
    answers.teamSize !== "unspecified" ||
    answers.budget !== "unspecified" ||
    answers.companyStage !== "unspecified" ||
    answers.industry.trim().length > 0 ||
    answers.workStyle !== "unspecified" ||
    answers.requiredIntegrations.length > 0 ||
    answers.needsAi ||
    answers.needsProjectManagement ||
    answers.needsCrm ||
    answers.needsKnowledgeBase ||
    answers.needsAutomation ||
    answers.needsCommunication ||
    answers.difficultyPreference !== "no-preference"
  );
}
