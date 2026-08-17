import type { Channel, ChannelVariant, PublishResult } from "@/lib/social/types";
import { contentHash } from "@/lib/social/dedup";

/**
 * Adapter contract — ported from Need Go Home's publishers/base.py
 * Adapter class (is_configured/format/publish/_publish_real), reimplemented
 * as a plain object/interface instead of a class hierarchy since that's
 * the idiomatic shape for this codebase's other channel-agnostic
 * abstractions (see lib/revenue/affiliate-pipeline.ts's function-based
 * design rather than a class).
 */
export type SocialAdapter = {
  channel: Channel;
  /** Env vars this adapter needs to actually publish (not to dry-run). */
  requiredEnv: string[];
  /** Character budget for this platform, used by content-engine.ts when drafting variants. */
  charLimit: number;
  isConfigured(): boolean;
  missingEnv(): string[];
  /** Always safe to call — never throws, never publishes for real. Used for previews and QA. */
  format(text: string, link: string | null): string;
  /**
   * Publish (or dry-run) one variant. Failure-safe by contract: every
   * adapter implementation must catch its own errors and return a FAILED
   * PublishResult rather than throwing, so one channel's outage can never
   * take down the others in the orchestrator's loop (Phase 8's "a failed
   * channel must NOT block all other channels").
   */
  publish(variant: ChannelVariant, options: { dryRun: boolean }): Promise<PublishResult>;
};

function getEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

export function envAll(names: string[]): Record<string, string> | null {
  const out: Record<string, string> = {};
  for (const name of names) {
    const value = getEnv(name);
    if (!value) return null;
    out[name] = value;
  }
  return out;
}

export function missingEnvNames(names: string[]): string[] {
  return names.filter((n) => !getEnv(n));
}

/**
 * Shared default text formatter: fits text + a trailing link under the
 * platform's char limit, truncating with an ellipsis if needed. No em
 * dashes (matches this project's own house style, and Need Go Home's
 * "no em dashes ever" rule for platform copy) — but the original
 * blind `replace(/—/g, ",")` broke grammar whenever the dash had
 * surrounding whitespace (its normal parenthetical use — like right
 * here), producing a floating pre-comma space: `alternative" , the`.
 * Fixed 2026-08-17: consume the surrounding whitespace along with the
 * dash so the replacement comma lands correctly (`alternative", the`).
 * A bare em/en dash with no surrounding whitespace (rare, but possible
 * mid-word) still gets a plain substitution as a fallback. En dashes
 * used unspaced for a range (e.g. "10–15") are left as a plain hyphen,
 * not a comma — a comma there would be wrong. Smart quotes, apostrophes,
 * commas, and parentheses are never touched; only em/en dashes are.
 */
export function defaultFormat(text: string, link: string | null, charLimit: number): string {
  const cleaned = text
    .replace(/\s*[—–]\s+/g, ", ") // dash with any leading + real trailing whitespace: parenthetical-style break -> ", "
    .replace(/—/g, ",") // any remaining (unspaced) em dash -> plain comma, no space to get wrong
    .replace(/–/g, "-"); // any remaining (unspaced) en dash, e.g. a "10–15" range -> plain hyphen
  const tail = link ? `\n${link}` : "";
  const room = charLimit - tail.length;
  if (cleaned.length <= room) return cleaned + tail;
  const truncated = cleaned.slice(0, Math.max(0, room - 1)).trimEnd();
  return `${truncated}…${tail}`;
}

export function buildPublishResult(partial: {
  channel: Channel;
  status: PublishResult["status"];
  text: string;
  link: string;
  postUrl?: string | null;
  postId?: string | null;
  verified?: boolean;
  error?: string;
  mode?: PublishResult["mode"];
}): PublishResult {
  return {
    channel: partial.channel,
    status: partial.status,
    text: partial.text,
    link: partial.link,
    postUrl: partial.postUrl ?? null,
    postId: partial.postId ?? null,
    verified: partial.verified ?? false,
    error: partial.error ?? "",
    contentHash: contentHash(partial.channel, partial.text),
    mode: partial.mode ?? null,
  };
}
