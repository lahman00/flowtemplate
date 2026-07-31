import type { Software } from "@/data/software";
import { getAllSoftware, getSoftware } from "@/data/software";
import { getCategoryName } from "@/data/categories";

/**
 * Reusable engine for a future /compare/[softwareA]-vs-[softwareB] route.
 * Deliberately not wired into any page or route yet — this is architecture,
 * not a feature (see docs/comparison-engine.md).
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
  rows: ComparisonRow[];
  keyDifferences: string[];
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

export function generateComparisonMetaDescription(
  softwareA: Software,
  softwareB: Software
): string {
  return `Compare ${softwareA.name} and ${softwareB.name} side by side — category, core strengths, and which one fits your workflow.`;
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
    rows: generateComparisonRows(softwareA, softwareB),
    keyDifferences: generateKeyDifferences(softwareA, softwareB),
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
