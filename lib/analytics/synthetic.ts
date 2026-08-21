/**
 * Recommend Engine Integrity Patch (2026-08-21) — Phase 1: a reliable way
 * for automated/manual agent QA browser sessions to mark themselves as
 * synthetic, so analytics:report can exclude them from REAL HUMAN metrics
 * by default. See docs/recommendation-engine.md for the incident that
 * motivated this: a QA browser session could not be distinguished from an
 * organic visitor after the fact, because no marker existed and no
 * user-agent is stored per-event (by design — see lib/analytics/events.ts's
 * privacy model).
 *
 * Mechanism: a `?qa=1` URL param, read once client-side, sets a
 * sessionStorage flag that persists for the rest of that browser tab's
 * session (so a QA walkthrough that starts on one URL and navigates to
 * others without repeating `?qa=1` stays marked). This is explicitly NOT
 * fingerprinting and reads no IP address — it's an opt-in marker the
 * operator/agent sets deliberately when starting a QA session, exactly
 * like `x-synthetic-qa` already works for server-side bot-filter checks
 * (see lib/analytics/bot-filter.ts) but for the client-side beacon path,
 * which that header can't reach (sendBeacon/fetch from the browser, not a
 * request Claude Code's own Bash/curl tooling controls).
 */

const SYNTHETIC_QA_STORAGE_KEY = "miloosh_qa";

/**
 * Call once per page navigation, client-side only. Reads `?qa=1` from the
 * current URL and persists the flag to sessionStorage if present, then
 * returns whether this tab's session is currently marked synthetic
 * (whether from this navigation's query param or an earlier one in the
 * same tab session).
 */
export function markAndCheckSyntheticQa(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("qa") === "1") {
      sessionStorage.setItem(SYNTHETIC_QA_STORAGE_KEY, "1");
    }
    return sessionStorage.getItem(SYNTHETIC_QA_STORAGE_KEY) === "1";
  } catch {
    // sessionStorage unavailable (private browsing, disabled storage) —
    // fail closed to "not marked" rather than throwing; this only affects
    // the exclusion mechanism, never the page itself.
    return false;
  }
}
