import fs from "node:fs";
import path from "node:path";
import { softwareRawSchema, type SoftwareRaw } from "@/data/software/schema";
import { mapSoftware } from "@/data/software/mapper";
import type { Software } from "@/data/software/types";
import { getAllCategories } from "@/data/categories";

export type { Software, Alternative, Pricing, FaqItem } from "@/data/software/types";

const SOFTWARE_DIR = path.join(process.cwd(), "data", "software");

function formatZodIssues(issues: { path: PropertyKey[]; message: string }[]): string {
  return issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
}

function loadRawEntries(): SoftwareRaw[] {
  const files = fs.readdirSync(SOFTWARE_DIR).filter((file) => file.endsWith(".json"));

  return files.map((file) => {
    const fullPath = path.join(SOFTWARE_DIR, file);
    const contents = fs.readFileSync(fullPath, "utf-8");

    let json: unknown;
    try {
      json = JSON.parse(contents);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid software data in ${file}: not valid JSON (${message})`);
    }

    const result = softwareRawSchema.safeParse(json);

    if (!result.success) {
      throw new Error(
        `Invalid software data in ${file}:\n${formatZodIssues(result.error.issues)}`
      );
    }

    const expectedSlug = path.basename(file, ".json");
    if (result.data.slug !== expectedSlug) {
      throw new Error(
        `Invalid software data in ${file}: slug "${result.data.slug}" does not match filename "${expectedSlug}.json"`
      );
    }

    return result.data;
  });
}

function loadAllSoftware(): Software[] {
  const rawEntries = loadRawEntries().sort((a, b) => {
    const orderA = a.order ?? Number.POSITIVE_INFINITY;
    const orderB = b.order ?? Number.POSITIVE_INFINITY;
    if (orderA !== orderB) return orderA - orderB;
    return a.slug.localeCompare(b.slug);
  });

  const entries = rawEntries.map(mapSoftware);
  const knownSlugs = new Set(entries.map((entry) => entry.slug));
  const knownCategorySlugs = new Set(getAllCategories().map((category) => category.slug));

  for (const entry of entries) {
    for (const alternative of entry.alternatives) {
      if (!knownSlugs.has(alternative.slug)) {
        throw new Error(
          `Invalid software data in ${entry.slug}.json: alternative "${alternative.slug}" has no matching software file in data/software/`
        );
      }
    }

    if (!knownCategorySlugs.has(entry.category)) {
      throw new Error(
        `Invalid software data in ${entry.slug}.json: category "${entry.category}" is not a known category slug (see data/categories.json)`
      );
    }
  }

  return entries;
}

let cache: Software[] | null = null;

function getAll(): Software[] {
  if (!cache) {
    cache = loadAllSoftware();
  }
  return cache;
}

export function getAllSoftware(): Software[] {
  return getAll();
}

export function getSoftware(slug: string): Software | undefined {
  return getAll().find((software) => software.slug === slug);
}
