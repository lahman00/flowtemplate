import { z } from "zod";
import { CHANNELS, CONTENT_PILLARS } from "@/lib/social/types";
import strategyJson from "@/data/social/social-strategy.json";

const channelBooleanMapSchema = z.object(Object.fromEntries(CHANNELS.map((c) => [c, z.boolean()])) as Record<(typeof CHANNELS)[number], z.ZodBoolean>);
const channelNumberMapSchema = z.object(Object.fromEntries(CHANNELS.map((c) => [c, z.number().int().min(0)])) as Record<(typeof CHANNELS)[number], z.ZodNumber>);
const pillarWeightMapSchema = z.object(Object.fromEntries(CONTENT_PILLARS.map((p) => [p, z.number().min(0)])) as Record<(typeof CONTENT_PILLARS)[number], z.ZodNumber>);

/**
 * 2026-08-17 Facebook production launch — a deterministic, dated cadence
 * ramp (never "random execution timing"): phase1 covers the first
 * phase1Days from launchStartDate at phase1PostsPerWeek, then phase2
 * applies indefinitely at phase2PostsPerWeek. Optional per channel —
 * absent for a channel means no ramp, just the flat `cadence` number.
 */
const launchPlanSchema = z.object({
  launchStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD"),
  phase1Days: z.number().int().positive(),
  phase1PostsPerWeek: z.number().int().min(0),
  phase2PostsPerWeek: z.number().int().min(0),
});
export type LaunchPlan = z.infer<typeof launchPlanSchema>;

const socialStrategySchema = z.object({
  paused: z.boolean(),
  language: z.string().min(2),
  timezone: z.string().min(1),
  tagline: z.string().min(1),
  enabledChannels: channelBooleanMapSchema,
  cadence: channelNumberMapSchema,
  pillarWeights: pillarWeightMapSchema,
  blockedTopics: z.array(z.string()),
  campaignPriorities: z.array(z.string()),
  ctaPolicy: z.object({
    defaultCta: z.string().min(1),
    affiliateCtaSuffix: z.string().min(1),
  }),
  affiliateDisclosurePolicy: z.object({
    required: z.boolean(),
    text: z.string().min(1),
    shortText: z.string().min(1),
  }),
  quietPeriods: z.array(z.object({ start: z.string(), end: z.string(), reason: z.string() })),
  imageRequirements: z.object({
    requireAltText: z.boolean(),
    squareMinDimension: z.number().int().positive(),
    landscapeWidth: z.number().int().positive(),
    landscapeHeight: z.number().int().positive(),
  }),
  topicRepeatCooldownDays: z.number().int().positive(),
  /** Keyed by channel name. See launchPlanSchema. Default {} — most channels have no ramp. */
  launchPlans: z.record(z.string(), launchPlanSchema).default({}),
  /** Keyed by channel name — pillars excluded from that channel's automation until separately approved (e.g. "commercial" posts blocked from Facebook pending a content-quality fix). Default {}. */
  excludedPillarsByChannel: z.record(z.string(), z.array(z.enum(CONTENT_PILLARS))).default({}),
});

export type SocialStrategy = z.infer<typeof socialStrategySchema>;

/**
 * Validated once at module load — a malformed social-strategy.json fails
 * loudly at build/import time, same discipline as data/software/index.ts
 * failing the build on invalid catalog JSON, rather than surfacing as a
 * confusing runtime error deep inside the content engine.
 */
function loadStrategy(): SocialStrategy {
  const result = socialStrategySchema.safeParse(strategyJson);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`).join("\n");
    throw new Error(`Invalid data/social/social-strategy.json:\n${issues}`);
  }
  return result.data;
}

let cached: SocialStrategy | null = null;

/** The one place strategy config is read — ChatGPT-as-strategist or the owner edits data/social/social-strategy.json; every other module calls this instead of importing the JSON directly. */
export function getSocialStrategy(): SocialStrategy {
  if (!cached) cached = loadStrategy();
  return cached;
}

/**
 * Resolves a channel's current target cadence: if it has a launchPlan,
 * returns phase1 or phase2's postsPerWeek depending on how many days
 * have elapsed since launchStartDate (deterministic — driven by the
 * calendar date, never by execution timing); otherwise falls back to the
 * flat `cadence` number.
 */
export function getEffectiveCadence(strategy: SocialStrategy, channel: (typeof CHANNELS)[number], now: Date = new Date()): number {
  const plan = strategy.launchPlans[channel];
  if (!plan) return strategy.cadence[channel];
  const daysSinceLaunch = Math.floor((now.getTime() - new Date(plan.launchStartDate + "T00:00:00.000Z").getTime()) / (24 * 60 * 60 * 1000));
  if (daysSinceLaunch < 0) return 0; // launch date is in the future — nothing yet
  return daysSinceLaunch < plan.phase1Days ? plan.phase1PostsPerWeek : plan.phase2PostsPerWeek;
}
