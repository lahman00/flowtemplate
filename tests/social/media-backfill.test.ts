import { describe, it, expect } from "vitest";
import { recoverHeadlineAndBody, queueHashExcludingFacebookImage } from "@/lib/social/media-backfill";
import type { SocialQueueEntry } from "@/lib/social/types";

/**
 * Coverage for the Facebook media backfill (scripts/social/backfill-media.ts,
 * 2026-08-20) — the one-off migration that fixes pre-2026-08-17 queue
 * entries whose Facebook variant has imageUrl: null even though their
 * pillar now supports a card. These are the two properties the whole
 * backfill's safety depends on: recovering the exact already-committed
 * headline/body (never inventing new copy), and proving the hash is
 * blind only to the two fields that are supposed to change.
 */
describe("recoverHeadlineAndBody", () => {
  it("recovers headline and body from the standard 3-part Facebook text (headline / body / CTA)", () => {
    const text = "RapidAPI vs SendGrid: what actually differs?\n\nRapidAPI best fits: developers.\n\nWhat's been your experience?";
    expect(recoverHeadlineAndBody(text)).toEqual({
      headline: "RapidAPI vs SendGrid: what actually differs?",
      body: "RapidAPI best fits: developers.",
    });
  });

  it("recovers headline and joins multi-paragraph body when there are more than 3 parts, dropping only the trailing CTA-like segment", () => {
    const text = "Miro or Lucidchart?\n\nMiro puts the canvas first.\n\nLucidchart puts diagrams first.\n\nFull comparison:";
    expect(recoverHeadlineAndBody(text)).toEqual({
      headline: "Miro or Lucidchart?",
      body: "Miro puts the canvas first.\n\nLucidchart puts diagrams first.",
    });
  });

  it("returns null for text with no paragraph break at all (nothing safe to split)", () => {
    expect(recoverHeadlineAndBody("just one line, no breaks")).toBeNull();
  });

  it("never fabricates text — the recovered headline/body are always exact substrings of the input", () => {
    const text = "Headline here.\n\nBody text here.\n\nWhat's been your experience?";
    const result = recoverHeadlineAndBody(text);
    expect(text).toContain(result!.headline);
    expect(text).toContain(result!.body);
  });
});

describe("queueHashExcludingFacebookImage", () => {
  function makeEntry(overrides: Partial<SocialQueueEntry> = {}): SocialQueueEntry {
    return {
      id: "e1",
      pillar: "software_decisions",
      topic: "t",
      sourceSlugs: [],
      campaign: null,
      state: "APPROVED_FOR_AUTO",
      createdAt: "2026-08-16T00:00:00.000Z",
      scheduledFor: null,
      channels: {
        facebook: { text: "hi", link: null, imageUrl: null, altText: null, hashtags: [], publishResult: null },
      },
      qaNotes: [],
      history: [],
      ...overrides,
    };
  }

  it("is identical before and after only imageUrl/altText change on the Facebook variant", () => {
    const before = [makeEntry()];
    const after = [
      makeEntry({
        channels: {
          facebook: { text: "hi", link: null, imageUrl: "https://miloosh.com/api/social/card?x=1", altText: "Miloosh card: hi", hashtags: [], publishResult: null },
        },
      }),
    ];
    expect(queueHashExcludingFacebookImage(before)).toBe(queueHashExcludingFacebookImage(after));
  });

  it("changes if any non-image field changes (text, state, scheduledFor, etc.)", () => {
    const base = queueHashExcludingFacebookImage([makeEntry()]);
    expect(queueHashExcludingFacebookImage([makeEntry({ state: "SCHEDULED" })])).not.toBe(base);
    expect(queueHashExcludingFacebookImage([makeEntry({ scheduledFor: "2026-09-01T00:00:00.000Z" })])).not.toBe(base);
    expect(
      queueHashExcludingFacebookImage([
        makeEntry({ channels: { facebook: { text: "changed", link: null, imageUrl: null, altText: null, hashtags: [], publishResult: null } } }),
      ]),
    ).not.toBe(base);
  });

  it("is order-independent (sorts by id internally)", () => {
    const a = makeEntry({ id: "a" });
    const b = makeEntry({ id: "b" });
    expect(queueHashExcludingFacebookImage([a, b])).toBe(queueHashExcludingFacebookImage([b, a]));
  });
});
