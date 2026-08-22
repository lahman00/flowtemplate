import type { NextConfig } from "next";
import { REMOVED_COMPARISON_REDIRECTS } from "./data/redirects";

const nextConfig: NextConfig = {
  async redirects() {
    return REMOVED_COMPARISON_REDIRECTS.map(([comparisonSlug, softwareSlug]) => ({
      source: `/compare/${comparisonSlug}`,
      destination: `/software/${softwareSlug}`,
      permanent: true,
    }));
  },
};

export default nextConfig;
