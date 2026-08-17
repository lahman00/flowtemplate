import { z } from "zod";
import fs from "node:fs";
import path from "node:path";

/**
 * Facebook Groups acquisition research — persisted so the 2026-08-17
 * deep-audit work (owner-collected candidate names, independently
 * verified against live Facebook by Claude) is never repeated. This is
 * a research/ops artifact edited by scripts, not runtime config read by
 * any deployed request path — no group is ever auto-posted to.
 */

export const GROUP_CLUSTERS = ["ai_automation", "saas_founders_buyers", "software_buyers_tech", "productivity_workflow", "small_business"] as const;
export const VERIFICATION_LEVELS = ["VERIFIED", "PARTIALLY_VERIFIED", "UNKNOWN"] as const;
export const GROUP_TIERS = ["S", "A", "B", "REJECT", "UNSCORED"] as const;
export const LINK_POLICIES = ["LINK_FRIENDLY", "CONTEXTUAL_LINKS_ONLY", "PROMO_THREAD_ONLY", "VALUE_ONLY", "UNKNOWN_RULES", "DO_NOT_POST"] as const;
export const MEMBERSHIP_STATES = ["NOT_JOINED", "REQUESTED", "MEMBER", "NEEDS_EYAL_INPUT", "REJECTED_BY_GROUP", "DO_NOT_JOIN"] as const;
export const TRI_STATE = ["YES", "NO", "UNKNOWN"] as const;
export const POLICY_STATE = ["YES", "NO", "RESTRICTED", "UNKNOWN"] as const;
export const LEVEL_STATE = ["LOW", "MEDIUM", "HIGH", "UNKNOWN"] as const;
export const SKEW_STATE = ["MOSTLY_BUYERS", "MIXED", "MOSTLY_SELLERS", "UNKNOWN"] as const;

export const groupScoreSchema = z.object({
  audienceFit: z.number().min(0).max(25),
  buyingIntent: z.number().min(0).max(20),
  engagementQuality: z.number().min(0).max(15),
  distributionOpportunity: z.number().min(0).max(15),
  contentFit: z.number().min(0).max(10),
  promotionViability: z.number().min(0).max(10),
  geoLanguageFit: z.number().min(0).max(5),
  penalties: z.number().max(0).default(0),
  penaltyReasons: z.array(z.string()).default([]),
  total: z.number(),
});
export type GroupScore = z.infer<typeof groupScoreSchema>;

export const facebookGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().nullable(),
  cluster: z.enum(GROUP_CLUSTERS),
  privacy: z.enum(["PUBLIC", "PRIVATE", "UNKNOWN"]).default("UNKNOWN"),
  memberCount: z.number().nullable().default(null),
  postsPerDayApprox: z.number().nullable().default(null),
  description: z.string().nullable().default(null),
  rules: z.array(z.string()).default([]),
  ruleEvidence: z.string().nullable().default(null),
  adminGuidance: z.string().nullable().default(null),
  linkPolicy: z.enum(LINK_POLICIES).default("UNKNOWN_RULES"),
  externalLinksAllowed: z.enum(POLICY_STATE).default("UNKNOWN"),
  selfPromotionAllowed: z.enum(POLICY_STATE).default("UNKNOWN"),
  affiliateLinksProhibited: z.enum(TRI_STATE).default("UNKNOWN"),
  promoRestrictedToThreadsOrDays: z.string().nullable().default(null),
  adminApprovalRequired: z.enum(TRI_STATE).default("UNKNOWN"),
  spamRatio: z.enum(LEVEL_STATE).default("UNKNOWN"),
  recurringSoftwareQuestions: z.enum(TRI_STATE).default("UNKNOWN"),
  discussionDepth: z.enum(LEVEL_STATE).default("UNKNOWN"),
  audienceBuyerLikelihood: z.enum(LEVEL_STATE).default("UNKNOWN"),
  sellerVsBuyerSkew: z.enum(SKEW_STATE).default("UNKNOWN"),
  aiSpamOverrun: z.enum(TRI_STATE).default("UNKNOWN"),
  postsInspected: z.number().int().min(0).default(0),
  score: groupScoreSchema.nullable().default(null),
  tier: z.enum(GROUP_TIERS).default("UNSCORED"),
  verification: z.enum(VERIFICATION_LEVELS).default("UNKNOWN"),
  dateChecked: z.string().nullable().default(null),
  membershipState: z.enum(MEMBERSHIP_STATES).default("NOT_JOINED"),
  lastPost: z.string().nullable().default(null),
  nextEligiblePost: z.string().nullable().default(null),
  bestMilooshContentMatches: z.array(z.string()).default([]),
  contentOpportunity: z.string().nullable().default(null),
  notes: z.string().nullable().default(null),
  rejectionReason: z.string().nullable().default(null),
  sourceSeed: z.boolean().default(true),
});
export type FacebookGroup = z.infer<typeof facebookGroupSchema>;

const fileSchema = z.object({
  version: z.number().int().positive(),
  lastUpdated: z.string(),
  groups: z.array(facebookGroupSchema),
});
export type GroupsFile = z.infer<typeof fileSchema>;

const DATA_PATH = path.join(process.cwd(), "data", "social", "facebook-groups.json");

export function readGroups(): FacebookGroup[] {
  const raw = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  const parsed = fileSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`).join("\n");
    throw new Error(`Invalid data/social/facebook-groups.json:\n${issues}`);
  }
  return parsed.data.groups;
}

export function writeGroups(groups: FacebookGroup[]): void {
  const file: GroupsFile = { version: 1, lastUpdated: new Date().toISOString(), groups: [...groups].sort((a, b) => a.id.localeCompare(b.id)) };
  fs.writeFileSync(DATA_PATH, JSON.stringify(file, null, 2) + "\n", "utf-8");
}

export function slugifyGroupName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
