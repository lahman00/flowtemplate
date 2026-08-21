/**
 * Recommend Engine Rebuild (2026-08-21) — the decision-domain model.
 *
 * Before this, "what does the tool need to cover?" was 5 hardcoded
 * booleans (needsProjectManagement, needsCrm, needsKnowledgeBase,
 * needsAutomation, needsCommunication) scattered across
 * lib/recommend/types.ts, keywords.ts, scoring.ts, query.ts, and
 * RecommendWizard.tsx — adding a 6th meant touching all five. A buyer
 * looking for a help desk, password manager, email marketing tool,
 * accounting software, scheduler, analytics platform, social media
 * manager, or time tracker had no way to express that need at all: the
 * wizard didn't offer it, so they'd get generic team-size/budget-based
 * results with zero connection to what they actually wanted.
 *
 * This file is the single source of truth for what a "domain" is. Every
 * domain here was added only after checking the real catalog has enough
 * products with a coherent, evidence-backed fit — see
 * DOMAIN_ELIGIBLE_SLUGS below and its research notes. A domain is never
 * added merely because data/categories/categories.json has a matching
 * category slug.
 */

export const RECOMMEND_DOMAINS = [
  "project_management",
  "crm",
  "knowledge_base",
  "automation",
  "communication",
  "help_desk",
  "password_manager",
  "email_marketing",
  "accounting",
  "scheduling",
  "analytics",
  "social_media",
  "time_tracking",
] as const;

export type RecommendDomain = (typeof RECOMMEND_DOMAINS)[number];

export type DomainMeta = {
  domain: RecommendDomain;
  /** Plain-language label shown in the "what are you trying to do?" step — no SaaS taxonomy jargon. */
  label: string;
  /** One-sentence plain-language description of the need, not the product category name. */
  description: string;
  /** The real data/categories/categories.json slug this domain is centered on — informational, not the eligibility source (see DOMAIN_ELIGIBLE_SLUGS in product-profiles.ts, which is the real gate). */
  primaryCategorySlug: string;
};

/**
 * Every domain's plain-language framing. Written for a buyer who doesn't
 * know or care what "CRM" or "knowledge base" means as a category label —
 * see docs/recommendation-engine.md Phase 5 for the "bad: 'Do you need a
 * knowledge base?' / better: plain language" guidance this was written to.
 */
export const DOMAIN_META: Record<RecommendDomain, DomainMeta> = {
  project_management: {
    domain: "project_management",
    label: "Plan and track work",
    description: "Tasks, boards, timelines, and who's doing what by when.",
    primaryCategorySlug: "project-management",
  },
  crm: {
    domain: "crm",
    label: "Track sales leads and deals",
    description: "A pipeline for contacts, deals, and follow-ups so nothing falls through.",
    primaryCategorySlug: "crm",
  },
  knowledge_base: {
    domain: "knowledge_base",
    label: "Store docs your team or customers can search",
    description: "A wiki or documentation hub people can actually find answers in.",
    primaryCategorySlug: "knowledge-base",
  },
  automation: {
    domain: "automation",
    label: "Automate repetitive steps between tools",
    description: "Trigger-based workflows that move data between apps without manual work.",
    primaryCategorySlug: "automation",
  },
  communication: {
    domain: "communication",
    label: "Chat, calls, or video meetings",
    description: "Real-time team or customer communication — messaging, calls, or video.",
    primaryCategorySlug: "communication",
  },
  help_desk: {
    domain: "help_desk",
    label: "Support customers with tickets or live chat",
    description: "A shared inbox or ticketing system so customer questions don't get lost.",
    primaryCategorySlug: "customer-support",
  },
  password_manager: {
    domain: "password_manager",
    label: "Store and share passwords securely",
    description: "A vault for passwords and logins, for yourself or a whole team.",
    primaryCategorySlug: "security",
  },
  email_marketing: {
    domain: "email_marketing",
    label: "Send newsletters or marketing emails",
    description: "Build an email list, send campaigns, and automate follow-ups.",
    primaryCategorySlug: "marketing",
  },
  accounting: {
    domain: "accounting",
    label: "Handle bookkeeping and invoicing",
    description: "Track income and expenses, send invoices, and stay ready for tax time.",
    primaryCategorySlug: "accounting",
  },
  scheduling: {
    domain: "scheduling",
    label: "Let people book time on your calendar",
    description: "A booking link so clients or teammates can schedule time without back-and-forth emails.",
    primaryCategorySlug: "scheduling",
  },
  analytics: {
    domain: "analytics",
    label: "Understand how people use your website or product",
    description: "Track visits, behavior, and conversions on a site or app.",
    primaryCategorySlug: "analytics",
  },
  social_media: {
    domain: "social_media",
    label: "Plan and publish social media posts",
    description: "Schedule posts across platforms and see how they perform, from one place.",
    primaryCategorySlug: "marketing",
  },
  time_tracking: {
    domain: "time_tracking",
    label: "Track time spent on work or projects",
    description: "Log hours for billing, payroll, or understanding where time actually goes.",
    primaryCategorySlug: "productivity",
  },
};

export function getDomainMeta(domain: RecommendDomain): DomainMeta {
  return DOMAIN_META[domain];
}

export function isRecommendDomain(value: string): value is RecommendDomain {
  return (RECOMMEND_DOMAINS as readonly string[]).includes(value);
}
