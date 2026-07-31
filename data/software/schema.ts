import { z } from "zod";

const slugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug must be lowercase, alphanumeric, and hyphen-separated");

export const alternativeRawSchema = z.object({
  name: z.string().min(1),
  slug: slugSchema,
  description: z.string().min(1),
  best_for: z.string().min(1),
  strengths: z.array(z.string().min(1)).min(1),
});

export const pricingRawSchema = z.object({
  model: z.enum(["free", "freemium", "paid", "open_source", "unknown"]).optional(),
  starting_price: z.string().min(1).optional(),
  has_free_tier: z.boolean().optional(),
});

export const faqItemRawSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

export const softwareRawSchema = z.object({
  name: z.string().min(1),
  slug: slugSchema,
  category: z.string().min(1),
  description: z.string().min(1),
  website: z.string().url().optional(),
  logo: z.string().min(1).optional(),
  founded: z.number().int().min(1900).max(2100).optional(),
  company: z.string().min(1).optional(),
  pricing: pricingRawSchema.optional(),
  platforms: z.array(z.string().min(1)).optional(),
  best_for: z.string().min(1).optional(),
  pros: z.array(z.string().min(1)).optional(),
  cons: z.array(z.string().min(1)).optional(),
  features: z.array(z.string().min(1)).optional(),
  alternatives: z.array(alternativeRawSchema).min(1),
  faq: z.array(faqItemRawSchema).optional(),
  tags: z.array(z.string().min(1)).optional(),
  order: z.number().int().optional(),
});

export type AlternativeRaw = z.infer<typeof alternativeRawSchema>;
export type PricingRaw = z.infer<typeof pricingRawSchema>;
export type FaqItemRaw = z.infer<typeof faqItemRawSchema>;
export type SoftwareRaw = z.infer<typeof softwareRawSchema>;
