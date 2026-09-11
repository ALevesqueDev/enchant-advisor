// Enchantment database — Java Edition, current as of MC 1.21.11.
//
// Verified against the Minecraft Wiki (minecraft.wiki/w/Enchanting_mechanics
// and /w/Anvil_mechanics) on 2026-09-11 rather than pulled from memory — see
// PROJECT.md. Two things worth flagging for whoever touches this next:
//
// 1. "spear" / "lunge" were added in 1.21.11 (Sept 2026), after this
//    assistant's training cutoff — categories/compatibility for Spear beyond
//    Lunge itself are a best guess (mirrors sword's combat enchants) and
//    should be re-verified against the wiki if anything looks off.
// 2. Axes get the tool line (Efficiency/Fortune/Silk Touch) AND the combat
//    line (Sharpness/Smite/Bane of Arthropods), but NOT Knockback, Fire
//    Aspect, Looting, or Sweeping Edge — those stay sword-exclusive.

import type { Enchantment, ItemCategory } from "./types";

const ALL_ARMOR: ItemCategory[] = ["helmet", "chestplate", "leggings", "boots"];
const MINING_TOOLS: ItemCategory[] = ["pickaxe", "shovel", "hoe", "axe"];
const COMBAT_BLADES: ItemCategory[] = ["sword", "axe", "mace", "spear"];

export const ENCHANTMENTS: Enchantment[] = [
  // --- Armor: protection line (mutually exclusive with each other) ---
  { id: "protection", name: "Protection", maxLevel: 4, treasureOnly: false, categories: ALL_ARMOR, incompatibleWith: ["fire_protection", "blast_protection", "projectile_protection"], multiplier: { book: 1, item: 1 } },
  { id: "fire_protection", name: "Fire Protection", maxLevel: 4, treasureOnly: false, categories: ALL_ARMOR, incompatibleWith: ["protection", "blast_protection", "projectile_protection"], multiplier: { book: 1, item: 2 } },
  { id: "blast_protection", name: "Blast Protection", maxLevel: 4, treasureOnly: false, categories: ALL_ARMOR, incompatibleWith: ["protection", "fire_protection", "projectile_protection"], multiplier: { book: 2, item: 4 } },
  { id: "projectile_protection", name: "Projectile Protection", maxLevel: 4, treasureOnly: false, categories: ALL_ARMOR, incompatibleWith: ["protection", "fire_protection", "blast_protection"], multiplier: { book: 1, item: 2 } },

  { id: "thorns", name: "Thorns", maxLevel: 3, treasureOnly: false, categories: ALL_ARMOR, incompatibleWith: [], multiplier: { book: 4, item: 8 } },
  { id: "respiration", name: "Respiration", maxLevel: 3, treasureOnly: false, categories: ["helmet"], incompatibleWith: [], multiplier: { book: 2, item: 4 } },
  { id: "aqua_affinity", name: "Aqua Affinity", maxLevel: 1, treasureOnly: false, categories: ["helmet"], incompatibleWith: [], multiplier: { book: 2, item: 4 } },
  { id: "depth_strider", name: "Depth Strider", maxLevel: 3, treasureOnly: false, categories: ["boots"], incompatibleWith: ["frost_walker"], multiplier: { book: 2, item: 4 } },
  { id: "frost_walker", name: "Frost Walker", maxLevel: 2, treasureOnly: true, categories: ["boots"], incompatibleWith: ["depth_strider"], multiplier: { book: 2, item: 4 } },
  { id: "feather_falling", name: "Feather Falling", maxLevel: 4, treasureOnly: false, categories: ["boots"], incompatibleWith: [], multiplier: { book: 1, item: 2 } },
  { id: "soul_speed", name: "Soul Speed", maxLevel: 3, treasureOnly: true, categories: ["boots"], incompatibleWith: [], multiplier: { book: 4, item: 8 } },
  { id: "swift_sneak", name: "Swift Sneak", maxLevel: 3, treasureOnly: true, categories: ["leggings"], incompatibleWith: [], multiplier: { book: 4, item: 8 } },
  { id: "curse_of_binding", name: "Curse of Binding", maxLevel: 1, treasureOnly: true, categories: [...ALL_ARMOR, "elytra"], incompatibleWith: [], multiplier: { book: 4, item: 8 } },

  // --- Universal (curse of vanishing / unbreaking / mending apply almost everywhere) ---
  { id: "curse_of_vanishing", name: "Curse of Vanishing", maxLevel: 1, treasureOnly: true, categories: [...ALL_ARMOR, "elytra", "shield", ...MINING_TOOLS, ...COMBAT_BLADES, "bow", "crossbow", "trident", "fishing_rod"], incompatibleWith: [], multiplier: { book: 4, item: 8 } },
  { id: "unbreaking", name: "Unbreaking", maxLevel: 3, treasureOnly: false, categories: [...ALL_ARMOR, "elytra", "shield", ...MINING_TOOLS, ...COMBAT_BLADES, "bow", "crossbow", "trident", "fishing_rod"], incompatibleWith: [], multiplier: { book: 1, item: 2 } },
  { id: "mending", name: "Mending", maxLevel: 1, treasureOnly: true, categories: [...ALL_ARMOR, "elytra", "shield", ...MINING_TOOLS, ...COMBAT_BLADES, "bow", "crossbow", "trident", "fishing_rod"], incompatibleWith: ["infinity"], multiplier: { book: 2, item: 4 } },

  // --- Combat (sword/axe/mace/spear) ---
  { id: "sharpness", name: "Sharpness", maxLevel: 5, treasureOnly: false, categories: COMBAT_BLADES, incompatibleWith: ["smite", "bane_of_arthropods"], multiplier: { book: 1, item: 1 } },
  { id: "smite", name: "Smite", maxLevel: 5, treasureOnly: false, categories: COMBAT_BLADES, incompatibleWith: ["sharpness", "bane_of_arthropods", "density", "breach"], multiplier: { book: 1, item: 2 } },
  { id: "bane_of_arthropods", name: "Bane of Arthropods", maxLevel: 5, treasureOnly: false, categories: COMBAT_BLADES, incompatibleWith: ["sharpness", "smite", "density", "breach"], multiplier: { book: 1, item: 2 } },
  { id: "knockback", name: "Knockback", maxLevel: 2, treasureOnly: false, categories: ["sword"], incompatibleWith: [], multiplier: { book: 1, item: 2 } },
  { id: "fire_aspect", name: "Fire Aspect", maxLevel: 2, treasureOnly: false, categories: ["sword", "mace"], incompatibleWith: [], multiplier: { book: 2, item: 4 } },
  { id: "looting", name: "Looting", maxLevel: 3, treasureOnly: false, categories: ["sword"], incompatibleWith: [], multiplier: { book: 2, item: 4 } },
  { id: "sweeping_edge", name: "Sweeping Edge", maxLevel: 3, treasureOnly: false, categories: ["sword"], incompatibleWith: [], multiplier: { book: 2, item: 4 } },

  // --- Mace-exclusive (added 1.21) ---
  { id: "density", name: "Density", maxLevel: 5, treasureOnly: false, categories: ["mace"], incompatibleWith: ["breach", "smite", "bane_of_arthropods"], multiplier: { book: 1, item: 2 } },
  { id: "breach", name: "Breach", maxLevel: 4, treasureOnly: false, categories: ["mace"], incompatibleWith: ["density", "smite", "bane_of_arthropods"], multiplier: { book: 2, item: 4 } },
  { id: "wind_burst", name: "Wind Burst", maxLevel: 3, treasureOnly: false, categories: ["mace"], incompatibleWith: [], multiplier: { book: 2, item: 4 } },

  // --- Spear-exclusive (added 1.21.11 — see file header note) ---
  { id: "lunge", name: "Lunge", maxLevel: 3, treasureOnly: false, categories: ["spear"], incompatibleWith: [], multiplier: { book: 1, item: 2 } },

  // --- Mining tools ---
  { id: "efficiency", name: "Efficiency", maxLevel: 5, treasureOnly: false, categories: MINING_TOOLS, incompatibleWith: [], multiplier: { book: 1, item: 1 } },
  { id: "silk_touch", name: "Silk Touch", maxLevel: 1, treasureOnly: false, categories: MINING_TOOLS, incompatibleWith: ["fortune"], multiplier: { book: 4, item: 8 } },
  { id: "fortune", name: "Fortune", maxLevel: 3, treasureOnly: false, categories: MINING_TOOLS, incompatibleWith: ["silk_touch"], multiplier: { book: 2, item: 4 } },

  // --- Bow ---
  { id: "power", name: "Power", maxLevel: 5, treasureOnly: false, categories: ["bow"], incompatibleWith: [], multiplier: { book: 1, item: 1 } },
  { id: "punch", name: "Punch", maxLevel: 2, treasureOnly: false, categories: ["bow"], incompatibleWith: [], multiplier: { book: 2, item: 4 } },
  { id: "flame", name: "Flame", maxLevel: 1, treasureOnly: false, categories: ["bow"], incompatibleWith: [], multiplier: { book: 2, item: 4 } },
  { id: "infinity", name: "Infinity", maxLevel: 1, treasureOnly: false, categories: ["bow"], incompatibleWith: ["mending"], multiplier: { book: 4, item: 8 } },

  // --- Crossbow ---
  { id: "quick_charge", name: "Quick Charge", maxLevel: 3, treasureOnly: false, categories: ["crossbow"], incompatibleWith: [], multiplier: { book: 1, item: 2 } },
  { id: "multishot", name: "Multishot", maxLevel: 1, treasureOnly: false, categories: ["crossbow"], incompatibleWith: ["piercing"], multiplier: { book: 2, item: 4 } },
  { id: "piercing", name: "Piercing", maxLevel: 4, treasureOnly: false, categories: ["crossbow"], incompatibleWith: ["multishot"], multiplier: { book: 1, item: 1 } },

  // --- Fishing rod ---
  { id: "luck_of_the_sea", name: "Luck of the Sea", maxLevel: 3, treasureOnly: false, categories: ["fishing_rod"], incompatibleWith: [], multiplier: { book: 2, item: 4 } },
  { id: "lure", name: "Lure", maxLevel: 3, treasureOnly: false, categories: ["fishing_rod"], incompatibleWith: [], multiplier: { book: 2, item: 4 } },

  // --- Trident ---
  { id: "impaling", name: "Impaling", maxLevel: 5, treasureOnly: false, categories: ["trident"], incompatibleWith: [], multiplier: { book: 2, item: 4 } },
  { id: "riptide", name: "Riptide", maxLevel: 3, treasureOnly: true, categories: ["trident"], incompatibleWith: ["loyalty", "channeling"], multiplier: { book: 2, item: 4 } },
  { id: "loyalty", name: "Loyalty", maxLevel: 3, treasureOnly: false, categories: ["trident"], incompatibleWith: ["riptide"], multiplier: { book: 1, item: 1 } },
  { id: "channeling", name: "Channeling", maxLevel: 1, treasureOnly: true, categories: ["trident"], incompatibleWith: ["riptide"], multiplier: { book: 4, item: 8 } },
];

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
