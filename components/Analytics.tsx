import Script from "next/script";
import { getAnalyticsConfig } from "@/lib/analytics";
import { PostHogAnalytics } from "@/components/PostHogAnalytics";

/**
 * Renders nothing unless analytics has been explicitly configured via
 * environment variables (see lib/analytics.ts and .env.example). No
 * provider is configured in this repository, so this is currently inert.
 */
export function Analytics() {
  const config = getAnalyticsConfig();

  if (config.provider === "ga") {
    return (
      <>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${config.measurementId}`}
          strategy="afterInteractive"
        />
        <Script id="ga-analytics-init" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${config.measurementId}');`}
        </Script>
      </>
    );
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
