import { z } from "zod";

const slugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug must be lowercase, alphanumeric, and hyphen-separated");

export const categoryRawSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1),
  description: z.string().min(1),
});

export const categoriesRawSchema = z.array(categoryRawSchema);

export type CategoryRaw = z.infer<typeof categoryRawSchema>;
