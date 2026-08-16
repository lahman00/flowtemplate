import type { Channel } from "@/lib/social/types";

/**
 * UTM convention (Phase 12): utm_source=<channel>, utm_medium=social,
 * utm_campaign=<campaign or "organic">, utm_content=<queue entry id>.
 * Applied only at publish time — stored queue copy never has UTM baked
 * in, so the same entry can be re-tagged if it's ever re-scheduled.
 */
export function buildUtmUrl(link: string, channel: Channel, campaign: string | null, queueEntryId: string): string {
  try {
    const parsed = new URL(link);
    parsed.searchParams.set("utm_source", channel);
    parsed.searchParams.set("utm_medium", "social");
    parsed.searchParams.set("utm_campaign", campaign ?? "organic");
    parsed.searchParams.set("utm_content", queueEntryId);
    return parsed.toString();
  } catch {
    // Not a real absolute URL — return unchanged rather than throwing; the QA gate catches this separately.
    return link;
  }
}
