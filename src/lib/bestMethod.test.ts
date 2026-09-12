import { describe, expect, it } from "vitest";
import { rankMethods } from "./bestMethod";

describe("rankMethods", () => {
  it("sorts by probability descending", () => {
    const ranked = rankMethods([
      { kind: "fishing", probability: 0.01 },
      { kind: "table_item", probability: 0.45 },
      { kind: "trading", probability: 0.2 },
    ]);
    expect(ranked.map((r) => r.kind)).toEqual(["table_item", "trading", "fishing"]);
  });

  it("computes expected attempts as 1/probability", () => {
    const [ranked] = rankMethods([{ kind: "table_item", probability: 0.25 }]);
    expect(ranked.expectedAttempts).toBe(4);
  });

  it("uses Infinity for a method with zero probability, not a divide-by-zero NaN", () => {
    const [ranked] = rankMethods([{ kind: "fishing", probability: 0 }]);
    expect(ranked.expectedAttempts).toBe(Infinity);
  });

  it("carries opaque per-method detail through untouched", () => {
    const detail = { material: "iron", slot: "bottom" as const };
    const [ranked] = rankMethods([{ kind: "table_item", probability: 0.5, detail }]);
    expect(ranked.detail).toBe(detail);
  });

  it("returns an empty ranking for an empty input", () => {
    expect(rankMethods([])).toEqual([]);
  });
});
