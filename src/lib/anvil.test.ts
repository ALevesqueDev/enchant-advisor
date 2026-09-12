import { describe, expect, it } from "vitest";
import { planAnvilCombines, planBuildUp } from "./anvil";

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
