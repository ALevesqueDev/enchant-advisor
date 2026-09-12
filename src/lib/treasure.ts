// Villager trading and fishing odds.
//
// Bug fixed 2026-09-13 (functional): this used to only compute these odds
// for the 4 treasure enchantments that are ALSO tradeable (Mending, Frost
// Walker, the curses) and silently returned nothing for every other
// enchantment. But the `tradeable`/`on_random_loot` tags cover 40 of our 43
// enchantments — almost every non-treasure enchantment (Sharpness,
// Protection, Efficiency, ...) is ALSO obtainable this way, not just the
// treasure-flavored ones. Only Soul Speed, Swift Sneak, and Wind Burst are
// excluded from both tags (structure loot only). See enchantments.ts /
// PROJECT.md for how `treasureOnly` (which enchantments the TABLE can
// offer) was derived from the real `non_treasure` tag — unrelated to this.
//
// Bug fixed 2026-09-12 (locale): treasureOdds() used to bake the note text
// into the result at calculate-time using whatever locale was active then.
// Toggling the language afterward left stale text on screen until the user
// recalculated. Fixed by never storing rendered text at all — this module
// returns plain numbers, and treasureSourceNote() renders them against
// whatever locale is CURRENT at render time (called from SearchMode.tsx's
// JSX, not from calculate()).

import { ENCHANTMENTS, enchantmentById, nonTreasurePool } from "./enchantments";
import { simulateTableOdds } from "./tableOdds";
import type { Locale } from "./i18n";

/**
 * Enchantments a villager trade / fishing "random enchanted book" roll can
 * produce: every non-treasure enchantment, PLUS these four treasure
 * enchantments specifically (tags/enchantment/tradeable.json and
 * on_random_loot.json — identical membership). Riptide and Channeling look
 * treasure-flavored but are actually members of the `non_treasure` tag
 * itself — confirmed against the raw tag data by
 * scripts/check-game-version.mjs, which caught this assistant's own
 * earlier mistake (both were originally marked treasureOnly, sourced from
 * a wiki-summary fetch rather than the tag itself).
 */
const TRADEABLE_TREASURE_ADDITIONS = ["mending", "frost_walker", "binding_curse", "vanishing_curse"];

/** The actual `tradeable` / `on_random_loot` tag membership: every non-treasure enchantment plus the four additions above. */
function tradeableAndLootPool() {
  const additions = ENCHANTMENTS.filter((e) => TRADEABLE_TREASURE_ADDITIONS.includes(e.id));
  return [...nonTreasurePool(), ...additions];
}

/** Plain data only — no rendered text. See the locale-bug note above for why. */
export type TreasureOddsResult =
  | { source: "trading"; probability: number; poolSize: number }
  | { source: "fishing"; probability: number; treasureCatchChancePercent: string; luckOfTheSeaLevel: number }
  | { source: "structure_loot_only" };

const LUCK_OF_THE_SEA_TREASURE_BONUS_PER_LEVEL = 0.021; // community-measured, not from raw data — see note in UI
const BASE_TREASURE_CATCH_CHANCE = 0.05;

/**
 * Genuinely absent from both tags — no fishing/trading route at all
 * (Soul Speed is also obtainable by bartering with a piglin).
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

export function isStructureLootOnly(enchantId: string): boolean {
  return Boolean(STRUCTURE_ONLY_SOURCES[enchantId]);
}

/**
 * Renders a TreasureOddsResult's explanatory note against whatever locale
 * is current — call this from JSX at render time (with the live value from
 * useLocale()), never at calculate-time, so a language switch never leaves
 * stale text on screen.
 */
export function treasureSourceNote(result: TreasureOddsResult, enchantId: string, locale: Locale): string {
  switch (result.source) {
    case "trading":
      return locale === "en"
        ? `Uniform draw (not weighted by rarity) among ${result.poolSize} possible enchantments from a librarian (novice-to-expert tiers). The level you get is also random — you can't aim directly for the max level. Rerolling just costs a lectern (break/replace it to reroll the villager's job).`
        : `Tirage uniforme (pas pondéré par rareté) parmi ${result.poolSize} enchantements possibles chez un bibliothécaire (paliers novice à expert). Le niveau obtenu est aussi aléatoire — on ne peut pas viser directement le niveau max. Recommencer coûte juste un lutrin (casser/replacer pour reroll le métier).`;
    case "fishing":
      return locale === "en"
        ? `≈${result.treasureCatchChancePercent}% "treasure" catch per cast (Luck of the Sea ${result.luckOfTheSeaLevel}) × 1/6 for it to be the book × the chance that book carries this enchantment at the target level. Approximate: the Luck of the Sea bonus is a community-measured value, not pulled from raw game data.`
        : `≈${result.treasureCatchChancePercent}% de prise "trésor" par lancer (Luck of the Sea ${result.luckOfTheSeaLevel}) × 1/6 pour que ce soit le livre × chance que le livre porte cet enchantement au niveau visé. Approximatif : le bonus de Luck of the Sea est une valeur mesurée par la communauté, pas extraite des données brutes du jeu.`;
    case "structure_loot_only":
      return STRUCTURE_ONLY_SOURCES[enchantId][locale];
  }
}

/**
 * Trading + fishing odds for ANY enchantment that's in the tradeable/loot
 * pool (40 of our 43 — everything except the three structure-only ones).
 * Works the same whether the enchantment is treasure-only or not; the
 * caller decides what else to show alongside this (table/book odds only
 * make sense for non-treasure enchantments). Returns plain numbers — see
 * treasureSourceNote() for rendering the explanatory text.
 */
export function treasureOdds(enchantId: string, targetLevel: number, luckOfTheSeaLevel = 0): TreasureOddsResult[] {
  const enchant = enchantmentById(enchantId);
  const results: TreasureOddsResult[] = [];

  if (STRUCTURE_ONLY_SOURCES[enchantId]) {
    results.push({ source: "structure_loot_only" });
    return results;
  }

  const pool = tradeableAndLootPool();

  // --- Villager trading: uniform random pick among the tradeable pool ---
  const poolSize = pool.length;
  const levelFraction = (enchant.maxLevel - targetLevel + 1) / enchant.maxLevel;
  const perRerollProbability = (1 / poolSize) * levelFraction;
  results.push({ source: "trading", probability: perRerollProbability, poolSize });

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
    treasureCatchChancePercent: (treasureCatchChance * 100).toFixed(1),
    luckOfTheSeaLevel,
  });

  return results;
}
