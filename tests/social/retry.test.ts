import { describe, it, expect, vi } from "vitest";
import { publishWithRetry } from "@/lib/social/retry";
import type { PublishResult } from "@/lib/social/types";

function fakeResult(status: PublishResult["status"]): PublishResult {
  return { channel: "bluesky", status, text: "t", link: "", postUrl: null, postId: null, verified: false, error: "", contentHash: "abc" };
}

describe("publishWithRetry", () => {
  it("returns immediately on success without retrying", async () => {
    const publish = vi.fn().mockResolvedValue(fakeResult("PUBLISHED"));
    const sleep = vi.fn().mockResolvedValue(undefined);
    const result = await publishWithRetry(publish, sleep);
    expect(result.status).toBe("PUBLISHED");
    expect(publish).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("retries exactly once on RATE_LIMITED, then returns the second attempt's result", async () => {
    const publish = vi.fn().mockResolvedValueOnce(fakeResult("RATE_LIMITED")).mockResolvedValueOnce(fakeResult("PUBLISHED"));
    const sleep = vi.fn().mockResolvedValue(undefined);
    const result = await publishWithRetry(publish, sleep);
    expect(result.status).toBe("PUBLISHED");
    expect(publish).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it("never retries more than the configured max attempts, even if still rate-limited", async () => {
    const publish = vi.fn().mockResolvedValue(fakeResult("RATE_LIMITED"));
    const sleep = vi.fn().mockResolvedValue(undefined);
    const result = await publishWithRetry(publish, sleep);
    expect(result.status).toBe("RATE_LIMITED");
    expect(publish).toHaveBeenCalledTimes(2); // MAX_ATTEMPTS = 2
  });

  it("does NOT retry a generic FAILED — retrying won't fix an auth error or malformed request", async () => {
    const publish = vi.fn().mockResolvedValue(fakeResult("FAILED"));
    const sleep = vi.fn().mockResolvedValue(undefined);
    const result = await publishWithRetry(publish, sleep);
    expect(result.status).toBe("FAILED");
    expect(publish).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("does NOT retry SETUP_REQUIRED, MANUAL_ONLY, or DUPLICATE_SKIPPED — none are transient", async () => {
    for (const status of ["SETUP_REQUIRED", "MANUAL_ONLY", "DUPLICATE_SKIPPED"] as const) {
      const publish = vi.fn().mockResolvedValue(fakeResult(status));
      await publishWithRetry(publish, vi.fn().mockResolvedValue(undefined));
      expect(publish).toHaveBeenCalledTimes(1);
    }
  });
});
