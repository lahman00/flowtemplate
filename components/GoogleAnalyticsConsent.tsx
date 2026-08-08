"use client";

import { useSyncExternalStore } from "react";
import Script from "next/script";
import { ConsentBanner } from "@/components/ConsentBanner";
import {
  getConsentServerSnapshot,
  getConsentSnapshot,
  pushConsentUpdate,
  subscribeToConsent,
  writeStoredConsent,
} from "@/lib/consent";

/**
 * Google Consent Mode v2, wired to GA4. Two scripts, gated in sequence:
 *
 * 1. Always present the moment this component mounts, regardless of
 *    consent state: initializes window.dataLayer/gtag and sets every
 *    Consent Mode signal to "denied" by default. This is a client-side JS
 *    state declaration only — it makes no network request and sets no
 *    cookie, so there's nothing here for a visitor to consent to.
 * 2. The real gtag.js — the only piece that can actually set a cookie or
 *    contact Google — only renders once `consent === "granted"`. Before
 *    that, it simply isn't in the tree, so nothing loads, nothing runs,
 *    nothing is set. This is stricter than Google's own "advanced" Consent
 *    Mode (which loads the tag pre-consent and sends cookieless pings) by
 *    design, to match this site's existing "no cookies before consent"
 *    promise as literally as possible.
 *
 * Because (2) is declarative — driven by React state (via
 * useSyncExternalStore over lib/consent.ts), not an imperative
 * `document.createElement('script')` call from more than one place — it's
 * structurally impossible for this component to inject gtag.js twice: it
 * either isn't in the render tree, or it is, once.
 */
export function GoogleAnalyticsConsent({ measurementId }: { measurementId: string }) {
  const consent = useSyncExternalStore(subscribeToConsent, getConsentSnapshot, getConsentServerSnapshot);

  function choose(status: "granted" | "denied") {
    writeStoredConsent(status);
    pushConsentUpdate(status);
  }

  return (
    <>
      <Script id="consent-mode-default" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){window.dataLayer.push(arguments);}window.gtag=gtag;gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'});`}
      </Script>

      {consent === "granted" ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
            strategy="afterInteractive"
          />
          <Script id="ga-analytics-init" strategy="afterInteractive">
            {`window.gtag('js', new Date());window.gtag('consent','update',{analytics_storage:'granted'});window.gtag('config','${measurementId}');`}
          </Script>
        </>
      ) : null}

      {consent === "unset" ? (
        <ConsentBanner onAccept={() => choose("granted")} onDecline={() => choose("denied")} />
      ) : null}
    </>
  );
}
