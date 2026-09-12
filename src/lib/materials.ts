// Enchantability per material, pulled straight from vanilla item data
// (minecraft:enchantable component) via github.com/misode/mcmeta on
// 2026-09-11 — see PROJECT.md. Higher enchantability = better odds of rare/
// high-level enchantments and of getting more than one per roll.
//
// Confirmed copper tools/armor exist as of the current version (verified
// against raw game data, not assumed) — this is new since this assistant's
// Jan 2026 training cutoff, same as Spear/Lunge.

import type { ItemCategory } from "./types";

export type Material =
  | "wood"
  | "stone"
  | "iron"
  | "golden"
  | "diamond"
  | "netherite"
  | "copper"
  | "leather"
  | "chainmail"
  | "turtle_shell";

// Material display names live in i18n.ts's itemName(category, material,
// locale) — the real, full item name in both languages (e.g. "Iron
// Pickaxe" / "Pioche en fer"), not a French-only bare material label like
// this file used to keep.

const TOOL_ENCHANTABILITY: Partial<Record<Material, number>> = {
  wood: 15,
  stone: 5,
  iron: 14,
  golden: 22,
  diamond: 10,
  netherite: 15,
  copper: 13,
};

const ARMOR_ENCHANTABILITY: Partial<Record<Material, number>> = {
  leather: 15,
  chainmail: 12,
  iron: 9,
  golden: 25,
  diamond: 10,
  netherite: 15,
  copper: 8,
  turtle_shell: 9, // helmet-only alternative to golden/diamond/etc.
};

/** Categories where material choice matters and changes enchantability. */
const TOOL_LIKE: ItemCategory[] = ["pickaxe", "shovel", "hoe", "axe", "sword", "spear"];
const ARMOR_LIKE: ItemCategory[] = ["helmet", "chestplate", "leggings", "boots"];

/**
 * Weakest durability first, strongest last — pulled from each item's real
 * `minecraft:max_damage` (verified against the pickaxe/helmet values, then
 * cross-checked identical ordering on every other tool and armor piece).
 * Two results worth flagging since they're not the "obvious" tier order:
 * Gold has the LOWEST tool durability of all seven materials (32, below
 * even Wood's 59) despite being a mid/late-game material, and Copper sits
 * between Stone and Iron for tools but between Gold and Chainmail for
 * armor — it isn't at the same relative position in both lists. Chainmail
 * and Iron are an exact durability tie on every armor piece (e.g. 240 vs
 * 240 for chestplate) — ordered Chainmail-then-Iron here since there's no
 * durability basis to break the tie either way.
 */
const TOOL_DURABILITY_ORDER: Material[] = ["golden", "wood", "stone", "copper", "iron", "diamond", "netherite"];
const ARMOR_DURABILITY_ORDER: Material[] = ["leather", "golden", "copper", "chainmail", "iron", "diamond", "netherite"];
/** Turtle Shell is helmet-only; its durability (275) slots between Iron/Chainmail (165) and Diamond (363). */
const HELMET_DURABILITY_ORDER: Material[] = ["leather", "golden", "copper", "chainmail", "iron", "turtle_shell", "diamond", "netherite"];

/** Materials available for a given item category (only ones that exist in-game for it), weakest durability first. */
export function materialsFor(category: ItemCategory): Material[] {
  if (TOOL_LIKE.includes(category)) return TOOL_DURABILITY_ORDER;
  if (category === "helmet") return HELMET_DURABILITY_ORDER;
  if (ARMOR_LIKE.includes(category)) return ARMOR_DURABILITY_ORDER;
  return []; // fixed-enchantability items (bow, crossbow, trident, fishing_rod, mace, shield, elytra)
}

/**
 * Enchantability for a (category, material) pair. Categories with no
 * material choice (bow/crossbow/trident/fishing_rod = 1, mace = 15,
 * shield/elytra = 1) ignore the material argument — not independently
 * re-verified against game data, kept as commonly cited values; flagged
 * here rather than presented as equally certain to the tool/armor table.
 */
export function enchantability(category: ItemCategory, material?: Material): number {
  if (TOOL_LIKE.includes(category) && material) return TOOL_ENCHANTABILITY[material] ?? 1;
  if (ARMOR_LIKE.includes(category) && material) return ARMOR_ENCHANTABILITY[material] ?? 1;
  if (category === "mace") return 15;
  return 1; // bow, crossbow, trident, fishing_rod, shield, elytra
}
