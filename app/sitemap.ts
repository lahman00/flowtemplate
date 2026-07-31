import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
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

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];

  return [...staticPages, ...categoryPages, ...softwarePages];
}
