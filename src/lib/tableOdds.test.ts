import { describe, expect, it } from "vitest";
import { slotLevelRange } from "./tableOdds";

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
