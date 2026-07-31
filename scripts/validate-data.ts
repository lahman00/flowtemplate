import { getAllSoftware } from "@/data/software";
import { getAllCategories } from "@/data/categories";

type Problem = {
  scope: string;
  message: string;
};

function main() {
  const problems: Problem[] = [];
  let categories: ReturnType<typeof getAllCategories> = [];
  let software: ReturnType<typeof getAllSoftware> = [];

  // Loading data/categories and data/software already runs full Zod
  // validation, filename/slug matching, and cross-reference checks
  // (alternatives -> real software, category -> real category). If either
  // throws, that IS the validation failure — report it and stop, since
  // nothing downstream can be trusted.
  try {
    categories = getAllCategories();
  } catch (error) {
    problems.push({
      scope: "categories",
      message: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    software = getAllSoftware();
  } catch (error) {
    problems.push({
      scope: "software",
      message: error instanceof Error ? error.message : String(error),
    });
  }

  if (problems.length > 0) {
    report(problems, 0, 0);
    process.exit(1);
  }

  // Everything below is a second, independent pass over the successfully
  // loaded data — checks the loaders don't already make structurally
  // impossible, plus explicit named checks Phase 7 asks for.

  // Duplicate slugs (defense in depth: the loader's filename===slug rule
  // already makes this structurally impossible today, but check anyway).
  const slugCounts = new Map<string, number>();
  for (const item of software) {
    slugCounts.set(item.slug, (slugCounts.get(item.slug) ?? 0) + 1);
  }
  for (const [slug, count] of slugCounts) {
    if (count > 1) {
      problems.push({ scope: "software", message: `Duplicate slug "${slug}" appears ${count} times.` });
    }
  }

  const categorySlugCounts = new Map<string, number>();
  for (const category of categories) {
    categorySlugCounts.set(category.slug, (categorySlugCounts.get(category.slug) ?? 0) + 1);
  }
  for (const [slug, count] of categorySlugCounts) {
    if (count > 1) {
      problems.push({ scope: "categories", message: `Duplicate category slug "${slug}" appears ${count} times.` });
    }
  }

  // Missing fields the schema allows as optional but this project treats as
  // effectively required in practice.
  for (const item of software) {
    if (!item.sources || item.sources.length === 0) {
      problems.push({ scope: item.slug, message: "Missing at least one official source." });
    }
    if (!item.features || item.features.length === 0) {
      problems.push({ scope: item.slug, message: "Missing at least one feature." });
    }
  }

  // Broken references (redundant with the loader, kept explicit per Phase 7).
  const knownSlugs = new Set(software.map((item) => item.slug));
  for (const item of software) {
    for (const alternative of item.alternatives) {
      if (!knownSlugs.has(alternative.slug)) {
        problems.push({
          scope: item.slug,
          message: `Alternative "${alternative.slug}" has no matching software file.`,
        });
      }
    }
  }

  // Invalid categories (redundant with the loader, kept explicit per Phase 7).
  const knownCategorySlugs = new Set(categories.map((category) => category.slug));
  for (const item of software) {
    if (!knownCategorySlugs.has(item.category)) {
      problems.push({
        scope: item.slug,
        message: `Category "${item.category}" is not a known category slug.`,
      });
    }
  }

  // Orphan pages: a category with zero software would be a real,
  // discoverable dead end at /category/[slug].
  for (const category of categories) {
    const count = software.filter((item) => item.category === category.slug).length;
    if (count === 0) {
      problems.push({ scope: category.slug, message: "Category has zero software entries (orphan page)." });
    }
  }

  report(problems, software.length, categories.length);
  process.exit(problems.length > 0 ? 1 : 0);
}

function report(problems: Problem[], softwareCount: number, categoryCount: number) {
  if (problems.length === 0) {
    console.log(`✓ Data valid — ${softwareCount} software pages, ${categoryCount} categories, 0 problems.`);
    return;
  }

  console.error(`✗ Data validation failed — ${problems.length} problem(s):\n`);
  for (const problem of problems) {
    console.error(`  [${problem.scope}] ${problem.message}`);
  }
}

main();
