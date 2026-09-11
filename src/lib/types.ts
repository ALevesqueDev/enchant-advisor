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

export interface Enchantment {
  id: string;
  name: string;
  maxLevel: number;
  /** Not obtainable from the enchanting table — only loot, fishing, trading, or (Riptide/Channeling) commands. */
  treasureOnly: boolean;
  categories: ItemCategory[];
  /** Enchantment ids this one cannot coexist with on the same item. */
  incompatibleWith: string[];
  /**
   * Anvil cost multiplier per resulting level — see docs/anvil-mechanics.md.
   * Different depending on whether the enchantment source is a book or the item itself.
   */
  multiplier: { book: number; item: number };
}

/** What the player already has on the item: enchantment id -> current level. */
export type EnchantSet = Record<string, number>;

export interface Goal {
  id: string;
  label: string;
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
