import { createHash } from "node:crypto";
import type { Channel } from "@/lib/social/types";

/**
 * Ported from Need Go Home's publishers/base.py content_hash() — same
 * algorithm (sha256 of "platform\ntext", truncated to 16 hex chars) so
 * the concept carries over exactly: identical content is never re-posted
 * to the same platform, whether the duplicate attempt comes from a retry,
 * a re-run of the generator, or human error re-approving an old entry.
 */
export function contentHash(channel: Channel, text: string): string {
  return createHash("sha256").update(`${channel}\n${text}`).digest("hex").slice(0, 16);
}
