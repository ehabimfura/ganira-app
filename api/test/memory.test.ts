import { describe, expect, test } from "vitest";
import { FIRST_HALF_LIFE_HOURS, kigaliDay, nextHalfLife, recallChance, streakLength } from "../src/practice/memory.js";

describe("how likely a phrase is remembered (half-life regression)", () => {
  test("just practised: certain; one half-life later: even odds", () => {
    expect(recallChance(24, 0)).toBe(1);
    expect(recallChance(24, 24)).toBeCloseTo(0.5);
    expect(recallChance(24, 48)).toBeCloseTo(0.25);
  });

  test("a right answer doubles the half-life and a wrong one halves it, within limits", () => {
    expect(nextHalfLife(FIRST_HALF_LIFE_HOURS, true)).toBe(FIRST_HALF_LIFE_HOURS * 2);
    expect(nextHalfLife(24, false)).toBe(12);
    expect(nextHalfLife(1, false)).toBe(1);
    expect(nextHalfLife(24 * 365, true)).toBe(24 * 365);
  });
});

describe("days and streaks, in Kigali time", () => {
  test("a day starts at midnight in Kigali (UTC+2)", () => {
    expect(kigaliDay(new Date("2026-11-15T21:59:00Z"))).toBe("2026-11-15");
    expect(kigaliDay(new Date("2026-11-15T22:00:00Z"))).toBe("2026-11-16");
  });

  test("the streak counts days in a row up to today", () => {
    expect(streakLength(["2026-11-13", "2026-11-14", "2026-11-15"], "2026-11-15")).toBe(3);
  });

  test("a streak survives until the end of today, so yesterday still counts", () => {
    expect(streakLength(["2026-11-13", "2026-11-14"], "2026-11-15")).toBe(2);
  });

  test("a missed day ends the streak, and no practice means no streak", () => {
    expect(streakLength(["2026-11-11", "2026-11-12", "2026-11-14", "2026-11-15"], "2026-11-15")).toBe(2);
    expect(streakLength(["2026-11-12"], "2026-11-15")).toBe(0);
    expect(streakLength([], "2026-11-15")).toBe(0);
  });
});
