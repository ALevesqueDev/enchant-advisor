import { describe, expect, it } from "vitest";
import { recommend, untouchedCurrentEnchants } from "./recommend";
import type { Goal } from "./types";

const pickaxeGoal: Goal = {
  id: "mining",
  label: { en: "Mining", fr: "Minage" },
  targets: { efficiency: 5, fortune: 3, unbreaking: 3, mending: 1 },
};

describe("recommend", () => {
  it("suggests 'add' for a targeted enchant that isn't on the item yet", () => {
    const [efficiency] = recommend({}, pickaxeGoal).filter((r) => r.enchantId === "efficiency");
    expect(efficiency).toMatchObject({ status: "add", currentLevel: 0, targetLevel: 5 });
  });

  it("suggests 'upgrade' when the current level is below the target", () => {
    const [efficiency] = recommend({ efficiency: 2 }, pickaxeGoal).filter((r) => r.enchantId === "efficiency");
    expect(efficiency).toMatchObject({ status: "upgrade", currentLevel: 2, targetLevel: 5 });
  });

  it("suggests 'already-optimal' when the current level already meets the target", () => {
    const [efficiency] = recommend({ efficiency: 5 }, pickaxeGoal).filter((r) => r.enchantId === "efficiency");
    expect(efficiency).toMatchObject({ status: "already-optimal" });
    // Overshooting the target is also "already optimal", not flagged as a problem.
    const [fortune] = recommend({ fortune: 3 }, pickaxeGoal).filter((r) => r.enchantId === "fortune");
    expect(fortune).toMatchObject({ status: "already-optimal" });
  });

  it("flags a conflict when something else already on the item is mutually exclusive with a target", () => {
    // Fortune and Silk Touch share an exclusive_set (see enchantments.ts) — having
    // Silk Touch already on the pickaxe should block recommending Fortune.
    const [fortune] = recommend({ silk_touch: 1 }, pickaxeGoal).filter((r) => r.enchantId === "fortune");
    expect(fortune).toMatchObject({ status: "conflict", conflictsWith: "silk_touch" });
  });

  it("does not flag a conflict against itself", () => {
    // efficiency has no exclusive_set members at all, but this guards the
    // `id !== enchantId` check in recommend.ts regardless of which
    // enchant happens to be under test.
    const [efficiency] = recommend({ efficiency: 2 }, pickaxeGoal).filter((r) => r.enchantId === "efficiency");
    expect(efficiency.status).not.toBe("conflict");
  });
});

describe("untouchedCurrentEnchants", () => {
  it("returns current enchants the goal doesn't target", () => {
    // Knockback isn't part of the mining goal's targets at all.
    expect(untouchedCurrentEnchants({ efficiency: 3, silk_touch: 1 }, pickaxeGoal)).toEqual(["silk_touch"]);
  });

  it("returns nothing when every current enchant is part of the goal", () => {
    expect(untouchedCurrentEnchants({ efficiency: 3, fortune: 2 }, pickaxeGoal)).toEqual([]);
  });

  it("ignores zero-level entries", () => {
    expect(untouchedCurrentEnchants({ silk_touch: 0 }, pickaxeGoal)).toEqual([]);
  });
});
