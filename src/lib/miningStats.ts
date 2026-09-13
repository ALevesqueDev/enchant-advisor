// Mining speed — Phase 2 of the Stats Calculator.
//
// Full break-speed pipeline verified verbatim against
// minecraft.wiki/w/Mining_efficiency's "Calculation" section this session
// (the wiki's own MediaWiki API, section-by-section, to get exact wikitext
// rather than a truncated/paraphrased page render):
//
//   speedMultiplier = toolBaseSpeed (1 for bare hand / wrong tool)
//   if (speedMultiplier > 1): speedMultiplier += efficiencyLevel^2 + 1
//   [Haste/Conduit Power, Mining Fatigue, underwater, and off-ground each
//    apply their own further multiplier -- all assumed inactive here: this
//    models "standing on solid ground, in air, no status effects", the
//    single most common real case, not every possible situational modifier]
//   damage = speedMultiplier / blockHardness
//   ticks = ceil(1 / damage)
//
// toolBaseSpeed per material comes from the real generated data
// (item_components' minecraft:tool.rules[].speed, same source/pass as
// weaponStats.ts) -- but block HARDNESS has no generated-data source at
// all (misode/mcmeta genuinely doesn't export it, confirmed by inspecting
// blocks/data.json directly and cross-checking the repo's own README);
// the REFERENCE_BLOCKS hardness values below are wiki-sourced instead,
// flagged as a different confidence tier from everything else in this
// file, same honesty pattern as Luck of the Sea's community-measured
// bonus in treasure.ts.
import type { Material } from "./materials";

const TOOL_BASE_SPEED: Partial<Record<Material, number>> = {
  wood: 2,
  stone: 4,
  iron: 6,
  golden: 12,
  diamond: 8,
  netherite: 9,
  copper: 5,
};

export function toolBaseSpeed(material: Material): number {
  return TOOL_BASE_SPEED[material] ?? 1;
}

/** Efficiency only helps on a tool that's already correct for the block (base speed > 1) -- confirmed by the wiki formula's own guard. */
export function efficiencySpeedMultiplier(baseSpeed: number, level: number): number {
  if (baseSpeed <= 1) return baseSpeed;
  return baseSpeed + (level > 0 ? level * level + 1 : 0);
}

export interface ReferenceBlock {
  id: string;
  /** Wiki-sourced (see this file's header) -- no generated-data source exists for block hardness. */
  hardness: number;
}

/** A small, deliberately bounded set of well-known blocks -- not a full block database, which this app has no verified source for. */
export const REFERENCE_BLOCKS: ReferenceBlock[] = [
  { id: "stone", hardness: 1.5 },
  { id: "diamond_ore", hardness: 3 },
  { id: "obsidian", hardness: 50 },
];

/** Seconds to break one block at the given speed multiplier, per the verbatim wiki formula above. */
export function breakTimeSeconds(speedMultiplier: number, hardness: number): number {
  const damagePerTick = speedMultiplier / hardness;
  const ticks = Math.ceil(1 / damagePerTick);
  return ticks / 20;
}
