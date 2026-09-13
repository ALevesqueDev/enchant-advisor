import { describe, expect, it } from "vitest";
import { encodeHave, patchShareParams, readShareParams } from "./shareLink";

describe("encodeHave", () => {
  it("joins non-zero entries as id:level pairs", () => {
    expect(encodeHave({ efficiency: 5, unbreaking: 3 })).toBe("efficiency:5,unbreaking:3");
  });

  it("drops zero-level entries", () => {
    expect(encodeHave({ efficiency: 0, fortune: 2 })).toBe("fortune:2");
  });

  it("returns an empty string for an empty set", () => {
    expect(encodeHave({})).toBe("");
  });
});

describe("readShareParams", () => {
  it("returns all-null when the URL carries none of our params", () => {
    expect(readShareParams(new URLSearchParams(""))).toEqual({
      mode: null,
      locale: null,
      advisor: null,
      search: null,
    });
  });

  it("round-trips an advisor link", () => {
    const params = new URLSearchParams({
      m: "a",
      l: "en",
      it: "pickaxe",
      mt: "iron",
      g: "mining",
      h: "efficiency:5,unbreaking:3",
    });
    const decoded = readShareParams(params);
    expect(decoded.mode).toBe("advisor");
    expect(decoded.locale).toBe("en");
    expect(decoded.advisor).toEqual({
      category: "pickaxe",
      material: "iron",
      goalId: "mining",
      current: { efficiency: 5, unbreaking: 3 },
    });
    expect(decoded.search).toBeNull();
  });

  it("round-trips a search link, defaulting luckOfTheSea to 0 and bookshelves to 15 when absent", () => {
    const params = new URLSearchParams({ m: "s", e: "fortune", lv: "3", c: "pickaxe" });
    const decoded = readShareParams(params);
    expect(decoded.mode).toBe("search");
    expect(decoded.search).toEqual({
      enchantId: "fortune",
      level: 3,
      category: "pickaxe",
      luckOfTheSea: 0,
      bookshelves: 15,
    });
  });

  it("reads an explicit bookshelves/luckOfTheSea override", () => {
    const params = new URLSearchParams({ m: "s", e: "fortune", lv: "3", c: "pickaxe", bs: "9", lk: "2" });
    const decoded = readShareParams(params);
    expect(decoded.search).toMatchObject({ bookshelves: 9, luckOfTheSea: 2 });
  });

  it("recognizes the stats mode letter", () => {
    expect(readShareParams(new URLSearchParams({ m: "t" })).mode).toBe("stats");
  });

  it("recognizes the anvil mode letter", () => {
    expect(readShareParams(new URLSearchParams({ m: "n" })).mode).toBe("anvil");
  });

  it("ignores an unrecognized mode letter rather than guessing", () => {
    expect(readShareParams(new URLSearchParams({ m: "x" })).mode).toBeNull();
  });

  it("silently drops malformed 'have' entries instead of crashing", () => {
    const params = new URLSearchParams({ m: "a", it: "pickaxe", g: "mining", h: "efficiency:5,garbage,fortune:0" });
    // fortune:0 is dropped (zero level), "garbage" has no ':level' and is dropped too.
    expect(readShareParams(params).advisor?.current).toEqual({ efficiency: 5 });
  });
});

describe("patchShareParams", () => {
  it("is a safe no-op outside a browser (no window/history)", () => {
    expect(() => patchShareParams({ m: "a" })).not.toThrow();
  });
});
