// Presentation-only helpers — rarity tiers and item icons. Kept separate
// from enchantments.ts/types.ts since none of this affects game logic.

import type { ItemCategory } from "./types";

export type Rarity = "common" | "uncommon" | "rare" | "epic";

/** Enchanting-table weight -> Minecraft-style rarity tier (matches the game's own labeling). */
export function rarityFromWeight(weight: number): Rarity {
  if (weight >= 10) return "common";
  if (weight >= 5) return "uncommon";
  if (weight >= 2) return "rare";
  return "epic";
}

export const RARITY_LABELS: Record<Rarity, string> = {
  common: "Commun",
  uncommon: "Peu commun",
  rare: "Rare",
  epic: "Épique",
};

/** CSS variable name (see globals.css) for a rarity's color. */
export const RARITY_VAR: Record<Rarity, string> = {
  common: "--rarity-common",
  uncommon: "--rarity-uncommon",
  rare: "--rarity-rare",
  epic: "--rarity-epic",
};

export const CATEGORY_ICON: Record<ItemCategory, string> = {
  pickaxe: "⛏️",
  shovel: "🔨",
  hoe: "🌾",
  axe: "🪓",
  sword: "⚔️",
  bow: "🏹",
  crossbow: "🎯",
  trident: "🔱",
  mace: "🔨",
  spear: "🔱",
  helmet: "🪖",
  chestplate: "🦺",
  leggings: "👖",
  boots: "🥾",
  shield: "🛡️",
  fishing_rod: "🎣",
  elytra: "🪽",
};
