import { describe, expect, it } from "vitest";
import {
  armorPiecePoints,
  armorReductionTypicalPercent,
  armorReductionFloorPercent,
  armorReductionPercent,
  totalEpf,
  epfReductionPercent,
  combinedReductionPercent,
} from "./armorStats";

describe("armorPiecePoints", () => {
  it("full diamond (or netherite) set totals 20 armor points -- the well-known max", () => {
    const total = (["helmet", "chestplate", "leggings", "boots"] as const)
      .map((slot) => armorPiecePoints(slot, "diamond").armor)
      .reduce((a, b) => a + b, 0);
    expect(total).toBe(20);
  });

  it("returns 0/0 for a material with no data for that slot (e.g. turtle_shell on chestplate)", () => {
    expect(armorPiecePoints("chestplate", "turtle_shell")).toEqual({ armor: 0, toughness: 0 });
  });
});

describe("armorReductionTypicalPercent / armorReductionFloorPercent", () => {
  it("20 armor points gives the well-known 80% typical reduction (4 x 20, capped at 80)", () => {
    expect(armorReductionTypicalPercent(20)).toBe(80);
  });

  it("the floor (minimum, large-hit) reduction is lower than the typical (small-hit) reduction", () => {
    expect(armorReductionFloorPercent(20)).toBeCloseTo(16); // 4/5 * 20
    expect(armorReductionFloorPercent(20)).toBeLessThan(armorReductionTypicalPercent(20));
  });

  it("both cap at 80%, even for an unrealistically high armor value", () => {
    expect(armorReductionTypicalPercent(100)).toBe(80);
    expect(armorReductionFloorPercent(100)).toBe(80);
  });
});

describe("armorReductionPercent", () => {
  it("approaches the typical (small-hit) value as incoming damage shrinks", () => {
    const nearZero = armorReductionPercent(20, 2, 0.01);
    expect(nearZero).toBeCloseTo(armorReductionTypicalPercent(20), 0);
  });

  it("approaches the floor as incoming damage grows large", () => {
    const bigHit = armorReductionPercent(20, 2, 1000);
    expect(bigHit).toBeCloseTo(armorReductionFloorPercent(20), 1);
  });

  it("never exceeds 80% or drops below the floor", () => {
    for (const damage of [1, 5, 10, 20, 50]) {
      const r = armorReductionPercent(20, 2, damage);
      expect(r).toBeLessThanOrEqual(80);
      expect(r).toBeGreaterThanOrEqual(armorReductionFloorPercent(20) - 0.001);
    }
  });
});

describe("totalEpf", () => {
  it("Protection contributes to every damage type", () => {
    const pieces = [{ enchantId: "protection" as const, level: 4 }];
    expect(totalEpf(pieces, "generic")).toBe(4);
    expect(totalEpf(pieces, "fire")).toBe(4);
    expect(totalEpf(pieces, "blast")).toBe(4);
    expect(totalEpf(pieces, "projectile")).toBe(4);
  });

  it("Fire Protection only contributes to fire damage, at EPF 2/level", () => {
    const pieces = [{ enchantId: "fire_protection" as const, level: 4 }];
    expect(totalEpf(pieces, "fire")).toBe(8);
    expect(totalEpf(pieces, "generic")).toBe(0);
  });

  it("stacks across multiple pieces and caps at 20", () => {
    const pieces = [
      { enchantId: "fire_protection" as const, level: 4 },
      { enchantId: "fire_protection" as const, level: 4 },
      { enchantId: "fire_protection" as const, level: 4 },
      { enchantId: "fire_protection" as const, level: 4 },
    ]; // 4 pieces x 8 EPF = 32, capped at 20
    expect(totalEpf(pieces, "fire")).toBe(20);
  });

  it("mixes Protection (all types) with a type-specific piece correctly", () => {
    const pieces = [
      { enchantId: "protection" as const, level: 4 }, // +4 to every type
      { enchantId: "fire_protection" as const, level: 4 }, // +8 to fire only
    ];
    expect(totalEpf(pieces, "fire")).toBe(12);
    expect(totalEpf(pieces, "blast")).toBe(4);
  });

  it("ignores undefined (empty) slots", () => {
    expect(totalEpf([undefined, undefined, undefined, undefined], "generic")).toBe(0);
  });
});

describe("epfReductionPercent", () => {
  it("max EPF (20) gives the well-known 80% cap (20/25)", () => {
    expect(epfReductionPercent(20)).toBe(80);
  });

  it("is 0 at EPF 0", () => {
    expect(epfReductionPercent(0)).toBe(0);
  });
});

describe("combinedReductionPercent", () => {
  it("combines multiplicatively, not additively -- two 50% reductions don't sum to 100%", () => {
    expect(combinedReductionPercent(50, 50)).toBeCloseTo(75);
  });

  it("0% + 0% stays 0%", () => {
    expect(combinedReductionPercent(0, 0)).toBe(0);
  });

  it("either stage at 100% would fully block damage (sanity bound, even though neither stage alone can reach 100% in practice)", () => {
    expect(combinedReductionPercent(100, 0)).toBe(100);
  });
});
