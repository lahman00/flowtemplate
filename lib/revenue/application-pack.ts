import type { Software } from "@/data/software";
import { getSoftware } from "@/data/software";
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
/** Not found anywhere in the codebase or prior session records — a genuine missing input, never invented. Set this once the owner provides the real company-page URL. */
export const APPLICANT_LINKEDIN_URL: string | null = null;

export const BUSINESS_DESCRIPTION =
  "Miloosh is an independent software research and comparison platform focused on helping users make better-informed software decisions using clear product information, comparisons and alternatives.";

export const PROMOTION_STRATEGY =
  "Miloosh helps users research and compare business software before making a purchase decision. We promote relevant software through product, comparison and alternatives pages. Traffic is generated primarily through organic search and software-focused content. When a product is relevant to a visitor's research, users may be directed to the vendor through clearly disclosed affiliate links.";

export const PUBLISHER_CLASSIFICATION = "Publisher of product reviews, buying guides or comparison articles.";

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
    program,
    applicationUrl: program?.applicationUrl ?? null,
    readyToApply: program?.programExists === "yes",
    missingOwnerInputs,
  };
}
