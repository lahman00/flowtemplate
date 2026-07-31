import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getAllSoftware } from "@/data/software";

export default function sitemap(): MetadataRoute.Sitemap {
  const softwarePages: MetadataRoute.Sitemap = getAllSoftware().map((software) => ({
    url: `${SITE_URL}/software/${software.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];

  return [...staticPages, ...softwarePages];
}
