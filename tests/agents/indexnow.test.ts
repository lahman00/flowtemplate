import { describe, it, expect, vi, afterEach } from "vitest";
import { submitUrlsToIndexNow, INDEXNOW_KEY } from "@/scripts/agents/seo/lib/indexnow-client";
import { unsubmittedToIndexNow, recordIndexNowSubmission } from "@/lib/agents/state";
import type { AgentSwarmState } from "@/lib/agents/state";

describe("submitUrlsToIndexNow", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the exact request shape the real IndexNow API expects", async () => {
    const fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(async () => ({ status: 200 }) as Response);
    vi.stubGlobal("fetch", fetchMock);

    await submitUrlsToIndexNow(["https://miloosh.com/software/notion"], "https://miloosh.com/");

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.indexnow.org/indexnow");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string);
    expect(body).toEqual({
      host: "miloosh.com",
      key: INDEXNOW_KEY,
      keyLocation: `https://miloosh.com/${INDEXNOW_KEY}.txt`,
      urlList: ["https://miloosh.com/software/notion"],
    });
  });

  it("treats HTTP 200 and 202 as success", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ status: 202 }) as Response));
    const result = await submitUrlsToIndexNow(["https://miloosh.com/"], "https://miloosh.com/");
    expect(result.ok).toBe(true);
  });

  it("treats HTTP 403 (key validation failed) as a real, reported failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ status: 403 }) as Response));
    const result = await submitUrlsToIndexNow(["https://miloosh.com/"], "https://miloosh.com/");
    expect(result.ok).toBe(false);
    expect(result.detail).toContain("Key validation failed");
  });

  it("does not call fetch at all when there's nothing to submit", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await submitUrlsToIndexNow([], "https://miloosh.com/");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
  });

  it("refuses to submit more than IndexNow's own 10,000-URL limit", async () => {
    await expect(submitUrlsToIndexNow(Array(10_001).fill("https://miloosh.com/"), "https://miloosh.com/")).rejects.toThrow(/10,000/);
  });
});

describe("IndexNow submission state (do not repeatedly submit unchanged URLs)", () => {
  const emptyState: AgentSwarmState = { lastRunAt: {}, firstSeenAt: {}, dismissedKeys: [], indexNowSubmittedAt: {}, urlInspectionCache: {} };

  it("treats every URL as new on first run", () => {
    const urls = ["https://miloosh.com/", "https://miloosh.com/software/notion"];
    expect(unsubmittedToIndexNow(emptyState, urls)).toEqual(urls);
  });

  it("excludes a URL that was already recorded as submitted", () => {
    const stateWithOne = recordIndexNowSubmission(emptyState, ["https://miloosh.com/"]);
    const remaining = unsubmittedToIndexNow(stateWithOne, ["https://miloosh.com/", "https://miloosh.com/software/notion"]);
    expect(remaining).toEqual(["https://miloosh.com/software/notion"]);
  });

  it("a second run against the same state submits nothing new (the core 'do not repeatedly submit' guarantee)", () => {
    const urls = ["https://miloosh.com/", "https://miloosh.com/software/notion"];
    const stateAfterFirstRun = recordIndexNowSubmission(emptyState, unsubmittedToIndexNow(emptyState, urls));
    const secondRunCandidates = unsubmittedToIndexNow(stateAfterFirstRun, urls);
    expect(secondRunCandidates).toEqual([]);
  });
});
