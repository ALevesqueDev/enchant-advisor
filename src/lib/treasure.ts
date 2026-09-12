// Treasure-enchantment sourcing — the enchanting table can NEVER offer
// these, by design, so "what level/material gives the best odds" has no
// answer for them. What's actually computable: fishing and villager
// trading odds, verified against real loot-table/trade JSON on 2026-09-11
// (github.com/misode/mcmeta) — see PROJECT.md.

import { ENCHANTMENTS, enchantmentById, nonTreasurePool } from "./enchantments";
import { simulateTableOdds } from "./tableOdds";
import type { Locale } from "./i18n";

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
  const additions = ENCHANTMENTS.filter((e) => TRADEABLE_TREASURE_ADDITIONS.includes(e.id));
  return [...nonTreasurePool(), ...additions];
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
const STRUCTURE_ONLY_SOURCES: Record<string, Record<Locale, string>> = {
  soul_speed: {
    en: "Bastion remnant chest loot, or bartering with a piglin (gold ingot).",
    fr: "Butin de coffres de vestiges de bastion, ou troc avec un piglin (lingot d'or).",
  },
  swift_sneak: {
    en: "Ancient City chest loot — that's the only source.",
    fr: "Butin de coffres de cité ancienne (Ancient City) — c'est la seule source.",
  },
  wind_burst: {
    en: "Trial Chambers vault loot — no fishing or trading route.",
    fr: "Butin de coffre à récompense (vault) des Chambres d'épreuves (Trial Chambers) — pas de pêche ni de commerce.",
  },
};

function tradingNote(poolSize: number, locale: Locale): string {
  return locale === "en"
    ? `Uniform draw (not weighted by rarity) among ${poolSize} possible enchantments from a librarian (novice-to-expert tiers). The level you get is also random — you can't aim directly for the max level. Rerolling just costs a lectern (break/replace it to reroll the villager's job).`
    : `Tirage uniforme (pas pondéré par rareté) parmi ${poolSize} enchantements possibles chez un bibliothécaire (paliers novice à expert). Le niveau obtenu est aussi aléatoire — on ne peut pas viser directement le niveau max. Recommencer coûte juste un lutrin (casser/replacer pour reroll le métier).`;
}

function fishingNote(treasureCatchChancePercent: string, luckOfTheSeaLevel: number, locale: Locale): string {
  return locale === "en"
    ? `≈${treasureCatchChancePercent}% "treasure" catch per cast (Luck of the Sea ${luckOfTheSeaLevel}) × 1/6 for it to be the book × the chance that book carries this enchantment at the target level. Approximate: the Luck of the Sea bonus is a community-measured value, not pulled from raw game data.`
    : `≈${treasureCatchChancePercent}% de prise "trésor" par lancer (Luck of the Sea ${luckOfTheSeaLevel}) × 1/6 pour que ce soit le livre × chance que le livre porte cet enchantement au niveau visé. Approximatif : le bonus de Luck of the Sea est une valeur mesurée par la communauté, pas extraite des données brutes du jeu.`;
}

export function treasureOdds(
  enchantId: string,
  targetLevel: number,
  locale: Locale,
  luckOfTheSeaLevel = 0
): TreasureOddsResult[] {
  const enchant = enchantmentById(enchantId);
  const results: TreasureOddsResult[] = [];

  if (STRUCTURE_ONLY_SOURCES[enchantId]) {
    results.push({ source: "structure_loot_only", note: STRUCTURE_ONLY_SOURCES[enchantId][locale] });
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
    note: tradingNote(poolSize, locale),
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
    isBook: true, // it's a literal enchanted book, same "-1 enchant" quirk as book mode
  });
  results.push({
    source: "fishing",
    probability: treasureCatchChance * bookSlotChance * bookEnchantChance,
    note: fishingNote((treasureCatchChance * 100).toFixed(1), luckOfTheSeaLevel, locale),
  });

  return results;
}
