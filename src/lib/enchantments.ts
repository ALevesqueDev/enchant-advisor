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
import enchantmentData from "./enchantment-data.json";

const ALL_ARMOR: ItemCategory[] = ["helmet", "chestplate", "leggings", "boots"];
const MINING_TOOLS: ItemCategory[] = ["pickaxe", "shovel", "hoe", "axe"];
const COMBAT_BLADES: ItemCategory[] = ["sword", "axe", "mace", "spear"];
const EVERYTHING_DURABLE: ItemCategory[] = [
  ...ALL_ARMOR, "elytra", "shield", ...MINING_TOOLS, ...COMBAT_BLADES, "bow", "crossbow", "trident", "fishing_rod",
];

/**
 * Curated per-enchantment info that ISN'T raw comparable game data: display
 * name and which item categories it applies to (our own modeling choice,
 * not something a single JSON file gives you directly). The numbers
 * (weight, maxLevel, costs, anvilCost) live in enchantment-data.json
 * instead, specifically so scripts/check-game-version.mjs can diff them
 * against a fresh fetch without parsing this file.
 */
const CURATION: Record<string, { name: string; categories: ItemCategory[] }> = {
  protection: { name: "Protection", categories: ALL_ARMOR },
  fire_protection: { name: "Fire Protection", categories: ALL_ARMOR },
  blast_protection: { name: "Blast Protection", categories: ALL_ARMOR },
  projectile_protection: { name: "Projectile Protection", categories: ALL_ARMOR },

  thorns: { name: "Thorns", categories: ALL_ARMOR },
  respiration: { name: "Respiration", categories: ["helmet"] },
  aqua_affinity: { name: "Aqua Affinity", categories: ["helmet"] },
  depth_strider: { name: "Depth Strider", categories: ["boots"] },
  frost_walker: { name: "Frost Walker", categories: ["boots"] },
  feather_falling: { name: "Feather Falling", categories: ["boots"] },
  soul_speed: { name: "Soul Speed", categories: ["boots"] },
  swift_sneak: { name: "Swift Sneak", categories: ["leggings"] },
  binding_curse: { name: "Curse of Binding", categories: [...ALL_ARMOR, "elytra"] },

  vanishing_curse: { name: "Curse of Vanishing", categories: [...EVERYTHING_DURABLE, "elytra"] },
  unbreaking: { name: "Unbreaking", categories: [...EVERYTHING_DURABLE, "elytra"] },
  mending: { name: "Mending", categories: [...EVERYTHING_DURABLE, "elytra"] },

  sharpness: { name: "Sharpness", categories: COMBAT_BLADES },
  smite: { name: "Smite", categories: COMBAT_BLADES },
  bane_of_arthropods: { name: "Bane of Arthropods", categories: COMBAT_BLADES },
  knockback: { name: "Knockback", categories: ["sword"] },
  fire_aspect: { name: "Fire Aspect", categories: ["sword", "mace"] },
  looting: { name: "Looting", categories: ["sword"] },
  sweeping_edge: { name: "Sweeping Edge", categories: ["sword"] },

  density: { name: "Density", categories: ["mace"] },
  breach: { name: "Breach", categories: ["mace"] },
  wind_burst: { name: "Wind Burst", categories: ["mace"] },

  lunge: { name: "Lunge", categories: ["spear"] },

  efficiency: { name: "Efficiency", categories: MINING_TOOLS },
  silk_touch: { name: "Silk Touch", categories: MINING_TOOLS },
  fortune: { name: "Fortune", categories: MINING_TOOLS },

  power: { name: "Power", categories: ["bow"] },
  punch: { name: "Punch", categories: ["bow"] },
  flame: { name: "Flame", categories: ["bow"] },
  infinity: { name: "Infinity", categories: ["bow"] },

  quick_charge: { name: "Quick Charge", categories: ["crossbow"] },
  multishot: { name: "Multishot", categories: ["crossbow"] },
  piercing: { name: "Piercing", categories: ["crossbow"] },

  luck_of_the_sea: { name: "Luck of the Sea", categories: ["fishing_rod"] },
  lure: { name: "Lure", categories: ["fishing_rod"] },

  impaling: { name: "Impaling", categories: ["trident"] },
  riptide: { name: "Riptide", categories: ["trident"] },
  loyalty: { name: "Loyalty", categories: ["trident"] },
  channeling: { name: "Channeling", categories: ["trident"] },
};

// Raw per-enchantment data, before incompatibilities are derived below.
type RawEnchantment = Omit<Enchantment, "incompatibleWith">;

const RAW: RawEnchantment[] = Object.entries(CURATION).map(([id, curated]) => {
  const data = (enchantmentData as Record<string, Omit<RawEnchantment, "id" | "name" | "categories">>)[id];
  if (!data) throw new Error(`enchantment-data.json is missing an entry for "${id}"`);
  return { id, ...curated, ...data };
});

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
