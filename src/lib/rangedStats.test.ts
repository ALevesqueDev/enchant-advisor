import { describe, expect, it } from "vitest";
import { powerBonusDamage, piercingCount, MULTISHOT_ARROW_COUNT, quickChargeReductionSeconds } from "./rangedStats";

describe("powerBonusDamage", () => {
  it("matches the verified formula: +1.0 base, +0.5/level", () => {
    expect(powerBonusDamage(1)).toBeCloseTo(1.0);
    expect(powerBonusDamage(5)).toBeCloseTo(1.0 + 0.5 * 4);
  });

  it("is 0 at level 0", () => {
    expect(powerBonusDamage(0)).toBe(0);
  });
});

describe("piercingCount", () => {
  it("matches the verified formula: +1/level", () => {
    expect(piercingCount(1)).toBe(1);
    expect(piercingCount(4)).toBe(4);
  });
});

describe("MULTISHOT_ARROW_COUNT", () => {
  it("is the well-known 3 arrows (max_level 1 -- a flag, not a scaling bonus)", () => {
    expect(MULTISHOT_ARROW_COUNT).toBe(3);
  });
});

describe("quickChargeReductionSeconds", () => {
  it("matches the verified formula: -0.25s base, -0.25s/level (negative -- a reduction)", () => {
    expect(quickChargeReductionSeconds(1)).toBeCloseTo(-0.25);
    expect(quickChargeReductionSeconds(3)).toBeCloseTo(-0.75);
  });

  it("is 0 at level 0", () => {
    expect(quickChargeReductionSeconds(0)).toBe(0);
  });
});
