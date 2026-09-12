import { describe, expect, it } from "vitest";
import { advisorReducer, initialAdvisorState } from "./advisorState";

describe("initialAdvisorState", () => {
  it("defaults to diamond when the category has material variants", () => {
    expect(initialAdvisorState("pickaxe").material).toBe("diamond");
  });

  it("has no material for a category without variants", () => {
    expect(initialAdvisorState("bow").material).toBeUndefined();
  });

  it("starts with an empty current-enchants set", () => {
    expect(initialAdvisorState("pickaxe").current).toEqual({});
  });
});

describe("advisorReducer", () => {
  const pickaxeState = initialAdvisorState("pickaxe");

  it("CHANGE_CATEGORY resets material/goal/current together, not just the category", () => {
    const dirty = { ...pickaxeState, material: "iron" as const, goalId: "mining", current: { efficiency: 3 } };
    const next = advisorReducer(dirty, { type: "CHANGE_CATEGORY", category: "sword" });
    expect(next).toEqual(initialAdvisorState("sword"));
  });

  it("SET_MATERIAL only touches material", () => {
    const next = advisorReducer(pickaxeState, { type: "SET_MATERIAL", material: "iron" });
    expect(next).toEqual({ ...pickaxeState, material: "iron" });
  });

  it("SET_GOAL only touches goalId", () => {
    const next = advisorReducer(pickaxeState, { type: "SET_GOAL", goalId: "mining" });
    expect(next).toEqual({ ...pickaxeState, goalId: "mining" });
  });

  describe("SET_LEVEL", () => {
    it("adds an enchant at a positive level", () => {
      const next = advisorReducer(pickaxeState, { type: "SET_LEVEL", enchantId: "efficiency", level: 3 });
      expect(next.current).toEqual({ efficiency: 3 });
    });

    it("removes an enchant when the level drops to 0", () => {
      const withOne = { ...pickaxeState, current: { efficiency: 3 } };
      const next = advisorReducer(withOne, { type: "SET_LEVEL", enchantId: "efficiency", level: 0 });
      expect(next.current).toEqual({});
    });

    it("leaves other enchants untouched", () => {
      const withTwo = { ...pickaxeState, current: { efficiency: 3, unbreaking: 2 } };
      const next = advisorReducer(withTwo, { type: "SET_LEVEL", enchantId: "efficiency", level: 5 });
      expect(next.current).toEqual({ efficiency: 5, unbreaking: 2 });
    });
  });

  describe("HYDRATE", () => {
    it("ignores a missing/invalid category and returns the state unchanged", () => {
      expect(advisorReducer(pickaxeState, { type: "HYDRATE", advisor: null })).toBe(pickaxeState);
      expect(advisorReducer(pickaxeState, { type: "HYDRATE", advisor: { category: "not-a-real-category" as never } })).toBe(
        pickaxeState
      );
    });

    it("applies a fully valid advisor share state", () => {
      const next = advisorReducer(pickaxeState, {
        type: "HYDRATE",
        advisor: { category: "pickaxe", material: "iron", goalId: "mining", current: { efficiency: 3, unbreaking: 2 } },
      });
      expect(next).toEqual({ category: "pickaxe", material: "iron", goalId: "mining", current: { efficiency: 3, unbreaking: 2 } });
    });

    it("falls back to the default material when the given one doesn't apply to the category", () => {
      const next = advisorReducer(pickaxeState, {
        type: "HYDRATE",
        advisor: { category: "pickaxe", material: "leather" as never, goalId: "mining", current: {} },
      });
      expect(next.material).toBe("diamond");
    });

    it("falls back to the category's first goal when the given goalId doesn't exist for it", () => {
      const next = advisorReducer(pickaxeState, {
        type: "HYDRATE",
        advisor: { category: "pickaxe", goalId: "not-a-real-goal", current: {} },
      });
      expect(next.goalId).toBe(initialAdvisorState("pickaxe").goalId);
    });

    it("drops current-enchant entries that don't apply to the category, are out of range, or are zero", () => {
      const next = advisorReducer(pickaxeState, {
        type: "HYDRATE",
        advisor: {
          category: "pickaxe",
          goalId: "mining",
          current: { efficiency: 3, not_a_real_enchant: 5, unbreaking: 0, fortune: 99 },
        },
      });
      expect(next.current).toEqual({ efficiency: 3 });
    });
  });
});
