import { z } from "zod";
import { CHANNELS, CONTENT_PILLARS } from "@/lib/social/types";
import strategyJson from "@/data/social/social-strategy.json";

const channelBooleanMapSchema = z.object(Object.fromEntries(CHANNELS.map((c) => [c, z.boolean()])) as Record<(typeof CHANNELS)[number], z.ZodBoolean>);
const channelNumberMapSchema = z.object(Object.fromEntries(CHANNELS.map((c) => [c, z.number().int().min(0)])) as Record<(typeof CHANNELS)[number], z.ZodNumber>);
const pillarWeightMapSchema = z.object(Object.fromEntries(CONTENT_PILLARS.map((p) => [p, z.number().min(0)])) as Record<(typeof CONTENT_PILLARS)[number], z.ZodNumber>);

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
