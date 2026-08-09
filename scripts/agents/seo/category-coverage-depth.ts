import { getAllSoftware } from "@/data/software";
import { getAllCategories } from "@/data/categories";
import { makeFinding } from "@/lib/agents/finding";
import type { AgentRunFn } from "@/types/agents";

/**
 * scripts/validate-data.ts already fails the build on a true orphan
 * category (0 software entries) — a correctness bug. This agent covers a
 * different, softer question that validate-data intentionally doesn't:
 * "indexable but thin" categories (1-3 entries), which aren't broken but
 * are weak /category/[slug] pages unlikely to rank or convert well. Not a
 * duplicate of validate-data's check — that's a build-time invariant,
 * this is a content-depth opportunity signal.
 */

const THIN_THRESHOLD = 3;

export const run: AgentRunFn = async () => {
  const agentId = "seo-category-coverage-depth";
  const software = getAllSoftware();
  const categories = getAllCategories();

  const countByCategory = new Map<string, number>();
  for (const s of software) {
    countByCategory.set(s.category, (countByCategory.get(s.category) ?? 0) + 1);
  }

  const findings = [];
  for (const category of categories) {
    const count = countByCategory.get(category.slug) ?? 0;
    if (count === 0 || count > THIN_THRESHOLD) continue; // 0 is validate-data's job, not ours

    findings.push(
      makeFinding({
        agentId,
        kind: "opportunity",
        severity: "info",
        title: `Thin category: ${category.name} (${count} entr${count === 1 ? "y" : "ies"})`,
        description: `/category/${category.slug} currently lists only ${count} software entr${count === 1 ? "y" : "ies"}. Categories with ${THIN_THRESHOLD} or fewer entries are weaker landing pages — they read as sparse to a visitor and rarely justify a strong internal-link/backlink case.`,
        location: `/category/${category.slug}`,
        evidence: [`${count} software entries currently reference category "${category.slug}"`],
        confidence: 1,
        riskLevel: 2,
        recommendedAction: `Add more software to the "${category.name}" category (only from real, sourced research — never fabricated), or consider merging it into a related category if it's unlikely to grow.`,
        dedupeKey: `${agentId}:${category.slug}`,
      })
    );
  }

  return {
    summary: `Checked ${categories.length} categories for content depth. ${findings.length} thin (≤${THIN_THRESHOLD} entries, excluding true orphans already caught by validate-data).`,
    findings,
  };
};
