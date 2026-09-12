// Presentation-only helpers — rarity tiers and item icons. Kept separate
// from enchantments.ts/types.ts since none of this affects game logic.

import type { ItemCategory } from "./types";
import type { Locale } from "./i18n";
import { t } from "./strings";

export type Rarity = "common" | "uncommon" | "rare" | "epic";

/** Enchanting-table weight -> Minecraft-style rarity tier (matches the game's own labeling). */
export function rarityFromWeight(weight: number): Rarity {
  if (weight >= 10) return "common";
  if (weight >= 5) return "uncommon";
  if (weight >= 2) return "rare";
  return "epic";
}

const RARITY_KEY = {
  common: "rarityCommon",
  uncommon: "rarityUncommon",
  rare: "rarityRare",
  epic: "rarityEpic",
} as const;

export function rarityLabel(rarity: Rarity, locale: Locale): string {
  return t(RARITY_KEY[rarity], locale);
}

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
