import { describe, expect, it } from "vitest";
import { toolBaseSpeed, efficiencySpeedMultiplier, breakTimeSeconds, REFERENCE_BLOCKS } from "./miningStats";

describe("toolBaseSpeed", () => {
  it("matches the verified per-material speed table", () => {
    expect(toolBaseSpeed("diamond")).toBe(8);
    expect(toolBaseSpeed("netherite")).toBe(9);
    expect(toolBaseSpeed("golden")).toBe(12);
    expect(toolBaseSpeed("wood")).toBe(2);
  });

  it("falls back to 1 (bare-hand-equivalent) for a material with no tool-speed entry (e.g. armor-only materials)", () => {
    expect(toolBaseSpeed("leather")).toBe(1);
  });
});

describe("efficiencySpeedMultiplier", () => {
  it("adds level^2 + 1 on a correct tool (base speed > 1)", () => {
    expect(efficiencySpeedMultiplier(8, 5)).toBe(8 + 26); // diamond pickaxe, Efficiency V
    expect(efficiencySpeedMultiplier(8, 0)).toBe(8);
  });

  it("does nothing on an incorrect tool (base speed 1) -- the formula's own guard", () => {
    expect(efficiencySpeedMultiplier(1, 5)).toBe(1);
  });
});

describe("breakTimeSeconds", () => {
  it("a diamond pickaxe breaks stone (hardness 1.5) in well under a second", () => {
    const seconds = breakTimeSeconds(toolBaseSpeed("diamond"), 1.5);
    expect(seconds).toBeLessThan(1);
    expect(seconds).toBeGreaterThan(0);
  });

  it("Efficiency meaningfully speeds up obsidian (hardness 50)", () => {
    const withoutEff = breakTimeSeconds(toolBaseSpeed("diamond"), 50);
    const withEff = breakTimeSeconds(efficiencySpeedMultiplier(toolBaseSpeed("diamond"), 5), 50);
    expect(withEff).toBeLessThan(withoutEff);
  });

  it("higher hardness always takes at least as long at a fixed speed", () => {
    const speed = toolBaseSpeed("iron");
    for (let i = 1; i < REFERENCE_BLOCKS.length; i++) {
      if (REFERENCE_BLOCKS[i].hardness > REFERENCE_BLOCKS[i - 1].hardness) {
        expect(breakTimeSeconds(speed, REFERENCE_BLOCKS[i].hardness)).toBeGreaterThanOrEqual(
          breakTimeSeconds(speed, REFERENCE_BLOCKS[i - 1].hardness)
        );
      }
    }
  });
});
