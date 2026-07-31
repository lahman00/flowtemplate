import fs from "node:fs";
import path from "node:path";
import { categoriesRawSchema } from "@/data/categories/schema";

export type Category = {
  slug: string;
  name: string;
  description: string;
};

const CATEGORIES_FILE = path.join(process.cwd(), "data", "categories", "categories.json");

function loadCategories(): Category[] {
  const contents = fs.readFileSync(CATEGORIES_FILE, "utf-8");

  let json: unknown;
  try {
    json = JSON.parse(contents);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid categories data: not valid JSON (${message})`);
  }

  const result = categoriesRawSchema.safeParse(json);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid categories data:\n${issues}`);
  }

  const seenSlugs = new Set<string>();
  for (const category of result.data) {
    if (seenSlugs.has(category.slug)) {
      throw new Error(`Invalid categories data: duplicate category slug "${category.slug}"`);
    }
    seenSlugs.add(category.slug);
  }

  return result.data;
}

let cache: Category[] | null = null;

function getAll(): Category[] {
  if (!cache) {
    cache = loadCategories();
  }
  return cache;
}

export function getAllCategories(): Category[] {
  return getAll();
}

export function getCategory(slug: string): Category | undefined {
  return getAll().find((category) => category.slug === slug);
}

/** Display name for a category slug, falling back to the slug itself if unresolved. */
export function getCategoryName(slug: string): string {
  return getCategory(slug)?.name ?? slug;
}
