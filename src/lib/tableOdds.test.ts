import { describe, expect, it } from "vitest";
import { slotLevelRange, bookshelfCurve } from "./tableOdds";
import { materialsFor, enchantability } from "./materials";

// slotLevelRange() is the deterministic min/max envelope of the bookshelf
// formula (rollSlotLevel() re-rolls randomly within it every trial, so it
// isn't itself unit-testable without a statistical test — this pins down
// the part that is: the formula's boundaries). Values verified against
// minecraft.wiki/w/Enchanting_mechanics on 2026-09-12 and cross-checked by
// simulating the formula directly (see PROJECT.md's bookshelf-count-helper
// roadmap entry) before this test existed.
describe("slotLevelRange", () => {
  it("matches the well-known 'no bookshelves' ranges", () => {
    expect(slotLevelRange("top", 0)).toEqual({ min: 1, max: 2 });
    expect(slotLevelRange("middle", 0)).toEqual({ min: 1, max: 6 });
    expect(slotLevelRange("bottom", 0)).toEqual({ min: 1, max: 8 });
  });

  it("matches the well-known '15 bookshelves' ranges, including the guaranteed level-30 bottom slot", () => {
    expect(slotLevelRange("top", 15)).toEqual({ min: 2, max: 10 });
    expect(slotLevelRange("middle", 15)).toEqual({ min: 6, max: 21 });
    expect(slotLevelRange("bottom", 15)).toEqual({ min: 30, max: 30 });
  });

  it("caps bookshelves at 15 -- more than that has no further effect", () => {
    expect(slotLevelRange("bottom", 15)).toEqual(slotLevelRange("bottom", 30));
    expect(slotLevelRange("top", 15)).toEqual(slotLevelRange("top", 999));
  });

  it("never returns a range narrower than min <= max", () => {
    for (let b = 0; b <= 15; b++) {
      for (const slot of ["top", "middle", "bottom"] as const) {
        const range = slotLevelRange(slot, b);
        expect(range.min).toBeLessThanOrEqual(range.max);
        expect(range.min).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

describe("bookshelfCurve", () => {
  const materials = materialsFor("pickaxe").map((m) => ({ id: m, enchantability: enchantability("pickaxe", m) }));

  it("returns exactly one point per bookshelf count, 0 through 15", () => {
    const curve = bookshelfCurve("pickaxe", "efficiency", 3, materials, 300);
    expect(curve).toHaveLength(16);
    expect(curve.map((p) => p.bookshelves)).toEqual(Array.from({ length: 16 }, (_, i) => i));
  });

  it("is monotonically non-decreasing -- more bookshelves never hurts your odds", () => {
    // Every bookshelf count's achievable level range is a superset of a
    // lower count's (see slotLevelRange), so the best achievable
    // probability can only stay the same or improve. A real regression
    // in the underlying formula (e.g. bookshelves capped incorrectly)
    // would show up here as a dip.
    //
    // 800 trials/point + a 0.05 tolerance flaked in CI (observed directly,
    // not just in theory: 1 failure in ~16 runs while re-verifying npm ci
    // for the comparison-panel feature) -- each point is the max of ~18
    // material x slot Monte-Carlo estimates, so the noise on a
    // point-to-point difference is wider than a single proportion's
    // standard error suggests. Bumped to 2500 trials/point (cuts noise by
    // ~sqrt(800/2500) ≈ 0.57x) and a 0.06 tolerance; re-run 30x with zero
    // failures before trusting this (see diagnosing-bugs' non-deterministic-
    // bug guidance: raise the reproduction rate until the fix is verifiable,
    // don't just widen the tolerance and hope).
    const curve = bookshelfCurve("pickaxe", "efficiency", 3, materials, 2500);
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].probability).toBeGreaterThanOrEqual(curve[i - 1].probability - 0.06); // small Monte-Carlo noise tolerance
    }
  });

  it("all probabilities stay within [0, 1]", () => {
    const curve = bookshelfCurve("pickaxe", "efficiency", 3, materials, 300);
    for (const point of curve) {
      expect(point.probability).toBeGreaterThanOrEqual(0);
      expect(point.probability).toBeLessThanOrEqual(1);
    }
  });
});
