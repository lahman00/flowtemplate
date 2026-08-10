import type { Software } from "@/data/software";
import type { Category } from "@/data/categories";

/**
 * Content forensics (2026-08-10) flagged category pages as "just a list"
 * — a static one-line description plus a card grid, no synthesis of what
 * actually varies across the category's members. This computes a real,
 * grounded second sentence from data every category member already has
 * (validate:data requires a non-empty `platforms` array), rather than an
 * editorial claim about which tools are "best."
 */
export function generateCategorySynthesis(category: Category, members: Software[]): string {
  if (members.length === 0) return category.description;

  const webCount = members.filter((m) => m.platforms?.includes("Web")).length;
  const mobileCount = members.filter((m) => m.platforms?.includes("iOS") && m.platforms?.includes("Android")).length;
  const desktopCount = members.filter((m) => m.platforms?.includes("Windows") || m.platforms?.includes("macOS")).length;

  const parts: string[] = [];
  if (webCount > 0) parts.push(`${webCount} of ${members.length} run in the browser`);
  if (mobileCount > 0) parts.push(`${mobileCount} have native iOS and Android apps`);
  if (desktopCount > 0) parts.push(`${desktopCount} also ship Windows and/or macOS desktop apps`);

  if (parts.length === 0) return category.description;

  return `${category.description} Of the ${members.length} tools tracked here, ${parts.join("; ")} — platform support sourced from each vendor's own site.`;
}
