import { describe, it, expect } from "vitest";
import { getSocialStrategy, getEffectiveCadence } from "@/lib/social/strategy";

/**
 * 2026-08-17 Facebook production launch — deterministic, dated cadence
 * ramp. Driven entirely by the calendar date (never execution timing).
 */
describe("getEffectiveCadence — launch-plan ramp", () => {
  const strategy = { ...getSocialStrategy(), launchPlans: { facebook: { launchStartDate: "2026-08-17", phase1Days: 14, phase1PostsPerWeek: 7, phase2PostsPerWeek: 5 } } };

  it("phase 1 rate on the launch date itself", () => {
    expect(getEffectiveCadence(strategy, "facebook", new Date("2026-08-17T12:00:00.000Z"))).toBe(7);
  });

  it("phase 1 rate on the last day of phase 1 (day 13, 0-indexed)", () => {
    expect(getEffectiveCadence(strategy, "facebook", new Date("2026-08-30T12:00:00.000Z"))).toBe(7);
  });

  it("phase 2 rate once phase1Days have elapsed", () => {
    expect(getEffectiveCadence(strategy, "facebook", new Date("2026-08-31T12:00:00.000Z"))).toBe(5);
  });

  it("phase 2 rate stays in effect indefinitely after that", () => {
    expect(getEffectiveCadence(strategy, "facebook", new Date("2027-01-01T12:00:00.000Z"))).toBe(5);
  });

  it("zero before the launch date — nothing scheduled yet", () => {
    expect(getEffectiveCadence(strategy, "facebook", new Date("2026-08-16T12:00:00.000Z"))).toBe(0);
  });

  it("a channel with no launch plan falls back to the flat cadence number", () => {
    expect(getEffectiveCadence(strategy, "bluesky", new Date())).toBe(strategy.cadence.bluesky);
  });
});
