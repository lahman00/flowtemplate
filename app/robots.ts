import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Internal revenue dashboard (Sprint 8) — also marked noindex/nofollow
      // on the page itself; disallowed here too as defense in depth.
      disallow: "/internal/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
