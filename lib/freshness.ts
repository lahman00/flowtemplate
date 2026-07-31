import { getAllSoftware } from "@/data/software";
import { getAllCategories } from "@/data/categories";

export type DataFreshness = {
  softwareCount: number;
  categoryCount: number;
  /** Earliest accessed_at across all entries, YYYY-MM-DD. */
  earliestAccessedAt: string;
  /** Most recent accessed_at across all entries, YYYY-MM-DD — the honest "data last verified" date. */
  latestAccessedAt: string;
};

/** Real, computed stats from the actual dataset — never a hand-typed number that can drift out of sync. */
export function getDataFreshness(): DataFreshness {
  const software = getAllSoftware();
  const categories = getAllCategories();
  const accessDates = software.map((entry) => entry.accessedAt).sort();

  return {
    softwareCount: software.length,
    categoryCount: categories.length,
    earliestAccessedAt: accessDates[0],
    latestAccessedAt: accessDates[accessDates.length - 1],
  };
}
