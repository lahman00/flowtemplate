import { createHash } from "node:crypto";
import type { SocialQueueEntry } from "@/lib/social/types";

/**
 * Recovers the headline/body a Facebook variant's text was originally
 * rendered from, so a backfilled card image uses the exact wording
 * already committed to the queue instead of inventing new copy.
 * renderForChannel's "facebook" case always produces
 * `${headline}\n\n${body}\n\n<CTA>` (content-engine.ts), so splitting on
 * "\n\n" and dropping the trailing CTA segment recovers both cleanly —
 * validated against the real production queue (2457/2458 clean 3-part
 * splits; the one 5-part outlier, an older hand-authored post with an
 * extra paragraph and a different CTA phrase, still recovers correctly
 * because the last segment is always dropped, not just the third).
 */
export function recoverHeadlineAndBody(facebookText: string): { headline: string; body: string } | null {
  const parts = facebookText.split("\n\n");
  if (parts.length < 2) return null;
  const headline = parts[0]!.trim();
  const body = parts.slice(1, -1).join("\n\n").trim() || parts[1]!.trim();
  if (!headline || !body) return null;
  return { headline, body };
}

/**
 * Deterministic hash of everything in a queue EXCEPT
 * channels.facebook.imageUrl/altText, so a media backfill (or any other
 * Facebook-image-only change) can prove nothing else moved: same hash
 * before/after means id, state, scheduledFor, text, link, topic, pillar,
 * other channels, and history are all byte-identical.
 */
export function queueHashExcludingFacebookImage(entries: SocialQueueEntry[]): string {
  const projected = entries
    .map((e) => ({
      id: e.id,
      pillar: e.pillar,
      topic: e.topic,
      sourceSlugs: e.sourceSlugs,
      campaign: e.campaign,
      state: e.state,
      createdAt: e.createdAt,
      scheduledFor: e.scheduledFor,
      qaNotes: e.qaNotes,
      history: e.history,
      channels: Object.fromEntries(
        Object.entries(e.channels).map(([channel, variant]) => [
          channel,
          channel === "facebook" && variant ? { ...variant, imageUrl: "<excluded>", altText: "<excluded>" } : variant,
        ]),
      ),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
  return createHash("sha256").update(JSON.stringify(projected)).digest("hex");
}
