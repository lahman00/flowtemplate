/**
 * Sprint 8 Phase 4 — Outbound Event abstraction. Defines the shape of a
 * revenue-relevant outbound interaction (a click toward a vendor's site)
 * and a single choke point for recording one. Nothing is sent anywhere:
 * recordOutboundEvent is a real function with real logic, but it's gated
 * behind an env var that is unset in this repository, so it's a no-op
 * today — the same "off by default, on only via env var" pattern as
 * lib/analytics.ts. No page calls this yet; that's deliberate, see
 * docs/revenue.md.
 */

export type OutboundEventType = "official_site_click" | "affiliate_link_click" | "vendor_link_click";

export type OutboundEvent = {
  type: OutboundEventType;
  /** The software entry this click relates to. */
  softwareSlug: string;
  /** Where the click actually points. */
  destination: "official" | "affiliate";
  url: string;
};

/**
 * Off unless NEXT_PUBLIC_REVENUE_TRACKING_ENABLED=true is set (see
 * .env.example) — matches lib/analytics.ts's convention of a single
 * explicit opt-in flag rather than inferring "on" from partial config.
 */
export function isOutboundTrackingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_REVENUE_TRACKING_ENABLED === "true";
}

/**
 * The one place an outbound click would be recorded. Intentionally has no
 * destination sink yet — no analytics provider, warehouse, or database has
 * been chosen for revenue events, so wiring one in here would be
 * fabricated architecture. When tracking is enabled and a real sink
 * exists, this is the function to extend.
 */
export function recordOutboundEvent(event: OutboundEvent): void {
  if (!isOutboundTrackingEnabled()) {
    return;
  }

  // No sink configured yet — see docs/revenue.md "Turning this on for real."
  void event;
}
