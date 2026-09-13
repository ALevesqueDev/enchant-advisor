import { describe, expect, it } from "vitest";
import {
  weaponBaseStats,
  computeMeleeDamage,
  damageEnchantTarget,
  sweepingEdgeRatio,
  fireAspectSeconds,
  unbreakingSaveChance,
} from "./weaponStats";

// Values below are cross-checked against well-known, stable vanilla
// behavior (diamond sword = 7 damage/1.6 attacks-per-second is one of the
// most commonly cited numbers in the game), not just re-asserting whatever
// the extraction happened to produce -- see weaponStats.ts's header for the
// full sourcing note.
describe("weaponBaseStats", () => {
  it("matches well-known vanilla numbers for a few material/weapon pairs", () => {
    expect(weaponBaseStats("sword", "diamond")).toEqual({ attackDamage: 7, attackSpeed: 1.6, maxDamage: 1561 });
    expect(weaponBaseStats("sword", "wood")).toEqual({ attackDamage: 4, attackSpeed: 1.6, maxDamage: 59 });
    expect(weaponBaseStats("axe", "netherite")).toEqual({ attackDamage: 10, attackSpeed: 1.0, maxDamage: 2031 });
  });

  it("axes are consistently slower than swords at the same material", () => {
    for (const material of ["wood", "stone", "iron", "golden", "diamond", "netherite", "copper"] as const) {
      expect(weaponBaseStats("axe", material).attackSpeed).toBeLessThanOrEqual(weaponBaseStats("sword", material).attackSpeed);
    }
  });

  it("throws on an unknown weapon/material pair rather than returning undefined", () => {
    // @ts-expect-error -- deliberately an invalid material to test the guard
    expect(() => weaponBaseStats("sword", "obsidian")).toThrow();
  });
});

describe("computeMeleeDamage", () => {
  const diamondSword = weaponBaseStats("sword", "diamond");

  it("with no enchant, returns the weapon's plain base numbers", () => {
    const result = computeMeleeDamage(diamondSword, null, 0);
    expect(result).toEqual({ target: "generic", damagePerHit: 7, dps: 7 * 1.6 });
  });

  it("Sharpness applies universally ('generic' target) and scales +1.0 base, +0.5/level", () => {
    expect(computeMeleeDamage(diamondSword, "sharpness", 1).damagePerHit).toBeCloseTo(8.0);
    expect(computeMeleeDamage(diamondSword, "sharpness", 5).damagePerHit).toBeCloseTo(7 + 1.0 + 0.5 * 4);
    expect(damageEnchantTarget("sharpness")).toBe("generic");
  });

  it("Smite is undead-only and scales +2.5 base, +2.5/level", () => {
    expect(computeMeleeDamage(diamondSword, "smite", 5).damagePerHit).toBeCloseTo(7 + 2.5 + 2.5 * 4);
    expect(damageEnchantTarget("smite")).toBe("undead");
  });

  it("Bane of Arthropods is arthropod-only and scales +2.5 base, +2.5/level", () => {
    expect(computeMeleeDamage(diamondSword, "bane_of_arthropods", 5).damagePerHit).toBeCloseTo(7 + 2.5 + 2.5 * 4);
    expect(damageEnchantTarget("bane_of_arthropods")).toBe("arthropod");
  });

  it("dps is always damagePerHit x the weapon's own attack speed", () => {
    const r = computeMeleeDamage(diamondSword, "sharpness", 3);
    expect(r.dps).toBeCloseTo(r.damagePerHit * 1.6);
  });
});

describe("sweepingEdgeRatio / unbreakingSaveChance", () => {
  // Both verified formulas collapse to the same level/(level+1) shape --
  // real coincidence in the raw data, not a copy-paste bug (see each
  // function's own header note in weaponStats.ts).
  it("both follow level / (level + 1)", () => {
    for (const level of [1, 2, 3, 4, 5]) {
      const expected = level / (level + 1);
      expect(sweepingEdgeRatio(level)).toBeCloseTo(expected);
      expect(unbreakingSaveChance(level)).toBeCloseTo(expected);
    }
  });

  it("is 0 at level 0 (enchant not present)", () => {
    expect(sweepingEdgeRatio(0)).toBe(0);
    expect(unbreakingSaveChance(0)).toBe(0);
  });
});

describe("fireAspectSeconds", () => {
  it("converts the raw tick duration (4 + 4/level-above-first) to seconds", () => {
    expect(fireAspectSeconds(1)).toBeCloseTo(4 / 20);
    expect(fireAspectSeconds(2)).toBeCloseTo(8 / 20);
  });

  it("is 0 at level 0", () => {
    expect(fireAspectSeconds(0)).toBe(0);
  });
});
