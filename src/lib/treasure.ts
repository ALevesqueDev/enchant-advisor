// Treasure-enchantment sourcing — the enchanting table can NEVER offer
// these, by design, so "what level/material gives the best odds" has no
// answer for them. What's actually computable: fishing and villager
// trading odds, verified against real loot-table/trade JSON on 2026-09-11
// (github.com/misode/mcmeta) — see PROJECT.md.

import { ENCHANTMENTS, enchantmentById } from "./enchantments";
import { simulateTableOdds } from "./tableOdds";

export const TREASURE_ENCHANT_IDS = ["mending", "frost_walker", "binding_curse", "vanishing_curse", "soul_speed", "swift_sneak", "wind_burst"] as const;

/**
 * Enchantments a villager trade / fishing "random enchanted book" roll can
 * produce: every non-treasure enchantment, PLUS these four specifically
 * (tags/enchantment/tradeable.json and on_random_loot.json — identical
 * membership). Riptide and Channeling look treasure-flavored but are
 * actually members of the `non_treasure` tag themselves — confirmed against
 * the raw tag data by scripts/check-game-version.mjs, which caught this
 * assistant's own earlier mistake (both were originally marked
 * treasureOnly, sourced from a wiki-summary fetch rather than the tag
 * itself). Soul Speed and Swift Sneak are genuinely absent from both tags —
 * structure loot only (and Soul Speed also from bartering with piglins).
 */
const TRADEABLE_TREASURE_ADDITIONS = ["mending", "frost_walker", "binding_curse", "vanishing_curse"];

/** The actual `tradeable` / `on_random_loot` tag membership: every non-treasure enchantment plus the four additions above. */
function tradeableAndLootPool() {
  return ENCHANTMENTS.filter((e) => !e.treasureOnly || TRADEABLE_TREASURE_ADDITIONS.includes(e.id));
}

export type TreasureSource = "fishing" | "trading" | "structure_loot_only";

export interface TreasureOddsResult {
  source: TreasureSource;
  /** Probability per single fishing cast, or per single trade-slot re-roll. Undefined for structure_loot_only. */
  probability?: number;
  note: string;
}

const LUCK_OF_THE_SEA_TREASURE_BONUS_PER_LEVEL = 0.021; // community-measured, not from raw data — see note in UI
const BASE_TREASURE_CATCH_CHANCE = 0.05;

/**
 * Structure-loot-only treasure enchants: no fishing/trading route, so we
 * don't fabricate a percentage — these come only from specific loot chests
 * (and Soul Speed also from piglin bartering).
 */
const STRUCTURE_ONLY_SOURCES: Record<string, string> = {
  soul_speed: "Butin de coffres de vestiges de bastion, ou troc avec un piglin (lingot d'or).",
  swift_sneak: "Butin de coffres de cité ancienne (Ancient City) — c'est la seule source.",
  wind_burst: "Butin de coffre à récompense (vault) des Chambres d'épreuves (Trial Chambers) — pas de pêche ni de commerce.",
};

export function treasureOdds(enchantId: string, targetLevel: number, luckOfTheSeaLevel = 0): TreasureOddsResult[] {
  const enchant = enchantmentById(enchantId);
  const results: TreasureOddsResult[] = [];

  if (STRUCTURE_ONLY_SOURCES[enchantId]) {
    results.push({ source: "structure_loot_only", note: STRUCTURE_ONLY_SOURCES[enchantId] });
    return results;
  }

  if (!TRADEABLE_TREASURE_ADDITIONS.includes(enchantId)) {
    // Not actually treasure-only, or not in the known tradeable/loot set — caller error guard.
    return results;
  }

  const pool = tradeableAndLootPool();

  // --- Villager trading: uniform random pick among the tradeable pool ---
  const poolSize = pool.length;
  const levelFraction = (enchant.maxLevel - targetLevel + 1) / enchant.maxLevel;
  const perRerollProbability = (1 / poolSize) * levelFraction;
  results.push({
    source: "trading",
    probability: perRerollProbability,
    note: `Tirage uniforme (pas pondéré par rareté) parmi ${poolSize} enchantements possibles chez un bibliothécaire (paliers novice à expert). Le niveau obtenu est aussi aléatoire — on ne peut pas viser directement le niveau max. Recommencer coûte juste un lutrin (casser/replacer pour reroll le métier).`,
  });

  // --- Fishing: treasure catch (1/6 items) -> book slot -> enchant_with_levels at level 30 ---
  const treasureCatchChance = BASE_TREASURE_CATCH_CHANCE + LUCK_OF_THE_SEA_TREASURE_BONUS_PER_LEVEL * luckOfTheSeaLevel;
  const bookSlotChance = 1 / 6;
  const bookEnchantChance = simulateTableOdds({
    pool,
    displayedLevel: 30,
    enchantability: 1,
    targetEnchantId: enchantId,
    targetLevel,
    trials: 6000,
  });
  results.push({
    source: "fishing",
    probability: treasureCatchChance * bookSlotChance * bookEnchantChance,
    note: `≈${(treasureCatchChance * 100).toFixed(1)}% de prise "trésor" par lancer (Luck of the Sea ${luckOfTheSeaLevel}) × 1/6 pour que ce soit le livre × chance que le livre porte cet enchantement au niveau visé. Approximatif : le bonus de Luck of the Sea est une valeur mesurée par la communauté, pas extraite des données brutes du jeu.`,
  });

  return results;
}
