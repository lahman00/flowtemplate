/**
 * Sprint 8 Phase 5 — future revenue opportunities, ranked. This is a
 * strategic/editorial list, not a sourced fact about any vendor — nothing
 * here is live or wired to any page. Rationale for the ranking lives in
 * docs/revenue.md.
 */

export type RevenueOpportunity = {
  name: string;
  rank: number;
  summary: string;
  rationale: string;
  /** What already exists in the codebase toward this, if anything. */
  existingFoundation: string;
};

export const REVENUE_OPPORTUNITIES: RevenueOpportunity[] = [
  {
    name: "Affiliate links",
    rank: 1,
    summary: "Paid referral commissions on the 'visit official site' CTA, for vendors with a confirmed program.",
    rationale:
      "Lowest effort to activate — the mechanics (lib/affiliate.ts, affiliate_url field) and the Phase 1 research (which vendors actually have a program) already exist. Directly matches existing user intent (someone already comparing tools, one click from converting) instead of requiring new content or traffic.",
    existingFoundation: "lib/affiliate.ts, data/software/schema.ts affiliate_url field, data/revenue/affiliate-programs.ts",
  },
  {
    name: "Premium placement",
    rank: 2,
    summary: "A vendor pays to be featured/highlighted in its category or in relevant comparisons, clearly labeled.",
    rationale:
      "Second-lowest effort — the `featured`/`sponsored` flags and ListingBadges component already exist and just need a real commercial agreement to switch on. Works even for vendors with no affiliate program (e.g. Slack, Salesforce), which is most of Tier A/B by program status. Requires a clear, honest 'Sponsored' label to preserve trust — already built.",
    existingFoundation: "lib/monetization.ts, components/ListingBadges.tsx, sponsored/featured schema fields",
  },
  {
    name: "Sponsored comparisons",
    rank: 3,
    summary: "A vendor sponsors a specific /compare page or a 'why teams switch to X' placement, still built from real stored facts only.",
    rationale:
      "Comparison pages are the highest-intent pages on the site (someone actively choosing between two named tools). The constraint is that sponsorship can never change the facts shown — it can only affect placement/labeling, per this project's no-fabrication rule. That constraint limits monetization ceiling but protects the trust the rest of the ranking depends on.",
    existingFoundation: "app/compare/[comparison]/page.tsx, data/comparisons.ts",
  },
  {
    name: "Lead generation",
    rank: 4,
    summary: "Selling qualified 'this visitor is evaluating tools X and Y' signals to vendors' sales teams (opt-in only).",
    rationale:
      "Higher revenue ceiling per user than affiliate clicks for high-ACV categories (CRM, project management) but requires new infrastructure (consent capture, a form, a data-handling policy) this project doesn't have yet, and real legal/privacy review before any PII is collected — out of scope for 'architecture only.'",
    existingFoundation: "None yet — would need a new consent-gated form and a privacy-policy update before any build work.",
  },
  {
    name: "Market reports",
    rank: 5,
    summary: "Packaging the dataset's own real, computed signals (comparison volume, category coverage) into a paid or gated report.",
    rationale:
      "The dataset already produces genuinely original signals (getPopularAlternatives, comparison-involvement counts) nothing else on the market has, which is a real differentiator — but turning that into a sellable report needs a distribution channel and buyer relationships this project doesn't have yet.",
    existingFoundation: "lib/related.ts getPopularAlternatives(), lib/revenue/scoring.ts buying-intent signal",
  },
  {
    name: "API access",
    rank: 6,
    summary: "Paid programmatic access to the software/comparison dataset for other tools to build on.",
    rationale:
      "Technically straightforward given the data is already structured and validated, but revenue depends entirely on external demand this project has no evidence of yet, and it commits to an ongoing support/versioning burden.",
    existingFoundation: "data/software, data/categories, data/comparisons.ts are already clean, typed, and validated — the hard data-modeling work is done.",
  },
  {
    name: "Enterprise / white-label",
    rank: 7,
    summary: "Licensing the directory (or a white-labeled version of it) to a company for internal tool-selection use.",
    rationale:
      "Highest potential deal size but also highest effort: needs sales motion, contracts, and likely per-customer customization this project has zero infrastructure for today. Ranked last because nothing here can be de-risked with architecture alone — it needs a buyer conversation first.",
    existingFoundation: "None — would start from the existing dataset/schema as the only reusable asset.",
  },
];

export function getRevenueOpportunities(): RevenueOpportunity[] {
  return [...REVENUE_OPPORTUNITIES].sort((a, b) => a.rank - b.rank);
}
