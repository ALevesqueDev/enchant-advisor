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

export const MATERIAL_LABELS: Record<Material, string> = {
  wood: "Bois",
  stone: "Pierre",
  iron: "Fer",
  golden: "Or",
  diamond: "Diamant",
  netherite: "Netherite",
  copper: "Cuivre",
  leather: "Cuir",
  chainmail: "Cotte de mailles",
  turtle_shell: "Carapace de tortue",
};

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

/** Materials available for a given item category (only ones that exist in-game for it). */
export function materialsFor(category: ItemCategory): Material[] {
  if (TOOL_LIKE.includes(category)) {
    return ["wood", "stone", "iron", "golden", "diamond", "netherite", "copper"];
  }
  if (ARMOR_LIKE.includes(category)) {
    const base: Material[] = ["leather", "chainmail", "iron", "golden", "diamond", "netherite", "copper"];
    return category === "helmet" ? [...base, "turtle_shell"] : base;
  }
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
