// Core domain types for the enchant advisor.
// Kept separate from data (enchantments.ts) and logic (recommend.ts, anvil.ts)
// so each file has one job.

/** Every enchantable item category the advisor covers (Java Edition). */
export type ItemCategory =
  | "pickaxe"
  | "shovel"
  | "hoe"
  | "axe"
  | "sword"
  | "bow"
  | "crossbow"
  | "trident"
  | "mace"
  | "spear"
  | "helmet"
  | "chestplate"
  | "leggings"
  | "boots"
  | "shield"
  | "fishing_rod"
  | "elytra";

/** A linear cost formula: value(level) = base + perLevelAboveFirst * (level - 1). */
export interface LinearCost {
  base: number;
  perLevelAboveFirst: number;
}

export interface Enchantment {
  id: string;
  name: string;
  maxLevel: number;
  /** Not obtainable from the enchanting table — only loot, fishing, trading, or (Riptide/Channeling) commands. */
  treasureOnly: boolean;
  categories: ItemCategory[];
  /** Enchantment ids this one cannot coexist with on the same item. */
  incompatibleWith: string[];
  /** Anvil cost per resulting level when applied from a book; combining two enchanted items costs double. */
  anvilCost: number;
  /** Rarity weight used by the enchanting table's weighted random pick — higher = more common. */
  weight: number;
  /** Enchanting-table/loot "power" range an item's effective roll must fall within to offer this level. */
  minCost: LinearCost;
  maxCost: LinearCost;
}

/** What the player already has on the item: enchantment id -> current level. */
export type EnchantSet = Record<string, number>;

/** UI copy in both supported languages — not a translation key, the actual strings. */
export interface LocalizedText {
  en: string;
  fr: string;
}

export interface Goal {
  id: string;
  label: LocalizedText;
  /** Enchantment id -> the level worth aiming for under this goal. */
  targets: Record<string, number>;
}

export interface Recommendation {
  enchantId: string;
  currentLevel: number;
  targetLevel: number;
  status: "add" | "upgrade" | "already-optimal" | "conflict";
  /** Set when status is "conflict": the target enchant this one blocks. */
  conflictsWith?: string;
}
