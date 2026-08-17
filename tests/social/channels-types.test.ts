import { describe, it, expect } from "vitest";
import { defaultFormat } from "@/lib/social/channels/types";

/**
 * 2026-08-17 pre-production Facebook hardening — the sanitizer's original
 * blind `replace(/—/g, ",")` broke grammar whenever the em dash had real
 * surrounding whitespace (its normal parenthetical use), producing a
 * floating pre-comma space: `alternative" , the`. This is the exact
 * regression the fix addresses — see lib/social/channels/types.ts's
 * defaultFormat() for the full explanation.
 */
describe("defaultFormat — punctuation sanitization", () => {
  it("regression: the exact Contentful sentence that exposed the bug", () => {
    const text = 'There\'s no single "best Contentful alternative" — the right one depends on which constraint actually matters to you.';
    const result = defaultFormat(text, null, 2000);
    expect(result).toBe('There\'s no single "best Contentful alternative", the right one depends on which constraint actually matters to you.');
    expect(result).not.toContain(' , '); // the exact broken artifact this fix removes
  });

  it("em dash with surrounding spaces becomes a comma with no orphan leading space", () => {
    expect(defaultFormat("A — B", null, 2000)).toBe("A, B");
  });

  it("em dash with no surrounding whitespace falls back to a plain comma", () => {
    expect(defaultFormat("word—word", null, 2000)).toBe("word,word");
  });

  it("en dash used unspaced as a number range becomes a plain hyphen, not a comma", () => {
    expect(defaultFormat("Supports 10–15 users", null, 2000)).toBe("Supports 10-15 users");
  });

  it("en dash used with spaces as a parenthetical break becomes a comma, same as em dash", () => {
    expect(defaultFormat("Monday – Friday only", null, 2000)).toBe("Monday, Friday only");
  });

  it("smart quotes are never touched", () => {
    const text = "This is “important” context.";
    expect(defaultFormat(text, null, 2000)).toBe(text);
  });

  it("apostrophes are never touched", () => {
    const text = "It's the customer's choice.";
    expect(defaultFormat(text, null, 2000)).toBe(text);
  });

  it("regular commas are never touched", () => {
    const text = "Notion, ClickUp, and Asana are all real options.";
    expect(defaultFormat(text, null, 2000)).toBe(text);
  });

  it("parentheses are never touched", () => {
    const text = "Sanity (structured, API-first) is one option.";
    expect(defaultFormat(text, null, 2000)).toBe(text);
  });

  it("a URL passed as the link param is appended on its own line, untouched", () => {
    const result = defaultFormat("Read more", "https://miloosh.com/software/notion?utm_source=facebook", 2000);
    expect(result).toBe("Read more\nhttps://miloosh.com/software/notion?utm_source=facebook");
  });

  it("a URL appearing inside the text itself (not the link param) is never touched by dash/quote handling", () => {
    const text = "See https://miloosh.com/compare/a-vs-b for the full comparison — worth a read.";
    const result = defaultFormat(text, null, 2000);
    expect(result).toContain("https://miloosh.com/compare/a-vs-b");
    expect(result).not.toContain(" , ");
  });

  it("still truncates with an ellipsis when over the character budget, dash-fix included", () => {
    const longText = "A".repeat(50) + " — " + "B".repeat(50);
    const result = defaultFormat(longText, null, 40);
    expect(result.endsWith("…")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(40);
  });
});
