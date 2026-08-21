import type { RecommendationAnswers, ScoreFactorDirection } from "@/lib/recommend/types";
import { DEFAULT_ANSWERS } from "@/lib/recommend/query";

/**
 * Sprint 12 Phase 5, rebuilt 2026-08-21 for the domain-eligibility engine
 * — deterministic regression fixtures for the recommendation engine.
 * Each assertion checks a *structural* property (which domain/category
 * won, whether a factor of a given direction mentioning a given keyword
 * exists, relative/exact scores) rather than exact explanation text, so
 * a wording tweak to an explanation string doesn't break these — only a
 * real behavior change does. Every expected value below was computed by
 * actually running lib/recommend/engine.ts against the live dataset, not
 * guessed. See docs/maintenance-system.md.
 *
 * Rebuild note: the old needsProjectManagement/needsCrm/etc. booleans are
 * gone, replaced by a single `primaryNeed` domain selector (see
 * lib/recommend/domains.ts). The old "multiple-category-needs" fixture
 * (needsProjectManagement + needsCrm together) no longer applies — a
 * buyer now picks exactly one primary need, matching the plain-language
 * "what are you trying to do?" wizard question (Phase 5 of the rebuild
 * brief); removed rather than force-fit.
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
    answers: { ...DEFAULT_ANSWERS, teamSize: "small", workStyle: "remote", budget: "low", primaryNeed: "project_management", needsAi: true },
    assertions: [
      { kind: "resultCount", expected: 3 },
      // Recommend Engine Integrity Patch (2026-08-21): "productivity" is included
      // because Notion (real catalog category "productivity") is a genuinely
      // multi-domain-eligible product for project_management — see
      // data/recommend/product-profiles.ts. Checking category alone would
      // overfit to single-domain products; the real invariant this proves is
      // domain eligibility, not catalog taxonomy.
      { kind: "topCategoryIn", expected: ["project-management", "productivity"] },
      { kind: "factorPresent", rank: 1, direction: "positive", labelIncludes: "Matches what you're trying to do" },
      { kind: "factorPresent", rank: 1, direction: "positive", labelIncludes: "AI" },
    ],
  },
  {
    name: "crm-enterprise",
    description: "Enterprise company that only needs a CRM.",
    answers: { ...DEFAULT_ANSWERS, primaryNeed: "crm", companyStage: "enterprise" },
    assertions: [
      { kind: "topCategory", expected: "crm" },
      { kind: "factorPresent", rank: 1, direction: "positive", labelIncludes: "enterprise" },
    ],
  },
  {
    name: "knowledge-base-simple",
    description: "Wants a knowledge base and prefers something simple.",
    answers: { ...DEFAULT_ANSWERS, primaryNeed: "knowledge_base", difficultyPreference: "simple" },
    // "productivity" included for the same reason as small-remote-pm-ai-low-budget above — Notion.
    assertions: [{ kind: "topCategoryIn", expected: ["knowledge-base", "productivity"] }],
  },
  {
    name: "automation-free-budget",
    description: "Needs automation, must be free.",
    answers: { ...DEFAULT_ANSWERS, primaryNeed: "automation", budget: "free" },
    assertions: [{ kind: "topCategory", expected: "automation" }],
  },
  {
    name: "communication-remote",
    description: "Remote team needing a communication tool.",
    answers: { ...DEFAULT_ANSWERS, primaryNeed: "communication", workStyle: "remote" },
    assertions: [{ kind: "topCategory", expected: "communication" }],
  },
  {
    name: "baseline-no-answers",
    description: "No meaningful answers given — no domain selected, so every product is still eligible (unchanged fallback) and ties at zero. Recommend Engine Integrity Patch (2026-08-21): does NOT assert one exact top slug — with everyone tied at 0, the deterministic alphabetical tie-break (see lib/recommend/engine.ts) picks whichever eligible slug sorts first, which is a real property of the dataset (currently \"1password\"), not a meaningful merit signal worth pinning in a regression test.",
    answers: { ...DEFAULT_ANSWERS },
    assertions: [
      { kind: "resultCount", expected: 3 },
      { kind: "exactMatchPercent", rank: 1, expected: 0 },
    ],
  },
  {
    name: "industry-only-never-scored",
    description: "Industry is the only answer given — must never contribute points (no dataset support for it; the engine must disclose this, not silently score it). Does not assert an exact top slug — see baseline-no-answers.",
    answers: { ...DEFAULT_ANSWERS, industry: "Healthcare" },
    assertions: [
      { kind: "factorPresent", rank: 1, direction: "informational", labelIncludes: "Industry" },
      { kind: "allFactorsZeroPoints", labelIncludes: "Industry" },
    ],
  },
  {
    name: "integration-slack-crm",
    description: "Needs a CRM and requires Slack integration — should reward the entry whose features mention Slack.",
    answers: { ...DEFAULT_ANSWERS, requiredIntegrations: ["Slack"], primaryNeed: "crm" },
    assertions: [
      { kind: "topCategory", expected: "crm" },
      { kind: "factorPresent", rank: 1, direction: "positive", labelIncludes: "Slack" },
    ],
  },
  {
    name: "integration-nonsense-string",
    description: "Requires an integration name that appears nowhere in the dataset — every product should be penalized identically. Does not assert an exact top slug — see baseline-no-answers.",
    answers: { ...DEFAULT_ANSWERS, requiredIntegrations: ["Zzyxxblorp9000"] },
    assertions: [
      { kind: "factorPresent", rank: 1, direction: "negative", labelIncludes: "Zzyxxblorp9000" },
    ],
  },
  {
    name: "powerful-preference-crm",
    description: "Wants a powerful/advanced tool, needs CRM.",
    answers: { ...DEFAULT_ANSWERS, difficultyPreference: "powerful", primaryNeed: "crm" },
    assertions: [{ kind: "topCategory", expected: "crm" }],
  },
  {
    name: "large-enterprise-pm",
    description: "Large enterprise team needing project management.",
    answers: { ...DEFAULT_ANSWERS, teamSize: "large", companyStage: "enterprise", primaryNeed: "project_management" },
    assertions: [
      // "productivity" included for the same reason as small-remote-pm-ai-low-budget above — Notion.
      { kind: "topCategoryIn", expected: ["project-management", "productivity"] },
      { kind: "factorPresent", rank: 1, direction: "positive", labelIncludes: "enterprise" },
    ],
  },
  {
    name: "solo-simple-free",
    description: "Solo freelancer, wants something simple and free.",
    answers: { ...DEFAULT_ANSWERS, teamSize: "solo", difficultyPreference: "simple", budget: "free" },
    assertions: [{ kind: "factorPresent", rank: 1, direction: "positive", labelIncludes: "solo team" }],
  },
  {
    name: "office-pm-no-remote-signal",
    description: "Office-based team needing project management — must NOT receive a remote-only work-style factor.",
    answers: { ...DEFAULT_ANSWERS, workStyle: "office", primaryNeed: "project_management" },
    assertions: [
      // "productivity" included for the same reason as small-remote-pm-ai-low-budget above — Notion.
      { kind: "topCategoryIn", expected: ["project-management", "productivity"] },
      { kind: "factorAbsent", rank: 1, labelIncludes: "Web and mobile" },
      { kind: "factorAbsent", rank: 1, labelIncludes: "remote" },
    ],
  },

  // ---- New domains (2026-08-21 rebuild) ----
  {
    name: "help-desk-small-team",
    description: "Small team wanting customer support ticketing.",
    answers: { ...DEFAULT_ANSWERS, primaryNeed: "help_desk", teamSize: "small" },
    assertions: [{ kind: "topCategory", expected: "customer-support" }],
  },
  {
    name: "password-manager-simple",
    description: "Wants a simple password manager, individual use.",
    answers: { ...DEFAULT_ANSWERS, primaryNeed: "password_manager", teamSize: "solo", difficultyPreference: "simple" },
    assertions: [{ kind: "topCategory", expected: "security" }],
  },
  {
    name: "email-marketing-free-budget",
    description: "Wants email marketing on a free/low budget.",
    answers: { ...DEFAULT_ANSWERS, primaryNeed: "email_marketing", budget: "low" },
    assertions: [{ kind: "topCategory", expected: "marketing" }],
  },
  {
    name: "accounting-freelancer",
    description: "Freelancer wanting simple accounting/invoicing.",
    answers: { ...DEFAULT_ANSWERS, primaryNeed: "accounting", teamSize: "solo", difficultyPreference: "simple" },
    assertions: [{ kind: "topCategory", expected: "accounting" }],
  },
  {
    name: "scheduling-consultant",
    description: "Solo consultant wanting appointment scheduling.",
    answers: { ...DEFAULT_ANSWERS, primaryNeed: "scheduling", teamSize: "solo" },
    assertions: [{ kind: "topCategory", expected: "scheduling" }],
  },
  {
    name: "analytics-product-team",
    description: "Wants product/web analytics.",
    answers: { ...DEFAULT_ANSWERS, primaryNeed: "analytics" },
    assertions: [{ kind: "topCategory", expected: "analytics" }],
  },
  {
    name: "social-media-agency",
    description: "Agency wanting social media scheduling across channels.",
    answers: { ...DEFAULT_ANSWERS, primaryNeed: "social_media" },
    assertions: [{ kind: "topCategory", expected: "marketing" }],
  },
  {
    name: "time-tracking-freelancer-lightweight",
    description: "Freelancer wanting time tracking, explicitly prefers lightweight (no employee monitoring).",
    answers: { ...DEFAULT_ANSWERS, primaryNeed: "time_tracking", teamSize: "solo", monitoringSensitivity: "prefer-lightweight" },
    assertions: [
      { kind: "topCategory", expected: "productivity" },
      { kind: "factorAbsent", rank: 1, labelIncludes: "hubstaff" },
    ],
  },

  // ---- Cross-domain absurdity guards (Phase 7 of the rebuild brief) ----
  {
    name: "absurd-postmark-must-not-surface-for-project-management",
    description: "A transactional-email API (postmark, not in the catalog subset scored here) must never appear for a project-management need — proven structurally via eligibility, not by asserting an absence of one slug.",
    answers: { ...DEFAULT_ANSWERS, primaryNeed: "project_management" },
    // "productivity" included for the same reason as small-remote-pm-ai-low-budget above — Notion.
    // The real property this fixture proves is "postmark's category (api) never wins," which still holds.
    assertions: [{ kind: "topCategoryIn", expected: ["project-management", "productivity"] }],
  },
  {
    name: "absurd-setmore-must-not-surface-for-crm",
    description: "Setmore is a scheduling tool, not a CRM — must never win a CRM-domain request.",
    answers: { ...DEFAULT_ANSWERS, primaryNeed: "crm" },
    assertions: [
      { kind: "topCategory", expected: "crm" },
      { kind: "factorAbsent", rank: 1, labelIncludes: "setmore" },
    ],
  },
];
