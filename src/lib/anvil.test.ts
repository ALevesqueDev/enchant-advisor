import { describe, expect, it } from "vitest";
import { planAnvilCombines, planBuildUp, summarizeShoppingList } from "./anvil";
import { enchantmentById } from "./enchantments";

describe("planAnvilCombines", () => {
  it("prices a single fresh-book application with zero prior-work penalty", () => {
    const plan = planAnvilCombines([{ id: "efficiency", level: 5 }]);
    // efficiency's anvilCost is 1 (enchantment-data.json) -> 1 * level 5 = 5, no penalty on the first operation.
    expect(plan.steps).toEqual([
      { enchantId: "efficiency", level: 5, priorWorkPenalty: 0, enchantCost: 5, stepCost: 5, tooExpensive: false },
    ]);
    expect(plan.totalCost).toBe(5);
    expect(plan.anyTooExpensive).toBe(false);
  });

  it("grows the prior-work penalty 2^n-1 with each subsequent step", () => {
    const plan = planAnvilCombines([
      { id: "efficiency", level: 1 },
      { id: "efficiency", level: 1 },
      { id: "efficiency", level: 1 },
      { id: "efficiency", level: 1 },
    ]);
    expect(plan.steps.map((s) => s.priorWorkPenalty)).toEqual([0, 1, 3, 7]);
  });

  it("totals the same cost regardless of step order (the file's core order-invariance claim)", () => {
    const targetsA = [
      { id: "efficiency", level: 5 },
      { id: "fortune", level: 3 },
      { id: "unbreaking", level: 3 },
      { id: "mending", level: 1 },
    ];
    const targetsB = [...targetsA].reverse();
    expect(planAnvilCombines(targetsA).totalCost).toBe(planAnvilCombines(targetsB).totalCost);
  });

  it("flags a step over the 39-level survival cap", () => {
    // Pushing enough zero-cost-book steps first drives the prior-work
    // penalty past 39 on its own, regardless of the enchant's own cost.
    const targets = Array.from({ length: 7 }, () => ({ id: "unbreaking", level: 1 }));
    const plan = planAnvilCombines(targets);
    expect(plan.anyTooExpensive).toBe(true);
    expect(plan.steps.at(-1)!.tooExpensive).toBe(true);
  });
});

describe("planBuildUp", () => {
  it("returns null when there's nothing to build (already at or past the target)", () => {
    expect(planBuildUp(1, 5, 5)).toBeNull();
    expect(planBuildUp(1, 5, 3)).toBeNull();
  });

  // These three were confirmed against the live game during development
  // (see PROJECT.md's roadmap entry for the anvil optimizer) -- pinning
  // them here so a future change to the formula gets caught immediately.
  it("matches the confirmed-live cost for Efficiency V built from scratch (anvilCost 1)", () => {
    const plan = planBuildUp(1, 0, 5);
    expect(plan?.totalCost).toBe(75);
    expect(plan?.level1BooksNeeded).toBe(16);
  });

  it("matches the confirmed-live cost for Fortune III built from scratch (anvilCost 4)", () => {
    const plan = planBuildUp(4, 0, 3);
    expect(plan?.totalCost).toBe(30);
    expect(plan?.level1BooksNeeded).toBe(4);
  });

  it("matches the confirmed-live cost for Unbreaking III built from scratch (anvilCost 2)", () => {
    const plan = planBuildUp(2, 0, 3);
    expect(plan?.totalCost).toBe(16);
    expect(plan?.level1BooksNeeded).toBe(4);
  });

  it("needs fewer level-1 books when starting from a level already in hand", () => {
    const fromScratch = planBuildUp(1, 0, 5)!;
    const fromLevelTwo = planBuildUp(1, 2, 5)!;
    expect(fromLevelTwo.level1BooksNeeded).toBeLessThan(fromScratch.level1BooksNeeded);
  });
});

describe("summarizeShoppingList", () => {
  // Cross-checked against the anvil optimizer's already-confirmed-live
  // numbers above: Efficiency V (16 books/75 XP), Fortune III (4/30),
  // Unbreaking III (4/16), Mending I needs no build-up (target level 1).
  it("matches the pickaxe mining goal's known totals end to end", () => {
    const targets = [
      { id: "efficiency", level: 5 },
      { id: "fortune", level: 3 },
      { id: "unbreaking", level: 3 },
      { id: "mending", level: 1 },
    ];
    const plan = planAnvilCombines(targets);
    const buildUps = targets.map((t) => planBuildUp(enchantmentById(t.id).anvilCost, 0, t.level));
    const totals = summarizeShoppingList(plan.totalCost, buildUps);

    expect(plan.totalCost).toBe(38);
    expect(totals.level1Books).toBe(25); // 16 + 4 + 4 + 1 (Mending needs just its own single Level 1 book)
    expect(totals.totalXp).toBe(38 + 121); // main sequence + (75 + 30 + 16 + 0) build-up XP
  });

  it("needs exactly 1 level-1 book per step when nothing requires building up", () => {
    const totals = summarizeShoppingList(10, [null, null, null]);
    expect(totals.level1Books).toBe(3);
    expect(totals.totalXp).toBe(10);
  });

  it("returns the main sequence cost unchanged when there are no steps at all", () => {
    expect(summarizeShoppingList(0, [])).toEqual({ level1Books: 0, totalXp: 0 });
  });
});
