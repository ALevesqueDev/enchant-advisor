// Enchantment database — Java Edition. Pinned to the version in
// gameVersion.ts — re-verify against github.com/misode/mcmeta (tag
// `<version>-data`) whenever that constant is bumped.
//
// Pulled from the actual generated game data (github.com/misode/mcmeta,
// which mirrors Mojang's data generator output) on 2026-09-11, not from
// memory or from wiki prose summaries — see PROJECT.md for why: a first
// pass using a wiki-summarizing fetch produced a fabricated enchantment
// ("Cleaving") that doesn't exist in the actual game registry, caught only
// by cross-checking against this raw data. The `weight`, `maxLevel`,
// `minCost`, `maxCost`, and `anvilCost` fields below are exact values from
// `data/minecraft/enchantment/<id>.json`; `incompatibleWith` is generated
// from the real `tags/enchantment/exclusive_set/*.json` group membership
// (see EXCLUSIVE_SETS) rather than hand-typed per enchantment, so it can't
// drift out of sync the way a manually-maintained list would.
//
// Two content notes for whoever touches this next, both confirmed against
// the raw data rather than assumed: "spear" (with its Lunge enchantment)
// and "copper" tools/armor both exist in the current game and are recent
// enough that this assistant didn't know about either before checking.
//
// Axes get the tool line (Efficiency/Fortune/Silk Touch) AND the combat
// line (Sharpness/Smite/Bane of Arthropods/Impaling's exclusive_set, though
// Impaling itself is trident-only) — but NOT Knockback, Fire Aspect,
// Looting, or Sweeping Edge, which stay sword-exclusive.

import type { Enchantment, ItemCategory } from "./types";

const ALL_ARMOR: ItemCategory[] = ["helmet", "chestplate", "leggings", "boots"];
const MINING_TOOLS: ItemCategory[] = ["pickaxe", "shovel", "hoe", "axe"];
const COMBAT_BLADES: ItemCategory[] = ["sword", "axe", "mace", "spear"];
const EVERYTHING_DURABLE: ItemCategory[] = [
  ...ALL_ARMOR, "elytra", "shield", ...MINING_TOOLS, ...COMBAT_BLADES, "bow", "crossbow", "trident", "fishing_rod",
];

// Raw per-enchantment data, before incompatibilities are derived below.
type RawEnchantment = Omit<Enchantment, "incompatibleWith">;

const RAW: RawEnchantment[] = [
  // --- Armor: protection line ---
  { id: "protection", name: "Protection", maxLevel: 4, treasureOnly: false, categories: ALL_ARMOR, anvilCost: 1, weight: 10, minCost: { base: 1, perLevelAboveFirst: 11 }, maxCost: { base: 12, perLevelAboveFirst: 11 } },
  { id: "fire_protection", name: "Fire Protection", maxLevel: 4, treasureOnly: false, categories: ALL_ARMOR, anvilCost: 2, weight: 5, minCost: { base: 10, perLevelAboveFirst: 8 }, maxCost: { base: 18, perLevelAboveFirst: 8 } },
  { id: "blast_protection", name: "Blast Protection", maxLevel: 4, treasureOnly: false, categories: ALL_ARMOR, anvilCost: 4, weight: 2, minCost: { base: 5, perLevelAboveFirst: 8 }, maxCost: { base: 13, perLevelAboveFirst: 8 } },
  { id: "projectile_protection", name: "Projectile Protection", maxLevel: 4, treasureOnly: false, categories: ALL_ARMOR, anvilCost: 2, weight: 5, minCost: { base: 3, perLevelAboveFirst: 6 }, maxCost: { base: 9, perLevelAboveFirst: 6 } },

  { id: "thorns", name: "Thorns", maxLevel: 3, treasureOnly: false, categories: ALL_ARMOR, anvilCost: 8, weight: 1, minCost: { base: 10, perLevelAboveFirst: 20 }, maxCost: { base: 60, perLevelAboveFirst: 20 } },
  { id: "respiration", name: "Respiration", maxLevel: 3, treasureOnly: false, categories: ["helmet"], anvilCost: 4, weight: 2, minCost: { base: 10, perLevelAboveFirst: 10 }, maxCost: { base: 40, perLevelAboveFirst: 10 } },
  { id: "aqua_affinity", name: "Aqua Affinity", maxLevel: 1, treasureOnly: false, categories: ["helmet"], anvilCost: 4, weight: 2, minCost: { base: 1, perLevelAboveFirst: 0 }, maxCost: { base: 41, perLevelAboveFirst: 0 } },
  { id: "depth_strider", name: "Depth Strider", maxLevel: 3, treasureOnly: false, categories: ["boots"], anvilCost: 4, weight: 2, minCost: { base: 10, perLevelAboveFirst: 10 }, maxCost: { base: 25, perLevelAboveFirst: 10 } },
  { id: "frost_walker", name: "Frost Walker", maxLevel: 2, treasureOnly: true, categories: ["boots"], anvilCost: 4, weight: 2, minCost: { base: 10, perLevelAboveFirst: 10 }, maxCost: { base: 25, perLevelAboveFirst: 10 } },
  { id: "feather_falling", name: "Feather Falling", maxLevel: 4, treasureOnly: false, categories: ["boots"], anvilCost: 2, weight: 5, minCost: { base: 5, perLevelAboveFirst: 6 }, maxCost: { base: 11, perLevelAboveFirst: 6 } },
  { id: "soul_speed", name: "Soul Speed", maxLevel: 3, treasureOnly: true, categories: ["boots"], anvilCost: 8, weight: 1, minCost: { base: 10, perLevelAboveFirst: 10 }, maxCost: { base: 25, perLevelAboveFirst: 10 } },
  { id: "swift_sneak", name: "Swift Sneak", maxLevel: 3, treasureOnly: true, categories: ["leggings"], anvilCost: 8, weight: 1, minCost: { base: 25, perLevelAboveFirst: 25 }, maxCost: { base: 75, perLevelAboveFirst: 25 } },
  { id: "curse_of_binding", name: "Curse of Binding", maxLevel: 1, treasureOnly: true, categories: [...ALL_ARMOR, "elytra"], anvilCost: 8, weight: 1, minCost: { base: 25, perLevelAboveFirst: 0 }, maxCost: { base: 50, perLevelAboveFirst: 0 } },

  // --- Universal ---
  { id: "curse_of_vanishing", name: "Curse of Vanishing", maxLevel: 1, treasureOnly: true, categories: [...EVERYTHING_DURABLE, "elytra"], anvilCost: 8, weight: 1, minCost: { base: 25, perLevelAboveFirst: 0 }, maxCost: { base: 50, perLevelAboveFirst: 0 } },
  { id: "unbreaking", name: "Unbreaking", maxLevel: 3, treasureOnly: false, categories: [...EVERYTHING_DURABLE, "elytra"], anvilCost: 2, weight: 5, minCost: { base: 5, perLevelAboveFirst: 8 }, maxCost: { base: 55, perLevelAboveFirst: 8 } },
  { id: "mending", name: "Mending", maxLevel: 1, treasureOnly: true, categories: [...EVERYTHING_DURABLE, "elytra"], anvilCost: 4, weight: 2, minCost: { base: 25, perLevelAboveFirst: 25 }, maxCost: { base: 75, perLevelAboveFirst: 25 } },

  // --- Combat (sword/axe/mace/spear) ---
  { id: "sharpness", name: "Sharpness", maxLevel: 5, treasureOnly: false, categories: COMBAT_BLADES, anvilCost: 1, weight: 10, minCost: { base: 1, perLevelAboveFirst: 11 }, maxCost: { base: 21, perLevelAboveFirst: 11 } },
  { id: "smite", name: "Smite", maxLevel: 5, treasureOnly: false, categories: COMBAT_BLADES, anvilCost: 2, weight: 5, minCost: { base: 5, perLevelAboveFirst: 8 }, maxCost: { base: 25, perLevelAboveFirst: 8 } },
  { id: "bane_of_arthropods", name: "Bane of Arthropods", maxLevel: 5, treasureOnly: false, categories: COMBAT_BLADES, anvilCost: 2, weight: 5, minCost: { base: 5, perLevelAboveFirst: 8 }, maxCost: { base: 25, perLevelAboveFirst: 8 } },
  { id: "knockback", name: "Knockback", maxLevel: 2, treasureOnly: false, categories: ["sword"], anvilCost: 2, weight: 5, minCost: { base: 5, perLevelAboveFirst: 20 }, maxCost: { base: 55, perLevelAboveFirst: 20 } },
  { id: "fire_aspect", name: "Fire Aspect", maxLevel: 2, treasureOnly: false, categories: ["sword", "mace"], anvilCost: 4, weight: 2, minCost: { base: 10, perLevelAboveFirst: 20 }, maxCost: { base: 60, perLevelAboveFirst: 20 } },
  { id: "looting", name: "Looting", maxLevel: 3, treasureOnly: false, categories: ["sword"], anvilCost: 4, weight: 2, minCost: { base: 15, perLevelAboveFirst: 9 }, maxCost: { base: 65, perLevelAboveFirst: 9 } },
  { id: "sweeping_edge", name: "Sweeping Edge", maxLevel: 3, treasureOnly: false, categories: ["sword"], anvilCost: 4, weight: 2, minCost: { base: 5, perLevelAboveFirst: 9 }, maxCost: { base: 20, perLevelAboveFirst: 9 } },

  // --- Mace-exclusive ---
  { id: "density", name: "Density", maxLevel: 5, treasureOnly: false, categories: ["mace"], anvilCost: 2, weight: 5, minCost: { base: 5, perLevelAboveFirst: 8 }, maxCost: { base: 25, perLevelAboveFirst: 8 } },
  { id: "breach", name: "Breach", maxLevel: 4, treasureOnly: false, categories: ["mace"], anvilCost: 4, weight: 2, minCost: { base: 15, perLevelAboveFirst: 9 }, maxCost: { base: 65, perLevelAboveFirst: 9 } },
  { id: "wind_burst", name: "Wind Burst", maxLevel: 3, treasureOnly: false, categories: ["mace"], anvilCost: 2, weight: 2, minCost: { base: 15, perLevelAboveFirst: 9 }, maxCost: { base: 65, perLevelAboveFirst: 9 } },

  // --- Spear-exclusive ---
  { id: "lunge", name: "Lunge", maxLevel: 3, treasureOnly: false, categories: ["spear"], anvilCost: 2, weight: 5, minCost: { base: 5, perLevelAboveFirst: 8 }, maxCost: { base: 25, perLevelAboveFirst: 8 } },

  // --- Mining tools ---
  { id: "efficiency", name: "Efficiency", maxLevel: 5, treasureOnly: false, categories: MINING_TOOLS, anvilCost: 1, weight: 10, minCost: { base: 1, perLevelAboveFirst: 10 }, maxCost: { base: 51, perLevelAboveFirst: 10 } },
  { id: "silk_touch", name: "Silk Touch", maxLevel: 1, treasureOnly: false, categories: MINING_TOOLS, anvilCost: 8, weight: 1, minCost: { base: 15, perLevelAboveFirst: 0 }, maxCost: { base: 65, perLevelAboveFirst: 0 } },
  { id: "fortune", name: "Fortune", maxLevel: 3, treasureOnly: false, categories: MINING_TOOLS, anvilCost: 4, weight: 2, minCost: { base: 15, perLevelAboveFirst: 9 }, maxCost: { base: 65, perLevelAboveFirst: 9 } },

  // --- Bow ---
  { id: "power", name: "Power", maxLevel: 5, treasureOnly: false, categories: ["bow"], anvilCost: 1, weight: 10, minCost: { base: 1, perLevelAboveFirst: 10 }, maxCost: { base: 16, perLevelAboveFirst: 10 } },
  { id: "punch", name: "Punch", maxLevel: 2, treasureOnly: false, categories: ["bow"], anvilCost: 4, weight: 2, minCost: { base: 12, perLevelAboveFirst: 20 }, maxCost: { base: 37, perLevelAboveFirst: 20 } },
  { id: "flame", name: "Flame", maxLevel: 1, treasureOnly: false, categories: ["bow"], anvilCost: 4, weight: 2, minCost: { base: 20, perLevelAboveFirst: 0 }, maxCost: { base: 50, perLevelAboveFirst: 0 } },
  { id: "infinity", name: "Infinity", maxLevel: 1, treasureOnly: false, categories: ["bow"], anvilCost: 8, weight: 1, minCost: { base: 20, perLevelAboveFirst: 0 }, maxCost: { base: 50, perLevelAboveFirst: 0 } },

  // --- Crossbow ---
  { id: "quick_charge", name: "Quick Charge", maxLevel: 3, treasureOnly: false, categories: ["crossbow"], anvilCost: 2, weight: 5, minCost: { base: 12, perLevelAboveFirst: 20 }, maxCost: { base: 50, perLevelAboveFirst: 0 } },
  { id: "multishot", name: "Multishot", maxLevel: 1, treasureOnly: false, categories: ["crossbow"], anvilCost: 4, weight: 2, minCost: { base: 20, perLevelAboveFirst: 0 }, maxCost: { base: 50, perLevelAboveFirst: 0 } },
  { id: "piercing", name: "Piercing", maxLevel: 4, treasureOnly: false, categories: ["crossbow"], anvilCost: 1, weight: 10, minCost: { base: 1, perLevelAboveFirst: 10 }, maxCost: { base: 50, perLevelAboveFirst: 0 } },

  // --- Fishing rod ---
  { id: "luck_of_the_sea", name: "Luck of the Sea", maxLevel: 3, treasureOnly: false, categories: ["fishing_rod"], anvilCost: 4, weight: 2, minCost: { base: 15, perLevelAboveFirst: 9 }, maxCost: { base: 65, perLevelAboveFirst: 9 } },
  { id: "lure", name: "Lure", maxLevel: 3, treasureOnly: false, categories: ["fishing_rod"], anvilCost: 4, weight: 2, minCost: { base: 15, perLevelAboveFirst: 9 }, maxCost: { base: 65, perLevelAboveFirst: 9 } },

  // --- Trident ---
  { id: "impaling", name: "Impaling", maxLevel: 5, treasureOnly: false, categories: ["trident"], anvilCost: 4, weight: 2, minCost: { base: 1, perLevelAboveFirst: 8 }, maxCost: { base: 21, perLevelAboveFirst: 8 } },
  { id: "riptide", name: "Riptide", maxLevel: 3, treasureOnly: true, categories: ["trident"], anvilCost: 4, weight: 2, minCost: { base: 17, perLevelAboveFirst: 7 }, maxCost: { base: 50, perLevelAboveFirst: 0 } },
  { id: "loyalty", name: "Loyalty", maxLevel: 3, treasureOnly: false, categories: ["trident"], anvilCost: 2, weight: 5, minCost: { base: 12, perLevelAboveFirst: 7 }, maxCost: { base: 50, perLevelAboveFirst: 0 } },
  { id: "channeling", name: "Channeling", maxLevel: 1, treasureOnly: true, categories: ["trident"], anvilCost: 8, weight: 1, minCost: { base: 25, perLevelAboveFirst: 0 }, maxCost: { base: 50, perLevelAboveFirst: 0 } },
];

/**
 * Real `tags/enchantment/exclusive_set/*.json` membership — every
 * enchantment in a group is mutually exclusive with every other member of
 * that same group. Fetched verbatim, not hand-derived, specifically because
 * some groupings are wider than they look (Impaling shares "damage" with
 * Sharpness/Smite/Bane/Density/Breach even though it never actually meets
 * them in practice — trident vs. sword/axe/mace — while Density/Breach vs.
 * Smite/Bane of Arthropods DOES matter in practice, on a mace).
 */
const EXCLUSIVE_SETS: string[][] = [
  ["sharpness", "smite", "bane_of_arthropods", "impaling", "density", "breach"],
  ["protection", "blast_protection", "fire_protection", "projectile_protection"],
  ["frost_walker", "depth_strider"],
  ["fortune", "silk_touch"],
  ["multishot", "piercing"],
  ["infinity", "mending"],
  ["riptide", "loyalty", "channeling"],
];

function deriveIncompatibilities(id: string): string[] {
  const set = new Set<string>();
  for (const group of EXCLUSIVE_SETS) {
    if (group.includes(id)) {
      for (const other of group) if (other !== id) set.add(other);
    }
  }
  return [...set];
}

export const ENCHANTMENTS: Enchantment[] = RAW.map((e) => ({ ...e, incompatibleWith: deriveIncompatibilities(e.id) }));

export function enchantmentById(id: string): Enchantment {
  const e = ENCHANTMENTS.find((x) => x.id === id);
  if (!e) throw new Error(`Unknown enchantment id: ${id}`);
  return e;
}

export function enchantmentsFor(category: ItemCategory): Enchantment[] {
  return ENCHANTMENTS.filter((e) => e.categories.includes(category));
}

export const ITEM_CATEGORY_LABELS: Record<ItemCategory, string> = {
  pickaxe: "Pioche",
  shovel: "Pelle",
  hoe: "Houe",
  axe: "Hache",
  sword: "Épée",
  bow: "Arc",
  crossbow: "Arbalète",
  trident: "Trident",
  mace: "Masse (Mace)",
  spear: "Lance (Spear)",
  helmet: "Casque",
  chestplate: "Plastron",
  leggings: "Jambières",
  boots: "Bottes",
  shield: "Bouclier",
  fishing_rod: "Canne à pêche",
  elytra: "Élytres",
};
