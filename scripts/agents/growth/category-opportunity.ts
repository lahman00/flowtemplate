import { getAllSoftware } from "@/data/software";
import { getAllCategories } from "@/data/categories";
import { makeFinding } from "@/lib/agents/finding";
import type { AgentRunFn } from "@/types/agents";

/**
 * Deterministic frequency analysis over the `tags` field already stored
 * per software entry — no invented taxonomy. If a tag shows up on enough
 * products (across more than one existing category, so it's cross-cutting
 * rather than already implied by one category) and doesn't already match
 * an existing category's slug/name, it's a real, data-backed signal that
 * a dedicated category page might be worth creating.
 */

const MIN_TAG_FREQUENCY = 8;

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const run: AgentRunFn = async () => {
  const agentId = "growth-category-opportunity";
  const software = getAllSoftware();
  const categories = getAllCategories();
  const existingCategoryKeys = new Set(categories.flatMap((c) => [normalize(c.slug), normalize(c.name)]));

  const tagOccurrences = new Map<string, { slugs: string[]; categories: Set<string> }>();
  for (const s of software) {
    for (const rawTag of s.tags ?? []) {
      const key = normalize(rawTag);
      if (!key || existingCategoryKeys.has(key)) continue;
      const entry = tagOccurrences.get(key) ?? { slugs: [], categories: new Set<string>() };
      entry.slugs.push(s.slug);
      entry.categories.add(s.category);
      tagOccurrences.set(key, entry);
    }
  }

  const findings = [];
  for (const [tag, entry] of tagOccurrences) {
    if (entry.slugs.length < MIN_TAG_FREQUENCY || entry.categories.size < 2) continue;

    findings.push(
      makeFinding({
        agentId,
        kind: "opportunity",
        severity: "info",
        title: `Cross-cutting tag cluster: "${tag}" (${entry.slugs.length} products)`,
        description: `The tag "${tag}" appears on ${entry.slugs.length} products spanning ${entry.categories.size} different existing categories (${Array.from(entry.categories).join(", ")}), and doesn't match any current category. This is a real, data-backed cluster — not necessarily a new /category page (that's a product decision, e.g. it could instead become a filter or a themed roundup), but worth a human look.`,
        location: null,
        evidence: entry.slugs.slice(0, 10).map((s) => `/software/${s}`),
        confidence: 0.7,
        riskLevel: 3,
        recommendedAction: `Review whether "${tag}" deserves a dedicated category, a cross-category filter, or a "best X for ${tag}" roundup.`,
        dedupeKey: `${agentId}:${tag}`,
      })
    );
  }

  return {
    summary: `Scanned tags across ${software.length} products for cross-category clusters of ${MIN_TAG_FREQUENCY}+ products not matching an existing category. ${findings.length} finding(s).`,
    findings,
  };
};
