import "./_load-env";
import { readQueue, writeQueue, applyQueueTransition } from "@/lib/social/queue";
import { getAllSoftware } from "@/data/software";
import { SITE_URL } from "@/lib/site";
import type { Channel, SocialQueueEntry } from "@/lib/social/types";

/**
 * Phase 1B (2026-08-17 growth sprint) — content-quality audit distinct
 * from qa-gates.ts (which only checks structural/factual-safety gates at
 * DRAFTED->APPROVED_FOR_AUTO time). This runs against the WHOLE current
 * queue population, re-checked against today's live catalog data — a
 * post can have been valid when drafted and be wrong now (price moved,
 * product removed) — and adds heuristics qa-gates.ts doesn't cover:
 * repetitive hooks, AI-cliche phrasing, hashtag overload, affiliate-link
 * leakage into stored copy, brand-name repetition, weak/no CTA.
 *
 * Read-only by default (--quarantine required to actually mutate).
 * Quarantine sends an APPROVED_FOR_AUTO entry back to DRAFTED (never
 * SKIPPED — that's terminal) so it re-enters the normal QA/schedule
 * pipeline instead of being silently deleted from the calendar.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/social/quality-audit.ts               # report only
 *   npx tsx --env-file=.env.local scripts/social/quality-audit.ts --quarantine  # also demote flagged entries
 */

const AI_CLICHES = [
  "in today's fast-paced",
  "unlock the power of",
  "game-changer",
  "in conclusion",
  "let's dive in",
  "whether you're a",
  "look no further",
  "at the end of the day",
  "it's important to note",
  "revolutioniz",
];

const RAW_AFFILIATE_DOMAINS = ["pxf.io", "try.elevenlabs.io", "partnerstack", "impact.com"];

const HASHTAG_LIMIT: Partial<Record<Channel, number>> = { x: 2, bluesky: 2, mastodon: 3, linkedin: 3, facebook: 3 };

type Flag = { severity: "error" | "warning"; code: string; message: string };

function flagsForVariant(entry: SocialQueueEntry, channel: Channel, text: string, link: string | null, hashtags: string[]): Flag[] {
  const flags: Flag[] = [];
  const lower = text.toLowerCase();

  for (const cliche of AI_CLICHES) {
    if (lower.includes(cliche)) flags.push({ severity: "warning", code: "ai-cliche", message: `Contains AI-cliche phrase "${cliche}"` });
  }

  const brandCount = (text.match(/Miloosh/g) ?? []).length;
  if (brandCount > 2) flags.push({ severity: "warning", code: "brand-repetition", message: `"Miloosh" appears ${brandCount} times — reads as repetitive/robotic` });

  const limit = HASHTAG_LIMIT[channel];
  if (limit !== undefined && hashtags.length > limit) {
    flags.push({ severity: "warning", code: "hashtag-overload", message: `${hashtags.length} hashtags on ${channel}, over the ${limit} platform-native guideline` });
  }

  if (link) {
    if (RAW_AFFILIATE_DOMAINS.some((d) => link.includes(d))) {
      flags.push({ severity: "error", code: "affiliate-leakage", message: `Stored link is a raw affiliate/vendor URL, not a Miloosh page: ${link}` });
    } else if (!link.startsWith(SITE_URL) && !link.startsWith("/")) {
      flags.push({ severity: "warning", code: "external-link", message: `Link is not a Miloosh URL: ${link}` });
    }
  } else if (entry.pillar !== "trust_methodology" && entry.pillar !== "buyer_education") {
    flags.push({ severity: "warning", code: "no-link", message: "No link at all on a product/data-grounded pillar post — weak traffic value" });
  }

  // Weak-CTA heuristic: no link AND no question mark AND no imperative-ish opener.
  const hasImperativeOpener = /^(see|read|compare|check|learn|find|discover|explore)\b/i.test(text.trim());
  if (!link && !text.includes("?") && !hasImperativeOpener) {
    flags.push({ severity: "warning", code: "weak-cta", message: "No link, no question, no imperative opener — reads as informational-only with no next action" });
  }

  // Unsupported-claim proxy: text names a cataloged software's proper name (whole word, not a substring of an unrelated word) that isn't in sourceSlugs.
  // Names shorter than 5 chars are skipped — too likely to collide with ordinary English words.
  // The migration/comparison pillars store a compound "a-vs-b" comparison slug rather than the two individual product slugs — expand those before checking coverage.
  const coveredSlugs = new Set(entry.sourceSlugs.flatMap((s) => (s.includes("-vs-") ? s.split("-vs-") : [s])));
  for (const s of getAllSoftware()) {
    if (s.name.length < 5 || coveredSlugs.has(s.slug)) continue;
    const wordBoundary = new RegExp(`\\b${s.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
    if (wordBoundary.test(text)) {
      flags.push({ severity: "warning", code: "unsourced-mention", message: `Text mentions "${s.name}" but "${s.slug}" isn't in sourceSlugs — claim may not trace to grounded data` });
    }
  }

  return flags;
}

function checkStalePricing(entry: SocialQueueEntry, text: string): Flag[] {
  if (entry.pillar !== "pricing_intelligence" && entry.pillar !== "commercial") return [];
  const slug = entry.sourceSlugs[0];
  if (!slug) return [];
  const software = getAllSoftware().find((s) => s.slug === slug);
  if (!software) return [{ severity: "error", code: "removed-product", message: `Source software "${slug}" no longer exists in the catalog` }];
  const price = software.pricing?.startingPrice;
  if (price && !text.includes(price)) {
    return [{ severity: "warning", code: "stale-pricing", message: `Cites pricing for ${software.name} but current catalog price "${price}" isn't in the text — re-verify before publishing` }];
  }
  return [];
}

function main() {
  const live = process.argv.includes("--quarantine");

  readQueue().then(async (queue) => {
    const targets = queue.filter((e) => e.state === "APPROVED_FOR_AUTO" || e.state === "SCHEDULED");

    // Repetitive-hook detection: normalize first 6 words of each channel variant, group across the whole population.
    const hookCounts = new Map<string, number>();
    for (const e of targets) {
      for (const v of Object.values(e.channels)) {
        if (!v) continue;
        const hook = v.text.trim().toLowerCase().split(/\s+/).slice(0, 6).join(" ");
        if (hook.length > 10) hookCounts.set(hook, (hookCounts.get(hook) ?? 0) + 1);
      }
    }

    // Duplicate-idea detection: same topic key reused an excessive number of times in the live population.
    const topicCounts = new Map<string, number>();
    for (const e of targets) topicCounts.set(e.topic, (topicCounts.get(e.topic) ?? 0) + 1);

    const byCode = new Map<string, number>();
    const errorEntryIds = new Set<string>();
    const perEntryFlags = new Map<string, Flag[]>();

    for (const entry of targets) {
      const flags: Flag[] = [];
      for (const [channel, variant] of Object.entries(entry.channels) as [Channel, SocialQueueEntry["channels"][Channel]][]) {
        if (!variant) continue;
        flags.push(...flagsForVariant(entry, channel, variant.text, variant.link, variant.hashtags));
        flags.push(...checkStalePricing(entry, variant.text));
        const hook = variant.text.trim().toLowerCase().split(/\s+/).slice(0, 6).join(" ");
        const hookCount = hookCounts.get(hook) ?? 0;
        if (hookCount > 5) flags.push({ severity: "warning", code: "repetitive-hook", message: `Hook "${hook}..." shared by ${hookCount} other posts on ${channel}` });
      }
      const topicCount = topicCounts.get(entry.topic) ?? 0;
      if (topicCount > 3) flags.push({ severity: "warning", code: "duplicate-idea", message: `Topic "${entry.topic}" appears ${topicCount} times in the live queue` });

      if (flags.length) {
        perEntryFlags.set(entry.id, flags);
        for (const f of flags) byCode.set(f.code, (byCode.get(f.code) ?? 0) + 1);
        if (flags.some((f) => f.severity === "error")) errorEntryIds.add(entry.id);
      }
    }

    console.log(`Quality audit — ${targets.length} live entries (APPROVED_FOR_AUTO + SCHEDULED)\n`);
    console.log(`Entries with at least one flag: ${perEntryFlags.size} (${((perEntryFlags.size / targets.length) * 100).toFixed(1)}%)`);
    console.log(`Entries with a hard error (quarantine candidate): ${errorEntryIds.size}\n`);
    console.log("By category:");
    for (const [code, count] of [...byCode.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${code}: ${count}`);
    }

    if (errorEntryIds.size) {
      console.log(`\nHard-error entries:`);
      for (const id of errorEntryIds) {
        const entry = targets.find((e) => e.id === id)!;
        console.log(`  [${id.slice(0, 8)}] ${entry.pillar}/${entry.topic} (state=${entry.state})`);
        for (const f of perEntryFlags.get(id)!.filter((f) => f.severity === "error")) console.log(`    ERROR: ${f.message}`);
      }
    }

    if (live && errorEntryIds.size) {
      console.log(`\n--quarantine: demoting ${errorEntryIds.size} error entries back to DRAFTED for redraft...`);
      const updated = queue.map((e) => {
        if (!errorEntryIds.has(e.id)) return e;
        if (e.state !== "APPROVED_FOR_AUTO") return e; // only APPROVED_FOR_AUTO can transition to DRAFTED; a SCHEDULED error entry needs manual handling
        const notes = perEntryFlags.get(e.id)!.filter((f) => f.severity === "error").map((f) => f.message);
        return applyQueueTransition(e, "DRAFTED", `Quarantined by quality-audit (2026-08-17): ${notes.join(" | ")}`);
      });
      await writeQueue(updated);
      console.log("Done.");
    } else if (errorEntryIds.size) {
      console.log(`\n(Report-only run — re-run with --quarantine to demote the ${errorEntryIds.size} hard-error entries back to DRAFTED.)`);
    }
  });
}

main();
