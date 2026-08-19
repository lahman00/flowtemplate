export type MonetizationReadiness = "READY NOW" | "APPROVED BUT NEEDS LINK" | "PENDING APPROVAL" | "NEEDS APPLICATION" | "REJECTED" | "NOT ELIGIBLE" | "HOLD / UNCLEAR";
export type NormalizedCommissionType = "recurring_percentage" | "one_time_percentage" | "fixed_cpa" | "qualified_lead" | "revenue_share" | "hybrid" | "unknown";

export type PartnerMaterialAudit = {
  company: string;
  slug: string;
  programNetwork: string;
  currentStatus: string;
  applicationStatus: string;
  approvalStatus: string;
  affiliateUrl: string;
  commission: { type: NormalizedCommissionType; value: string; originalWording: string };
  recurrence: string;
  cookieWindow: string;
  payoutThreshold: string;
  payoutMethod: string;
  qualificationRules: string;
  restrictions: string;
  ppcTrademarkRestrictions: string;
  couponRestrictions: string;
  emailRestrictions: string;
  disclosureRequirements: string;
  geographyRestrictions: string;
  selfReferralRules: string;
  inactivityTerminationRules: string;
  brandAssets: string;
  mediaKit: string;
  brandGuidelines: string;
  promotionalMaterials: string;
  supportContact: string;
  evidence: string[];
  lastVerifiedDate: string;
  readiness: MonetizationReadiness;
  vendorClaims: string[];
  verifiedMarketingFacts: string[];
};

const UNKNOWN = "UNKNOWN";
type AuditSeed = Pick<PartnerMaterialAudit, "company" | "slug" | "evidence" | "lastVerifiedDate" | "readiness"> & Partial<Omit<PartnerMaterialAudit, "company" | "slug" | "evidence" | "lastVerifiedDate" | "readiness">>;

function record(seed: AuditSeed): PartnerMaterialAudit {
  return {
    programNetwork: UNKNOWN, currentStatus: UNKNOWN, applicationStatus: UNKNOWN, approvalStatus: UNKNOWN, affiliateUrl: UNKNOWN,
    commission: { type: "unknown", value: UNKNOWN, originalWording: UNKNOWN }, recurrence: UNKNOWN, cookieWindow: UNKNOWN,
    payoutThreshold: UNKNOWN, payoutMethod: UNKNOWN, qualificationRules: UNKNOWN, restrictions: UNKNOWN,
    ppcTrademarkRestrictions: UNKNOWN, couponRestrictions: UNKNOWN, emailRestrictions: UNKNOWN,
    disclosureRequirements: "Miloosh disclosure and rel=sponsored rules apply whenever an affiliate URL is used.",
    geographyRestrictions: UNKNOWN, selfReferralRules: UNKNOWN, inactivityTerminationRules: UNKNOWN,
    brandAssets: UNKNOWN, mediaKit: UNKNOWN, brandGuidelines: UNKNOWN, promotionalMaterials: UNKNOWN,
    supportContact: UNKNOWN, vendorClaims: [], verifiedMarketingFacts: [],
    ...seed,
  };
}

const HANDOFF = "Codex attachment 383c910a-402e-467b-a3bd-ac398c260ef9 (user-supplied status and personalized URLs, 2026-08-19)";
const STATUS_DRAFT = "docs/affiliate-applications.md working-tree evidence supplied 2026-08-19";
const PROGRAM_RESEARCH = "data/revenue/affiliate-programs.ts official-source research";

export const PARTNER_MATERIAL_AUDIT: readonly PartnerMaterialAudit[] = [
  record({ company: "Iconosquare", slug: "iconosquare", readiness: "HOLD / UNCLEAR", evidence: ["No collected file or repository program record located in 2026-08-19 inventory."], lastVerifiedDate: "2026-08-19" }),
  record({ company: "Carepatron", slug: "carepatron", readiness: "HOLD / UNCLEAR", evidence: ["No collected file or repository program record located in 2026-08-19 inventory."], lastVerifiedDate: "2026-08-19" }),
  record({ company: "Ruby", slug: "ruby", readiness: "HOLD / UNCLEAR", evidence: ["No collected file or repository program record located in 2026-08-19 inventory."], lastVerifiedDate: "2026-08-19" }),
  record({ company: "MindStudio", slug: "mindstudio", readiness: "HOLD / UNCLEAR", evidence: ["No collected file or repository program record located in 2026-08-19 inventory."], lastVerifiedDate: "2026-08-19" }),
  record({ company: "Miro", slug: "miro", programNetwork: "PartnerStack", currentStatus: "APPROVED in production affiliate pipeline; not in canonical active registry", applicationStatus: "Approved", approvalStatus: "Approved; tracking URL absent", commission: { type: "qualified_lead", value: "$10-$40 by geography", originalWording: "$10-$40 per corporate email sign-up to free trial, based on GEO" }, recurrence: "one-time", cookieWindow: "30 days", readiness: "APPROVED BUT NEEDS LINK", evidence: [PROGRAM_RESEARCH, "Production affiliate pipeline read by npm run affiliate:audit on 2026-08-19"], lastVerifiedDate: "2026-08-19" }),
  record({ company: "8fig", slug: "8fig", readiness: "HOLD / UNCLEAR", evidence: ["No collected file or repository program record located in 2026-08-19 inventory."], lastVerifiedDate: "2026-08-19" }),
  record({ company: "Pagecloud", slug: "pagecloud", readiness: "HOLD / UNCLEAR", evidence: ["No collected file or repository program record located in 2026-08-19 inventory."], lastVerifiedDate: "2026-08-19" }),
  record({ company: "RocketReach", slug: "rocketreach", readiness: "HOLD / UNCLEAR", evidence: ["No collected file or repository program record located in 2026-08-19 inventory."], lastVerifiedDate: "2026-08-19" }),
  record({ company: "Flatpay", slug: "flatpay", readiness: "HOLD / UNCLEAR", evidence: ["No collected file or repository program record located in 2026-08-19 inventory."], lastVerifiedDate: "2026-08-19" }),
  record({ company: "Hubstaff", slug: "hubstaff", readiness: "HOLD / UNCLEAR", evidence: ["No collected file or repository program record located in 2026-08-19 inventory."], lastVerifiedDate: "2026-08-19" }),
  record({ company: "Closely", slug: "closely", readiness: "HOLD / UNCLEAR", evidence: ["No collected file or repository program record located in 2026-08-19 inventory."], lastVerifiedDate: "2026-08-19" }),
  record({ company: "Pipedrive", slug: "pipedrive", programNetwork: "PartnerStack", currentStatus: "ACTIVE", applicationStatus: "Approved", approvalStatus: "Approved", affiliateUrl: "https://aff.trypipedrive.com/ajtcgyu06e7i", commission: { type: "revenue_share", value: "20% or 30% for first 12 months; custom Power tier", originalWording: "Rising 20%; Growth 30%; Power custom rate, first 12 months" }, recurrence: "recurring for 12 months", payoutThreshold: "$5", geographyRestrictions: "Some exceptions communicated during approval; countries not named", readiness: "READY NOW", evidence: [HANDOFF, PROGRAM_RESEARCH], lastVerifiedDate: "2026-08-19" }),
  record({ company: "GetResponse", slug: "getresponse", programNetwork: "PartnerStack", currentStatus: "ACTIVE", applicationStatus: "Approved", approvalStatus: "Approved", affiliateUrl: "https://try.getresponsetoday.com/5op8zmw94gq1", commission: { type: "recurring_percentage", value: "40%/50%/60% for 12 months by tier", originalWording: "Bronze 40%, Silver 50%, Gold 60% for 12 months" }, recurrence: "recurring for 12 months", cookieWindow: "90 days", payoutThreshold: "$50", qualificationRules: "Existing customer not required; application reviewed", readiness: "READY NOW", evidence: [HANDOFF, PROGRAM_RESEARCH], lastVerifiedDate: "2026-08-19" }),
  record({ company: "Volza", slug: "volza", programNetwork: "PartnerStack", currentStatus: "ACTIVE", applicationStatus: "Approved", approvalStatus: "Approved", affiliateUrl: "https://partner.volza.com/36gtswr72b71", commission: { type: "revenue_share", value: "20%-30%", originalWording: "20-30% revenue share per qualified annual B2B subscription" }, recurrence: "Recorded as one-time in program research", cookieWindow: "90 days", payoutThreshold: "$50", payoutMethod: "PartnerStack: PayPal/direct bank transfer", readiness: "READY NOW", vendorClaims: ["High-ACV global trade/customs intelligence positioning is vendor/program language and not independently verified here."], evidence: [HANDOFF, PROGRAM_RESEARCH], lastVerifiedDate: "2026-08-19" }),
  record({ company: "Todoist", slug: "todoist", programNetwork: "PartnerStack", currentStatus: "ACTIVE", applicationStatus: "Approved", approvalStatus: "Approved", affiliateUrl: "https://get.todoist.io/dobo71f2y038", commission: { type: "hybrid", value: "Up to 25%", originalWording: "Yearly plans up to 25% one-time; monthly plans up to 25% for up to 12 payments" }, recurrence: "hybrid", cookieWindow: "90 days", payoutThreshold: "$25", restrictions: "Only todoist.com purchases qualify; app-store purchases excluded", brandGuidelines: "No Todoist Brand Guidelines file was located; logo/trademark/screenshot rules remain UNKNOWN.", readiness: "READY NOW", evidence: [HANDOFF, PROGRAM_RESEARCH], lastVerifiedDate: "2026-08-19" }),
  ...[
    ["Constant Contact", "constant-contact", "https://join.constantcontact.com/ezj6pum5ei2l"], ["Moosend", "moosend", "https://trymoo.moosend.com/4jis9o5bx8wx"], ["Airtable", "airtable", "https://airtable.partnerlinks.io/b0dz88v48tek"], ["monday.com", "monday", "https://try.monday.com/1p2fpizulcj7"], ["WhatConverts", "whatconverts", "https://partners.whatconverts.com/bmckzlf0vnl8"], ["ElevenLabs", "elevenlabs", "https://try.elevenlabs.io/gkp73pehjgtl"], ["KrispCall", "krispcall", "https://try.krispcall.com/aikpbrrrl8k9"],
  ].map(([company, slug, affiliateUrl]) => record({ company: company!, slug: slug!, programNetwork: "PartnerStack", currentStatus: "ACTIVE", applicationStatus: "Approved", approvalStatus: "Approved", affiliateUrl: affiliateUrl!, readiness: "READY NOW", evidence: [HANDOFF, "data/affiliate/active-partners.ts"], lastVerifiedDate: "2026-08-19" })),
  record({ company: "Brevo", slug: "brevo", programNetwork: "PartnerStack", currentStatus: "ACTIVE", applicationStatus: "Approved", approvalStatus: "Approved", affiliateUrl: UNKNOWN, readiness: "APPROVED BUT NEEDS LINK", evidence: [HANDOFF, "data/affiliate/active-partners.ts"], lastVerifiedDate: "2026-08-19" }),
  ...[["FreshBooks", "freshbooks"], ["ActiveCampaign", "activecampaign"], ["Close", "close"], ["ClickUp", "clickup"], ["Kit", "kit"], ["Wrike", "wrike"], ["Zendesk", "zendesk"]].map(([company, slug]) => record({ company: company!, slug: slug!, programNetwork: "PartnerStack", currentStatus: "PENDING", applicationStatus: "Under review", approvalStatus: "Not approved", readiness: "PENDING APPROVAL", evidence: [STATUS_DRAFT], lastVerifiedDate: "2026-08-19" })),
  ...[["HubSpot", "hubspot"], ["n8n", "n8n"]].map(([company, slug]) => record({ company: company!, slug: slug!, currentStatus: "REJECTED", applicationStatus: "Rejected", approvalStatus: "Rejected", readiness: "REJECTED", evidence: [STATUS_DRAFT], lastVerifiedDate: "2026-08-19" })),
  record({ company: "Shopify", slug: "shopify", programNetwork: "Impact", currentStatus: "ACTIVE", applicationStatus: "Approved", approvalStatus: "Approved", affiliateUrl: "https://shopify.pxf.io/L0EG9O", readiness: "READY NOW", evidence: [STATUS_DRAFT, "data/software/shopify.json"], lastVerifiedDate: "2026-08-19" }),
  record({ company: "Wix", slug: "wix", programNetwork: "Impact", currentStatus: "ACTIVE", applicationStatus: "Approved", approvalStatus: "Approved", affiliateUrl: "https://wix.pxf.io/c/7623171/2096727/25616", readiness: "READY NOW", evidence: [STATUS_DRAFT, "data/software/wix.json"], lastVerifiedDate: "2026-08-19" }),
] as const;
