import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { LEGAL_PAGES } from "@/lib/legal";
import { getAllSoftware } from "@/data/software";
import { getAllCategories } from "@/data/categories";

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
  ];

  return [...staticPages, ...categoryPages, ...softwarePages, ...legalPages];
}
