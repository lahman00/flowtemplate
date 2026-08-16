import { describe, it, expect } from "vitest";
import { buildUtmUrl } from "@/lib/social/utm";

describe("buildUtmUrl", () => {
  it("appends the documented UTM parameter set", () => {
    const result = buildUtmUrl("https://miloosh.com/software/notion", "linkedin", "spring-launch", "entry-123");
    const url = new URL(result);
    expect(url.searchParams.get("utm_source")).toBe("linkedin");
    expect(url.searchParams.get("utm_medium")).toBe("social");
    expect(url.searchParams.get("utm_campaign")).toBe("spring-launch");
    expect(url.searchParams.get("utm_content")).toBe("entry-123");
  });

  it("defaults utm_campaign to 'organic' when no campaign is set", () => {
    const result = buildUtmUrl("https://miloosh.com/software/notion", "bluesky", null, "entry-456");
    expect(new URL(result).searchParams.get("utm_campaign")).toBe("organic");
  });

  it("preserves the original path and any existing query params", () => {
    const result = buildUtmUrl("https://miloosh.com/compare/notion-vs-clickup?ref=abc", "x", null, "e1");
    const url = new URL(result);
    expect(url.pathname).toBe("/compare/notion-vs-clickup");
    expect(url.searchParams.get("ref")).toBe("abc");
  });

  it("returns the input unchanged if it isn't a valid absolute URL, rather than throwing", () => {
    expect(buildUtmUrl("not-a-url", "facebook", null, "e2")).toBe("not-a-url");
  });

  it("re-tagging the same link for a different channel produces a different source, not a cumulative mess", () => {
    const linkedinUrl = buildUtmUrl("https://miloosh.com/software/notion", "linkedin", null, "e3");
    const facebookUrl = buildUtmUrl("https://miloosh.com/software/notion", "facebook", null, "e3");
    expect(new URL(linkedinUrl).searchParams.get("utm_source")).toBe("linkedin");
    expect(new URL(facebookUrl).searchParams.get("utm_source")).toBe("facebook");
  });
});
