import { afterEach, describe, expect, it } from "vitest";
import { runSeoFactory } from "@/lib/seo-factory/run";

describe("SEO Factory upstream failure safety", () => {
  const originalKey = process.env.GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT;
  const originalProperty = process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY;

  afterEach(() => {
    if (originalKey === undefined) delete process.env.GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT; else process.env.GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT = originalKey;
    if (originalProperty === undefined) delete process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY; else process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY = originalProperty;
  });

  it("fails closed before inventory mutation when GSC credentials are unavailable", async () => {
    delete process.env.GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT;
    delete process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY;
    await expect(runSeoFactory({ persist: false })).rejects.toThrow("fails closed");
  });
});
