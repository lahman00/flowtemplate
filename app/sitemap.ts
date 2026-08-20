import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { LEGAL_PAGES } from "@/lib/legal";
import { getAllSoftware } from "@/data/software";
import { getAllCategories } from "@/data/categories";
import { getAllRoleGuides } from "@/data/guides/registry";
import { PUBLISHED_COMPARISONS, getComparisonSlug } from "@/data/comparisons";

export default function sitemap(): MetadataRoute.Sitemap {
  const softwarePages: MetadataRoute.Sitemap = getAllSoftware().map((software) => ({
    url: `${SITE_URL}/software/${software.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = getAllCategories().map((category) => ({
    url: `${SITE_URL}/category/${category.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const roleGuidePages: MetadataRoute.Sitemap = getAllRoleGuides().map((guide) => ({
    url: `${SITE_URL}/${guide.slug}`,
    changeFrequency: "monthly",
    priority: 0.85,
  }));

  const comparisonPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/compare`, changeFrequency: "weekly", priority: 0.7 },
    ...PUBLISHED_COMPARISONS.map(([slugA, slugB]) => ({
      url: `${SITE_URL}/compare/${getComparisonSlug(slugA, slugB)}`,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ];

  // Every legal/trust page (Privacy, Terms, Disclaimer, Affiliate
  // Disclosure, Editorial Policy, Sources Policy, Corrections Policy, AI
  // Usage Disclosure, Accessibility Statement, Cookie Policy, Trademark
  // Notice) is added here automatically via lib/legal.ts's shared list —
  // a new legal page only needs to be added there once.
  const legalPages: MetadataRoute.Sitemap = LEGAL_PAGES.map((page) => ({
    url: `${SITE_URL}${page.href}`,
    changeFrequency: "yearly",
    priority: 0.3,
  }));

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.4 },
    // /recommend/results is excluded — it's query-param-driven and marked
    // noindex on the page itself; every answer combination would otherwise
    // look like near-duplicate content to a crawler.
    { url: `${SITE_URL}/recommend`, changeFrequency: "monthly", priority: 0.9 },
  ];

  return [...staticPages, ...categoryPages, ...roleGuidePages, ...softwarePages, ...comparisonPages, ...legalPages];
}
