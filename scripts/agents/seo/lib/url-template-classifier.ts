/**
 * Pure, deterministic URL -> template classification. Needs no external
 * data or credential — unlike almost everything else in the indexation
 * workflow, this is genuinely unblockable and testable today. Used by the
 * indexed-vs-non-indexed comparator to answer "does template type
 * correlate with index state" without guessing from the URL string at
 * finding-construction time in five different places.
 */

export type UrlTemplate = "homepage" | "software" | "category" | "comparison" | "other";

export function classifyUrlTemplate(pathOrUrl: string): UrlTemplate {
  let path: string;
  try {
    path = new URL(pathOrUrl).pathname;
  } catch {
    path = pathOrUrl; // already a bare path
  }

  if (path === "/" || path === "") return "homepage";
  if (path.startsWith("/software/")) return "software";
  if (path.startsWith("/category/")) return "category";
  if (path.startsWith("/compare/")) return "comparison";
  return "other";
}
