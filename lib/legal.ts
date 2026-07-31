export const LEGAL_LAST_UPDATED = "July 31, 2026";

export type LegalPageLink = {
  name: string;
  href: string;
};

/**
 * Single source of truth for every legal/trust page — drives the footer
 * nav and the sitemap, so a new page only needs to be added here once.
 */
export const LEGAL_PAGES: LegalPageLink[] = [
  { name: "Privacy Policy", href: "/privacy" },
  { name: "Terms of Service", href: "/terms" },
  { name: "Disclaimer", href: "/disclaimer" },
  { name: "Affiliate Disclosure", href: "/affiliate-disclosure" },
  { name: "Editorial Policy", href: "/editorial-policy" },
  { name: "Sources Policy", href: "/sources-policy" },
  { name: "Corrections Policy", href: "/corrections-policy" },
  { name: "AI Usage Disclosure", href: "/ai-usage" },
  { name: "Accessibility Statement", href: "/accessibility" },
  { name: "Cookie Policy", href: "/cookies" },
  { name: "Trademark Notice", href: "/trademark-notice" },
];
