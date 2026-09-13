import { describe, expect, it } from "vitest";
import { simulateAnvilCombine, type AnvilSlot } from "./anvilSimulator";

const empty: AnvilSlot = { enchantId: null, level: 0, priorUses: 0 };

describe("simulateAnvilCombine", () => {
  it("a fresh book applied to a bare item costs anvilCost x level, no penalty", () => {
    // efficiency's anvilCost is 1 (enchantment-data.json) -- matches anvil.test.ts's own known value.
    const result = simulateAnvilCombine(empty, { enchantId: "efficiency", level: 5, priorUses: 0 }, false);
    expect(result).toEqual({ status: "ok", resultEnchantId: "efficiency", resultLevel: 5, cost: 5, tooExpensive: false });
  });

  it("same enchant, equal levels: bumps by exactly 1 (capped at maxLevel)", () => {
    const target: AnvilSlot = { enchantId: "efficiency", level: 2, priorUses: 0 };
    const sacrifice: AnvilSlot = { enchantId: "efficiency", level: 2, priorUses: 0 };
    const result = simulateAnvilCombine(target, sacrifice, false);
    expect(result).toEqual({ status: "ok", resultEnchantId: "efficiency", resultLevel: 3, cost: 3, tooExpensive: false });
  });

  it("same enchant at max level, equal levels: stays capped, doesn't overflow past maxLevel", () => {
    const maxed: AnvilSlot = { enchantId: "efficiency", level: 5, priorUses: 0 }; // efficiency's maxLevel is 5
    const result = simulateAnvilCombine(maxed, maxed, false);
    expect(result.status).toBe("ok");
    expect(result).toMatchObject({ resultLevel: 5 });
  });

  it("same enchant, unequal levels: the higher level wins, no bonus", () => {
    const target: AnvilSlot = { enchantId: "efficiency", level: 4, priorUses: 0 };
    const sacrifice: AnvilSlot = { enchantId: "efficiency", level: 2, priorUses: 0 };
    const result = simulateAnvilCombine(target, sacrifice, false);
    expect(result).toEqual({ status: "ok", resultEnchantId: "efficiency", resultLevel: 4, cost: 4, tooExpensive: false });
  });

  it("mutually incompatible enchantments block the combine entirely", () => {
    const target: AnvilSlot = { enchantId: "fortune", level: 1, priorUses: 0 };
    const sacrifice: AnvilSlot = { enchantId: "silk_touch", level: 1, priorUses: 0 };
    expect(simulateAnvilCombine(target, sacrifice, false)).toEqual({ status: "blocked-incompatible" });
  });

  it("an empty sacrifice with no renaming is a real no-op, not a free/zero-cost result", () => {
    expect(simulateAnvilCombine({ enchantId: "efficiency", level: 3, priorUses: 0 }, empty, false)).toEqual({ status: "nothing-to-do" });
  });

  it("renaming alone (empty sacrifice) is a valid, flat 1-level operation", () => {
    const result = simulateAnvilCombine(empty, empty, true);
    expect(result).toEqual({ status: "ok", resultEnchantId: "", resultLevel: 0, cost: 1, tooExpensive: false });
  });

  it("prior uses on either slot add their own 2^n-1 penalty, on top of the enchant cost", () => {
    const target: AnvilSlot = { enchantId: null, level: 0, priorUses: 2 }; // penalty 2^2-1 = 3
    const sacrifice: AnvilSlot = { enchantId: "efficiency", level: 1, priorUses: 1 }; // penalty 2^1-1 = 1
    const result = simulateAnvilCombine(target, sacrifice, false);
    expect(result).toEqual({ status: "ok", resultEnchantId: "efficiency", resultLevel: 1, cost: 3 + 1 + 1, tooExpensive: false });
  });

  it("flags a result over the 39-level survival cap", () => {
    const target: AnvilSlot = { enchantId: null, level: 0, priorUses: 6 }; // 2^6-1 = 63, already over on its own
    const result = simulateAnvilCombine(target, { enchantId: "efficiency", level: 1, priorUses: 0 }, false);
    expect(result.status).toBe("ok");
    expect((result as { tooExpensive: boolean }).tooExpensive).toBe(true);
  });
});
