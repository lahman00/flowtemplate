import { describe, it, expect } from "vitest";
import { recentAndPriorWindows } from "@/scripts/agents/seo/lib/date-windows";

describe("recentAndPriorWindows", () => {
  it("ends the recent window before today, accounting for Search Console's processing delay", () => {
    const now = new Date("2026-08-15T12:00:00Z");
    const { recent } = recentAndPriorWindows(28, 3, now);
    expect(recent.endDate).toBe("2026-08-12");
  });

  it("makes the prior window immediately precede the recent window with no gap or overlap", () => {
    const now = new Date("2026-08-15T12:00:00Z");
    const { recent, prior } = recentAndPriorWindows(28, 3, now);
    const dayAfterPrior = new Date(prior.endDate);
    dayAfterPrior.setUTCDate(dayAfterPrior.getUTCDate() + 1);
    expect(dayAfterPrior.toISOString().slice(0, 10)).toBe(recent.startDate);
  });

  it("makes both windows the requested length", () => {
    const now = new Date("2026-08-15T12:00:00Z");
    const { recent, prior } = recentAndPriorWindows(28, 3, now);
    const days = (w: { startDate: string; endDate: string }) => (new Date(w.endDate).getTime() - new Date(w.startDate).getTime()) / 86_400_000 + 1;
    expect(days(recent)).toBe(28);
    expect(days(prior)).toBe(28);
  });
});
