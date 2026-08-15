import type { Software } from "@/data/software";
import { getSoftware, getAllSoftware } from "@/data/software";
import { getAllCategories } from "@/data/categories";
import { getAffiliateProgram } from "@/lib/revenue/affiliate-manager";
import type { AffiliateProgramInfo } from "@/data/revenue/affiliate-programs";

/**
 * Affiliate Revenue Engine, Phase 6 — application pack generator.
 *
 * The business description and promotion strategy below are the owner's
 * own verbatim text from the 2026-08-14 directive, already used for the
 * real Pipedrive/PartnerStack application — reused as-is, never
 * paraphrased, so every application makes the same truthful claim about
 * what Miloosh is. Nothing here invents traffic, audience size, employee
 * count, or partnerships; every field an application form asks for that
 * this system can't truthfully answer is left null with a note explaining
 * why, per the owner's own non-negotiable rule against fabrication.
 */

export const APPLICANT_BUSINESS_NAME = "Miloosh";
export const APPLICANT_WEBSITE = "https://miloosh.com";
/**
 * The email actually used on the real, already-submitted Pipedrive
 * application (recorded 2026-08-14) — kept distinct on purpose from
 * lib/site.ts's SITE_EMAIL ("hello@miloosh.app"), which is the public
 * contact address shown on the site itself. Do not silently "fix" this
 * mismatch by substituting one for the other; flag it for the owner to
 * confirm which address should be used going forward.
 */
export const APPLICANT_BUSINESS_EMAIL = "hello@miloosh.com";
/** Recorded 2026-08-14 from the owner directly — the real Miloosh LinkedIn company page. Reused for every application pack; do not ask the owner for this again. */
export const APPLICANT_LINKEDIN_URL: string | null = "https://www.linkedin.com/company/141163964/";

export const BUSINESS_DESCRIPTION =
  "Miloosh is an independent software research and comparison platform focused on helping users make better-informed software decisions using clear product information, comparisons and alternatives.";

export const PROMOTION_STRATEGY =
  "Miloosh helps users research and compare business software before making a purchase decision. We promote relevant software through product, comparison and alternatives pages. Traffic is generated primarily through organic search and software-focused content. When a product is relevant to a visitor's research, users may be directed to the vendor through clearly disclosed affiliate links.";

export const PUBLISHER_CLASSIFICATION = "Publisher of product reviews, buying guides or comparison articles.";

/**
 * Resume, 2026-08-15 — three fields several application forms ask for
 * that the pack didn't have text for yet: an audience description, a
 * summary of the software Miloosh covers, and answers to the handful of
 * free-text questions that recur across most affiliate applications.
 * Computed from real catalog counts (getAllSoftware/getAllCategories),
 * never a fabricated traffic or audience-size number — same discipline
 * as BUSINESS_DESCRIPTION/PROMOTION_STRATEGY above and the trafficOpportunityScore
 * comment in lib/revenue/affiliate-priority.ts ("0 means no data, never no traffic").
 */
export function getAudienceDescription(): string {
  const productCount = getAllSoftware().length;
  const categoryCount = getAllCategories().length;
  return `Miloosh's audience is people actively researching and comparing business software — reaching us primarily through organic search while evaluating a specific tool or category, not general readers. The site currently covers ${productCount} software products across ${categoryCount} categories (project management, CRM, communication, and others), each with dedicated comparison and alternatives content aimed at buying-intent search queries.`;
}

export function getPromotedSoftwareSummary(): string {
  const productCount = getAllSoftware().length;
  const categoryCount = getAllCategories().length;
  return `${productCount} SaaS/business-software products across ${categoryCount} categories are covered on Miloosh today, each with its own product page and relevant head-to-head comparison pages against direct competitors.`;
}

/** Answers to the free-text questions that recur across most affiliate application forms — kept separate from the fixed description/strategy fields since forms phrase the same underlying question differently. */
export function getCommonAnswers(): Record<string, string> {
  return {
    "How will you promote us?": PROMOTION_STRATEGY,
    "What is your main source of traffic?": "Organic search (Google) — visitors arrive via software comparison and buying-guide queries, not paid acquisition or social.",
    "Do you have an existing audience or email list?": "No email list or social following is used for promotion; all traffic is organic search landing directly on relevant product/comparison pages.",
    "Do you currently promote any competing or similar products?": "Miloosh is a neutral, multi-vendor comparison site — it lists and compares many competing products in the same category, including this one's direct competitors, as part of its normal editorial content, not as a conflict of interest.",
  };
}

export type ApplicationPack = {
  slug: string;
  productName: string;
  businessName: string;
  website: string;
  businessEmail: string;
  linkedinUrl: string | null;
  description: string;
  promotionStrategy: string;
  classification: string;
  audienceDescription: string;
  promotedSoftwareSummary: string;
  commonAnswers: Record<string, string>;
  program: AffiliateProgramInfo | null;
  applicationUrl: string | null;
  /** True only when the software's own program data is confirmed ("yes") — a pack for anything else is evidence to review, not something ready to submit. */
  readyToApply: boolean;
  missingOwnerInputs: string[];
};

export function buildApplicationPack(slug: string): ApplicationPack | null {
  const software: Software | undefined = getSoftware(slug);
  if (!software) return null;
  const program = getAffiliateProgram(slug) ?? null;

  const missingOwnerInputs: string[] = [];
  if (!APPLICANT_LINKEDIN_URL) {
    missingOwnerInputs.push("Miloosh LinkedIn company-page URL — not recorded anywhere; provide it once, reused for every application.");
  }
  if (!program || !program.applicationUrl) {
    missingOwnerInputs.push(`Official application URL for ${software.name} — not confirmed in data/revenue/affiliate-programs.ts.`);
  }

  return {
    slug,
    productName: software.name,
    businessName: APPLICANT_BUSINESS_NAME,
    website: APPLICANT_WEBSITE,
    businessEmail: APPLICANT_BUSINESS_EMAIL,
    linkedinUrl: APPLICANT_LINKEDIN_URL,
    description: BUSINESS_DESCRIPTION,
    promotionStrategy: PROMOTION_STRATEGY,
    classification: PUBLISHER_CLASSIFICATION,
    audienceDescription: getAudienceDescription(),
    promotedSoftwareSummary: getPromotedSoftwareSummary(),
    commonAnswers: getCommonAnswers(),
    program,
    applicationUrl: program?.applicationUrl ?? null,
    readyToApply: program?.programExists === "yes",
    missingOwnerInputs,
  };
}
