export type AnalyticsConfig =
  | { provider: "ga"; measurementId: string }
  | { provider: "plausible"; domain: string }
  | { provider: "posthog"; apiKey: string; apiHost: string }
  | { provider: "none" };

/**
 * Analytics is off by default and only turns on via environment variables —
 * never hardcoded. Setting NEXT_PUBLIC_ANALYTICS_PROVIDER alone isn't
 * enough: the provider's own required ID must also be set, or this falls
 * back to "none". No analytics provider is configured in this repository.
 */
export function getAnalyticsConfig(): AnalyticsConfig {
  const provider = (process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER ?? "none").toLowerCase();

  switch (provider) {
    case "ga": {
      const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
      return measurementId ? { provider: "ga", measurementId } : { provider: "none" };
    }
    case "plausible": {
      const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
      return domain ? { provider: "plausible", domain } : { provider: "none" };
    }
    case "posthog": {
      const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
      const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
      return apiKey ? { provider: "posthog", apiKey, apiHost } : { provider: "none" };
    }
    default:
      return { provider: "none" };
  }
}

export function isAnalyticsEnabled(): boolean {
  return getAnalyticsConfig().provider !== "none";
}
