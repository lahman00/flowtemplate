import { describe, it, expect } from "vitest";
import { contentHash } from "@/lib/social/dedup";

describe("contentHash", () => {
  it("is deterministic — same channel and text always produce the same hash", () => {
    expect(contentHash("bluesky", "Notion vs ClickUp: what actually differs?")).toBe(contentHash("bluesky", "Notion vs ClickUp: what actually differs?"));
  });

  it("differs for different text on the same channel", () => {
    expect(contentHash("bluesky", "Post A")).not.toBe(contentHash("bluesky", "Post B"));
  });

  it("differs for identical text on different channels — dedup is per-platform, not global", () => {
    expect(contentHash("bluesky", "Same text")).not.toBe(contentHash("mastodon", "Same text"));
  });

  it("returns a stable-length hex string", () => {
    const hash = contentHash("x", "any text");
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
  });
});
