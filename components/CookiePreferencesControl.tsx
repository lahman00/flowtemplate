"use client";

import { useSyncExternalStore } from "react";
import { buttonClasses } from "@/lib/button-styles";
import { getConsentServerSnapshot, getConsentSnapshot, subscribeToConsent, writeStoredConsent } from "@/lib/consent";

/**
 * The "change your choice" control this page's copy promises. A full page
 * reload after choosing is deliberate, not an oversight: GoogleAnalyticsConsent
 * (mounted once, in the root layout) reads the same shared store, so a
 * reload is the simplest way to guarantee its script tags reflect the new
 * choice and actually start or stop loading gtag.js — no cross-component
 * event bus needed for what's fundamentally a rare, deliberate action.
 */
export function CookiePreferencesControl() {
  const consent = useSyncExternalStore(subscribeToConsent, getConsentSnapshot, getConsentServerSnapshot);

  function choose(status: "granted" | "denied") {
    writeStoredConsent(status);
    window.location.reload();
  }

  // Avoids rendering a default state before we know the real one.
  if (consent === "loading") return null;

  const label =
    consent === "granted"
      ? "Analytics is currently allowed."
      : consent === "denied"
        ? "Analytics is currently declined."
        : "You haven't made a choice yet.";

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm text-zinc-400">{label}</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => choose("granted")}
          disabled={consent === "granted"}
          className={buttonClasses("secondary", "md")}
        >
          Allow analytics
        </button>
        <button
          type="button"
          onClick={() => choose("denied")}
          disabled={consent === "denied"}
          className={buttonClasses("ghost", "md")}
        >
          Decline analytics
        </button>
      </div>
    </div>
  );
}
