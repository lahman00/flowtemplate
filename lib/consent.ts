/**
 * Google Consent Mode v2 state, shared between the consent banner
 * (components/ConsentBanner.tsx via GoogleAnalyticsConsent.tsx, mounted
 * once in the root layout) and the "change your choice" control on the
 * Cookie Policy page (components/CookiePreferencesControl.tsx). One
 * storage key, one set of helpers — both read/write the same source of
 * truth instead of each reimplementing it.
 *
 * The choice itself is stored in localStorage, not a cookie: localStorage
 * isn't a cookie and isn't sent to any server, so recording "this visitor
 * already chose X" doesn't itself require consent — it's the same
 * strictly-necessary storage every cookie-consent implementation needs to
 * remember what was chosen.
 *
 * Exposed via useSyncExternalStore's (subscribe, getSnapshot,
 * getServerSnapshot) shape rather than a useEffect+setState-on-mount
 * pattern — the latter is flagged by this repo's lint config
 * (react-hooks/set-state-in-effect) and, more importantly, is exactly the
 * "synchronize with an external store" case useSyncExternalStore exists
 * for: it reads localStorage synchronously on the client with no
 * hydration-mismatch flash, and re-renders subscribers when the value
 * actually changes (including same-tab changes made via writeStoredConsent,
 * which the native "storage" event does not cover on its own).
 */

export type ConsentStatus = "loading" | "granted" | "denied" | "unset";

const STORAGE_KEY = "miloosh-analytics-consent";

const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

/** useSyncExternalStore's `subscribe` argument. */
export function subscribeToConsent(callback: () => void): () => void {
  listeners.add(callback);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

/** useSyncExternalStore's `getSnapshot` argument — client only. */
export function getConsentSnapshot(): ConsentStatus {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : "unset";
  } catch {
    // Storage can throw in locked-down browser contexts (private mode,
    // disabled storage). Treat as unset rather than crash the page.
    return "unset";
  }
}

/**
 * useSyncExternalStore's `getServerSnapshot` argument — the value used for
 * the server-rendered HTML and the first client render before hydration
 * settles. Deliberately distinct from "unset" (a real, meaningful choice
 * state) so callers can tell "we don't know yet" apart from "visitor
 * hasn't decided" and avoid rendering the banner until the real answer is
 * known, instead of flashing it for returning visitors who already opted
 * in.
 */
export function getConsentServerSnapshot(): ConsentStatus {
  return "loading";
}

export function writeStoredConsent(status: "granted" | "denied"): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, status);
  } catch {
    // Best-effort — if storage is unavailable the banner will just ask
    // again next visit, which is the safe failure mode.
  }
  notify();
}

/**
 * Pushes a Consent Mode update to gtag's queue. Safe to call even if the
 * real gtag.js network script hasn't loaded yet (or never will, e.g. the
 * visitor declined): window.gtag is defined by the always-present
 * dataLayer-init script in GoogleAnalyticsConsent.tsx the moment that
 * script runs, and gtag() only ever pushes onto the in-memory dataLayer
 * array — it doesn't touch the network or storage on its own.
 */
export function pushConsentUpdate(status: "granted" | "denied"): void {
  const w = window as typeof window & { gtag?: (...args: unknown[]) => void };
  w.gtag?.("consent", "update", { analytics_storage: status });
}
