import type { Software } from "@/data/software";

/**
 * Prepares reusable content/data generators for a future /compare/a-vs-b
 * route. Deliberately not wired into any page or route yet — this is
 * architecture, not a feature.
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
};

export function generateComparisonSlug(softwareA: Software, softwareB: Software): string {
  return `${softwareA.slug}-vs-${softwareB.slug}`;
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
    { label: "Category", a: softwareA.category, b: softwareB.category },
    {
      label: "Alternatives tracked",
      a: String(softwareA.alternatives.length),
      b: String(softwareB.alternatives.length),
    },
  ];

  if (softwareA.pricing?.model || softwareB.pricing?.model) {
    rows.push({
      label: "Pricing model",
      a: softwareA.pricing?.model ?? "Not yet documented",
      b: softwareB.pricing?.model ?? "Not yet documented",
    });
  }

  if (softwareA.platforms || softwareB.platforms) {
    rows.push({
      label: "Platforms",
      a: formatList(softwareA.platforms),
      b: formatList(softwareB.platforms),
    });
  }

  return rows;
}

export function generateComparisonData(softwareA: Software, softwareB: Software): ComparisonData {
  return {
    softwareA,
    softwareB,
    title: generateComparisonTitle(softwareA, softwareB),
    metaDescription: generateComparisonMetaDescription(softwareA, softwareB),
    rows: generateComparisonRows(softwareA, softwareB),
  };
}
