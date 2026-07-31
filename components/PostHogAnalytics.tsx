"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

export function PostHogAnalytics({ apiKey, apiHost }: { apiKey: string; apiHost: string }) {
  useEffect(() => {
    if (!posthog.__loaded) {
      posthog.init(apiKey, { api_host: apiHost, capture_pageview: true });
    }
  }, [apiKey, apiHost]);

  return null;
}
