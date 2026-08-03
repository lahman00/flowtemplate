import type { RecommendationAnswers, ScoreFactorDirection } from "@/lib/recommend/types";
import { DEFAULT_ANSWERS } from "@/lib/recommend/query";

/**
 * Sprint 12 Phase 5 — deterministic regression fixtures for the
 * recommendation engine. Each assertion checks a *structural* property
 * (which category won, whether a factor of a given direction mentioning a
 * given keyword exists, relative/exact scores) rather than exact
 * explanation text, so a wording tweak to an explanation string doesn't
 * break these — only a real behavior change does. Every expected value
 * below was computed by actually running lib/recommend/engine.ts against
 * the live dataset, not guessed. See docs/maintenance-system.md.
 */

export type FixtureAssertion =
  | { kind: "resultCount"; expected: number }
  | { kind: "topCategory"; expected: string }
  | { kind: "topCategoryIn"; expected: string[] }
  | { kind: "topSlug"; expected: string }
  | { kind: "exactMatchPercent"; rank: number; expected: number }
  | { kind: "minMatchPercent"; rank: number; min: number }
  | { kind: "factorPresent"; rank: number; direction: ScoreFactorDirection; labelIncludes: string }
  | { kind: "factorAbsent"; rank: number; labelIncludes: string }
  | { kind: "allFactorsZeroPoints"; labelIncludes: string };

export type RegressionFixture = {
  name: string;
  description: string;
  answers: RecommendationAnswers;
  assertions: FixtureAssertion[];
};

export const RECOMMENDATION_FIXTURES: RegressionFixture[] = [
  {
    name: "small-remote-pm-ai-low-budget",
    description: "Small remote team needing project management and AI, on a low budget.",
    answers: { ...DEFAULT_ANSWERS, teamSize: "small", workStyle: "remote", budget: "low", needsProjectManagement: true, needsAi: true },
    assertions: [
      { kind: "resultCount", expected: 3 },
      { kind: "topCategory", expected: "project-management" },
      { kind: "factorPresent", rank: 1, direction: "positive", labelIncludes: "project management" },
      { kind: "factorPresent", rank: 1, direction: "positive", labelIncludes: "AI" },
    ],
  },
  {
    name: "crm-enterprise",
    description: "Enterprise company that only needs a CRM.",
    answers: { ...DEFAULT_ANSWERS, needsCrm: true, companyStage: "enterprise" },
    assertions: [
      { kind: "topCategory", expected: "crm" },
      { kind: "factorPresent", rank: 1, direction: "positive", labelIncludes: "enterprise" },
    ],
  },
  {
    name: "knowledge-base-simple",
    description: "Wants a knowledge base and prefers something simple.",
    answers: { ...DEFAULT_ANSWERS, needsKnowledgeBase: true, difficultyPreference: "simple" },
    assertions: [{ kind: "topCategory", expected: "knowledge-base" }],
  },
  {
    name: "automation-free-budget",
    description: "Needs automation, must be free.",
    answers: { ...DEFAULT_ANSWERS, needsAutomation: true, budget: "free" },
    assertions: [{ kind: "topCategory", expected: "automation" }],
  },
  {
    name: "communication-remote",
    description: "Remote team needing a communication tool.",
    answers: { ...DEFAULT_ANSWERS, needsCommunication: true, workStyle: "remote" },
    assertions: [
      { kind: "topCategory", expected: "communication" },
      { kind: "factorPresent", rank: 1, direction: "positive", labelIncludes: "Web and mobile" },
    ],
  },
  {
    name: "baseline-no-answers",
    description: "No meaningful answers given — every product ties at zero, so ranking falls back to deterministic dataset order.",
    answers: { ...DEFAULT_ANSWERS },
    assertions: [
      { kind: "resultCount", expected: 3 },
      { kind: "exactMatchPercent", rank: 1, expected: 0 },
      { kind: "topSlug", expected: "notion" },
    ],
  },
  {
    name: "industry-only-never-scored",
    description: "Industry is the only answer given — must never contribute points (no dataset support for it; the engine must disclose this, not silently score it).",
    answers: { ...DEFAULT_ANSWERS, industry: "Healthcare" },
    assertions: [
      { kind: "topSlug", expected: "notion" },
      { kind: "factorPresent", rank: 1, direction: "informational", labelIncludes: "Industry" },
      { kind: "allFactorsZeroPoints", labelIncludes: "Industry" },
    ],
  },
  {
    name: "integration-slack-crm",
    description: "Needs a CRM and requires Slack integration — should reward the entry whose features mention Slack.",
    answers: { ...DEFAULT_ANSWERS, requiredIntegrations: ["Slack"], needsCrm: true },
    assertions: [
      { kind: "topCategory", expected: "crm" },
      { kind: "factorPresent", rank: 1, direction: "positive", labelIncludes: "Slack" },
    ],
  },
  {
    name: "integration-nonsense-string",
    description: "Requires an integration name that appears nowhere in the dataset — every product should be penalized identically, falling back to dataset order.",
    answers: { ...DEFAULT_ANSWERS, requiredIntegrations: ["Zzyxxblorp9000"] },
    assertions: [
      { kind: "topSlug", expected: "notion" },
      { kind: "factorPresent", rank: 1, direction: "negative", labelIncludes: "Zzyxxblorp9000" },
    ],
  },
  {
    name: "powerful-preference-crm",
    description: "Wants a powerful/advanced tool, needs CRM.",
    answers: { ...DEFAULT_ANSWERS, difficultyPreference: "powerful", needsCrm: true },
    assertions: [{ kind: "topCategory", expected: "crm" }],
  },
  {
    name: "large-enterprise-pm",
    description: "Large enterprise team needing project management.",
    answers: { ...DEFAULT_ANSWERS, teamSize: "large", companyStage: "enterprise", needsProjectManagement: true },
    assertions: [
      { kind: "topCategory", expected: "project-management" },
      { kind: "factorPresent", rank: 1, direction: "positive", labelIncludes: "large" },
      { kind: "factorPresent", rank: 1, direction: "positive", labelIncludes: "enterprise" },
    ],
  },
  {
    name: "multiple-category-needs",
    description: "Needs both project management and CRM — top pick should satisfy at least one via primary category.",
    answers: { ...DEFAULT_ANSWERS, needsProjectManagement: true, needsCrm: true },
    assertions: [{ kind: "topCategoryIn", expected: ["crm", "project-management"] }],
  },
  {
    name: "solo-simple-free",
    description: "Solo freelancer, wants something simple and free.",
    answers: { ...DEFAULT_ANSWERS, teamSize: "solo", difficultyPreference: "simple", budget: "free" },
    // Was pinned to a specific "any size" phrase from whichever product
    // happened to rank #1 pre-expansion. Post-expansion, the #1 pick for
    // this exact query is IFTTT — a genuinely stronger match ("Individuals,
    // small business owners... who want simple, no-code automations" is a
    // closer fit than a generic "any size" product). Assert on "solo team",
    // the actual dimension this fixture is testing, so it stays meaningful
    // regardless of which specific product wins as the dataset grows.
    assertions: [{ kind: "factorPresent", rank: 1, direction: "positive", labelIncludes: "solo team" }],
  },
  {
    name: "office-pm-no-remote-signal",
    description: "Office-based team needing project management — must NOT receive a remote-only work-style factor.",
    answers: { ...DEFAULT_ANSWERS, workStyle: "office", needsProjectManagement: true },
    assertions: [
      { kind: "topCategory", expected: "project-management" },
      { kind: "factorAbsent", rank: 1, labelIncludes: "Web and mobile" },
      { kind: "factorAbsent", rank: 1, labelIncludes: "remote" },
    ],
  },
];
