import type { Software } from "@/data/software";
import { getAllSoftware, getSoftware } from "@/data/software";
import { getCategoryName } from "@/data/categories";
import { META_DESCRIPTION_MAX_LENGTH, truncateAtWord } from "@/lib/generators";

/**
 * Comparison engine backing /compare/[comparison] (Sprint 7). Built in
 * Sprint 3/4/6 ahead of routing; see docs/comparison-engine.md for the
 * curated-pairs policy (data/comparisons.ts) that decides which pairs
 * actually get a page.
 */

export type ComparisonRow = {
  label: string;
  a: string;
  b: string;
};

export type ComparisonData = {
  softwareA: Software;
  softwareB: Software;
  title: string;
  metaDescription: string;
  intro: string;
  rows: ComparisonRow[];
  keyDifferences: string[];
  whoShouldChooseA: string;
  whoShouldChooseB: string;
};

export function generateComparisonSlug(softwareA: Software, softwareB: Software): string {
  return `${softwareA.slug}-vs-${softwareB.slug}`;
}

/**
 * Splits a "/compare/[pair]" URL segment like "cal-com-vs-calendly" back
 * into two known software slugs. Tries every "-vs-" occurrence rather than
 * just the first, since slugs themselves can contain hyphens
 * (e.g. "microsoft-teams", "cal-com").
 */
export function parseComparisonSlug(pairSlug: string): { slugA: string; slugB: string } | null {
  const knownSlugs = new Set(getAllSoftware().map((software) => software.slug));
  const marker = "-vs-";
  let searchStart = 0;

  while (true) {
    const index = pairSlug.indexOf(marker, searchStart);
    if (index === -1) {
      return null;
    }

    const slugA = pairSlug.slice(0, index);
    const slugB = pairSlug.slice(index + marker.length);

    if (knownSlugs.has(slugA) && knownSlugs.has(slugB)) {
      return { slugA, slugB };
    }

    searchStart = index + 1;
  }
}

export function generateComparisonTitle(softwareA: Software, softwareB: Software): string {
  return `${softwareA.name} vs ${softwareB.name}`;
}

/**
 * Sprint 20 Phase 6 — grounded in each pair's real category data so 1,100+
 * comparison pages don't all share one boilerplate sentence differing only
 * by name (a real duplicate-intent/thin-snippet risk at that volume).
 * Avoids "a/an" agreement entirely by parenthesizing category names rather
 * than splicing them into a sentence.
 */
export function generateComparisonMetaDescription(
  softwareA: Software,
  softwareB: Software
): string {
  const categoryA = getCategoryName(softwareA.category);
  const categoryB = getCategoryName(softwareB.category);

  const full =
    categoryA === categoryB
      ? `${softwareA.name} and ${softwareB.name}, compared: real ${lowercaseForSentence(categoryA)} features and platforms from each vendor's own site.`
      : `${softwareA.name} (${categoryA}) vs ${softwareB.name} (${categoryB}) — real features and platforms, sourced from each vendor's own site.`;

  return truncateAtWord(full, META_DESCRIPTION_MAX_LENGTH);
}

/** Lowercases a category name for mid-sentence use, without mangling acronyms like "CRM". */
function lowercaseForSentence(name: string): string {
  return name === name.toUpperCase() ? name : name.toLowerCase();
}

/** Factual, grounded intro — states what's being compared and why, nothing evaluative. */
export function generateComparisonIntro(softwareA: Software, softwareB: Software): string {
  const categoryA = getCategoryName(softwareA.category);
  const categoryB = getCategoryName(softwareB.category);
  const categoryPhrase =
    categoryA === categoryB
      ? lowercaseForSentence(categoryA)
      : `tools people compare when choosing between ${lowercaseForSentence(categoryA)} and ${lowercaseForSentence(categoryB)}`;

  return `${softwareA.name} and ${softwareB.name} are both ${categoryPhrase} options. Here's how they compare on official platforms, features, and positioning — sourced from each vendor's own site, not from ratings or reviews.`;
}

/**
 * "Pros" reuses each product's own stated features — real, sourced
 * capabilities, not editorial praise. There is no "cons" generator: this
 * dataset deliberately doesn't store unverified weaknesses (see
 * docs/content-engine.md), so instead of inventing them, every comparison
 * page shows an honest disclosure in place of a cons list.
 */
export function generateProsList(software: Software): string[] {
  return software.features;
}

export const CONS_DISCLOSURE =
  "We don't publish a \"cons\" list for either product. No vendor's official site documents its own product's weaknesses, so there's no sourced basis for one — and we'd rather say that plainly than invent one.";

/**
 * Grounded in the vendor's own stated positioning (best_for) — never an
 * independent editorial judgment. Presents best_for verbatim rather than
 * splicing it into a lowercase continuation: some entries' best_for text
 * starts with the product's own name (e.g. "HubSpot positions..."), and a
 * naive first-letter lowercase turns that into a broken word ("hubSpot").
 */
export function generateWhoShouldChoose(software: Software): string {
  return `Choose ${software.name} if this fits: ${software.bestFor}`;
}

function formatList(values: string[] | undefined): string {
  return values && values.length > 0 ? values.join(", ") : "Not yet documented";
}

export function generateComparisonRows(softwareA: Software, softwareB: Software): ComparisonRow[] {
  const rows: ComparisonRow[] = [
    {
      label: "Category",
      a: getCategoryName(softwareA.category),
      b: getCategoryName(softwareB.category),
    },
    {
      label: "Alternatives tracked",
      a: String(softwareA.alternatives.length),
      b: String(softwareB.alternatives.length),
    },
    {
      label: "Platforms",
      a: formatList(softwareA.platforms),
      b: formatList(softwareB.platforms),
    },
  ];

  if (softwareA.pricing?.model || softwareB.pricing?.model) {
    rows.push({
      label: "Pricing model",
      a: softwareA.pricing?.model ?? "Not yet documented",
      b: softwareB.pricing?.model ?? "Not yet documented",
    });
  }

  return rows;
}

/**
 * Plain-language differences grounded only in fields both entries actually
 * have — a set difference on stated features/platforms, not an editorial
 * judgment about which product is "better."
 */
export function generateKeyDifferences(softwareA: Software, softwareB: Software): string[] {
  const differences: string[] = [];

  if (softwareA.category !== softwareB.category) {
    differences.push(
      `${softwareA.name} is categorized under ${getCategoryName(softwareA.category)}, while ${softwareB.name} is categorized under ${getCategoryName(softwareB.category)}.`
    );
  }

  const featuresOnlyInA = softwareA.features.filter((f) => !softwareB.features.includes(f));
  const featuresOnlyInB = softwareB.features.filter((f) => !softwareA.features.includes(f));

  if (featuresOnlyInA.length > 0) {
    differences.push(`${softwareA.name} lists ${formatList(featuresOnlyInA)} that ${softwareB.name} doesn't list.`);
  }
  if (featuresOnlyInB.length > 0) {
    differences.push(`${softwareB.name} lists ${formatList(featuresOnlyInB)} that ${softwareA.name} doesn't list.`);
  }

  const platformsA = new Set(softwareA.platforms ?? []);
  const platformsB = new Set(softwareB.platforms ?? []);
  const platformsOnlyInA = [...platformsA].filter((p) => !platformsB.has(p));
  const platformsOnlyInB = [...platformsB].filter((p) => !platformsA.has(p));

  if (platformsOnlyInA.length > 0) {
    differences.push(`${softwareA.name} supports ${formatList(platformsOnlyInA)}, which ${softwareB.name} doesn't list.`);
  }
  if (platformsOnlyInB.length > 0) {
    differences.push(`${softwareB.name} supports ${formatList(platformsOnlyInB)}, which ${softwareA.name} doesn't list.`);
  }

  return differences;
}

export function generateComparisonData(softwareA: Software, softwareB: Software): ComparisonData {
  return {
    softwareA,
    softwareB,
    title: generateComparisonTitle(softwareA, softwareB),
    metaDescription: generateComparisonMetaDescription(softwareA, softwareB),
    intro: generateComparisonIntro(softwareA, softwareB),
    rows: generateComparisonRows(softwareA, softwareB),
    keyDifferences: generateKeyDifferences(softwareA, softwareB),
    whoShouldChooseA: generateWhoShouldChoose(softwareA),
    whoShouldChooseB: generateWhoShouldChoose(softwareB),
  };
}

/** Full engine entry point: resolves a "/compare/[pair]" URL segment straight to ComparisonData, or null if either side is unknown. */
export function getComparisonBySlug(pairSlug: string): ComparisonData | null {
  const parsed = parseComparisonSlug(pairSlug);
  if (!parsed) {
    return null;
  }

  const softwareA = getSoftware(parsed.slugA);
  const softwareB = getSoftware(parsed.slugB);

  if (!softwareA || !softwareB) {
    return null;
  }

  return generateComparisonData(softwareA, softwareB);
}
