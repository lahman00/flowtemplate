import { describe, it, expect } from "vitest";
import { localTimeToUtc } from "@/lib/social/timezone";

/**
 * 2026-08-18 — DST correctness for the Facebook daily-publish schedule.
 * 13:00 America/New_York must resolve to 17:00 UTC during EDT (roughly
 * mid-March to early November) and 18:00 UTC during EST (the rest of the
 * year) — never a single fixed UTC hour, and never Israel time.
 */
describe("localTimeToUtc", () => {
  it("resolves 13:00 America/New_York to 17:00 UTC in EDT (summer)", () => {
    const day = new Date(Date.UTC(2026, 7, 18)); // August 18 — EDT
    const result = localTimeToUtc(day, 13, 0, "America/New_York");
    expect(result.toISOString()).toBe("2026-08-18T17:00:00.000Z");
  });

  it("resolves 13:00 America/New_York to 18:00 UTC in EST (winter)", () => {
    const day = new Date(Date.UTC(2026, 0, 15)); // January 15 — EST
    const result = localTimeToUtc(day, 13, 0, "America/New_York");
    expect(result.toISOString()).toBe("2026-01-15T18:00:00.000Z");
  });

  it("handles the day after the spring-forward transition correctly (EDT already in effect)", () => {
    // 2026's US spring-forward is the 2nd Sunday of March = March 8.
    const day = new Date(Date.UTC(2026, 2, 9));
    const result = localTimeToUtc(day, 13, 0, "America/New_York");
    expect(result.toISOString()).toBe("2026-03-09T17:00:00.000Z");
  });

  it("handles the day after the fall-back transition correctly (EST already in effect)", () => {
    // 2026's US fall-back is the 1st Sunday of November = November 1.
    const day = new Date(Date.UTC(2026, 10, 2));
    const result = localTimeToUtc(day, 13, 0, "America/New_York");
    expect(result.toISOString()).toBe("2026-11-02T18:00:00.000Z");
  });

  it("never hardcodes an Israel offset (UTC+2/+3) — the resolved hour must differ from a naive Asia/Jerusalem mapping", () => {
    const day = new Date(Date.UTC(2026, 7, 18));
    const ny = localTimeToUtc(day, 13, 0, "America/New_York");
    const jerusalem = localTimeToUtc(day, 13, 0, "Asia/Jerusalem");
    expect(ny.toISOString()).not.toBe(jerusalem.toISOString());
  });
});
