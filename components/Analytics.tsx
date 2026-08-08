import Script from "next/script";
import { getAnalyticsConfig } from "@/lib/analytics";
import { PostHogAnalytics } from "@/components/PostHogAnalytics";
import { GoogleAnalyticsConsent } from "@/components/GoogleAnalyticsConsent";

/**
 * Renders nothing unless analytics has been explicitly configured via
 * environment variables (see lib/analytics.ts and .env.example).
 */
export function Analytics() {
  const config = getAnalyticsConfig();

  if (config.provider === "ga") {
    // GA4 is gated behind Google Consent Mode v2 — see
    // GoogleAnalyticsConsent.tsx. The real tracking script (and any
    // cookie) only loads after the visitor explicitly grants consent via
    // the banner it renders; see /cookies for the visitor-facing
    // explanation and the control to change that choice later.
    return <GoogleAnalyticsConsent measurementId={config.measurementId} />;
  }

  if (config.provider === "plausible") {
    return (
      <Script
        src="https://plausible.io/js/script.js"
        data-domain={config.domain}
        strategy="afterInteractive"
      />
    );
  }

  if (config.provider === "posthog") {
    return <PostHogAnalytics apiKey={config.apiKey} apiHost={config.apiHost} />;
  }

  return null;
}
