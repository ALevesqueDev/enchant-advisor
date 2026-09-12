import { describe, expect, it } from "vitest";
import { rankMethods, computeBestMethods } from "./bestMethod";
import { isStructureLootOnly } from "./treasure";

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

describe("computeBestMethods", () => {
  it("ranks table + book + trading + fishing for an ordinary non-treasure enchant", () => {
    const ranked = computeBestMethods({
      category: "pickaxe",
      enchantId: "efficiency",
      level: 3,
      bookshelves: 15,
      trialsPerPoint: 500, // small trial count -- this test only checks shape/ordering, not exact odds (see tableOdds.test.ts for the formula itself)
    });
    expect(ranked).not.toBeNull();
    const kinds = ranked!.map((r) => r.kind).sort();
    expect(kinds).toEqual(["fishing", "table_book", "table_item", "trading"]);
    // Results should already be sorted descending by probability.
    for (let i = 1; i < ranked!.length; i++) {
      expect(ranked![i - 1].probability).toBeGreaterThanOrEqual(ranked![i].probability);
    }
  });

  it("skips the table methods for a treasure-only enchant (the table can never offer it)", () => {
    const ranked = computeBestMethods({
      category: "boots",
      enchantId: "frost_walker",
      level: 2,
      bookshelves: 15,
      trialsPerPoint: 500,
    });
    expect(ranked!.some((r) => r.kind === "table_item" || r.kind === "table_book")).toBe(false);
    expect(ranked!.some((r) => r.kind === "trading" || r.kind === "fishing")).toBe(true);
  });

  it("returns only structure-loot-only enchants with no trading/fishing methods", () => {
    expect(isStructureLootOnly("swift_sneak")).toBe(true);
    const ranked = computeBestMethods({
      category: "leggings",
      enchantId: "swift_sneak",
      level: 1,
      bookshelves: 15,
      trialsPerPoint: 500,
    });
    expect(ranked).toBeNull();
  });
});
