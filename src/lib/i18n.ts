// Bilingual item/enchantment names — the REAL names Minecraft itself uses
// in each language (extracted from the game's own en_us.json/fr_fr.json
// language files at our pinned version, github.com/misode/mcmeta), not a
// machine translation. "Diamond Pickaxe" / "Pioche en diamant" is what the
// game calls it in each language; this just looks that up.
//
// Re-extract enchantment-names.json / item-names.json whenever
// game-version.json bumps — same source, same version tag
// (`<version>-assets`), see PROJECT.md.

import enchantmentNames from "./enchantment-names.json";
import itemNames from "./item-names.json";
import type { ItemCategory } from "./types";
import type { Material } from "./materials";

export type Locale = "en" | "fr";

export const LOCALE_LABELS: Record<Locale, string> = { en: "English", fr: "Français" };

export function enchantmentName(id: string, locale: Locale): string {
  const entry = (enchantmentNames as Record<string, { en: string; fr: string }>)[id];
  return entry ? entry[locale] : id;
}

/** Categories with no material variant use a flat {en, fr} entry directly. */
const FIXED_CATEGORIES = ["bow", "crossbow", "trident", "mace", "shield", "fishing_rod", "elytra"];

/**
 * Real item name for a category + material. Categories without a material
 * choice (see FIXED_CATEGORIES) ignore the material argument.
 */
export function itemName(category: ItemCategory, material: Material | undefined, locale: Locale): string {
  const data = itemNames as Record<string, unknown>;
  const entry = data[category];
  if (!entry) return category;
  if (FIXED_CATEGORIES.includes(category)) {
    return (entry as { en: string; fr: string })[locale];
  }
  const byMaterial = entry as Record<string, { en: string; fr: string }>;
  const mat = material ?? "diamond";
  return byMaterial[mat]?.[locale] ?? category;
}

/**
 * A representative real name for a category when no specific material is
 * chosen (the advisor flow doesn't track material) — diamond is the most
 * commonly-referenced tier, so "Diamond Pickaxe" / "Pioche en diamant"
 * stands in for "pickaxe" as a concept.
 */
export function representativeItemName(category: ItemCategory, locale: Locale): string {
  return itemName(category, "diamond", locale);
}
