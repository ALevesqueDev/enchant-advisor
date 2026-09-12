// Ranks every acquisition method (table on the item, table on a book,
// villager trading, fishing) for a target enchant/level by probability
// per attempt, so a caller can answer "what should I actually do" instead
// of leaving the user to compare separate sections by eye. Originally
// built for search mode; now also backs the advisor's inline acquisition
// hints (page.tsx), which is what pulled the assembly logic (below) in
// here instead of leaving it duplicated at both call sites.
//
// Deliberately just a ranking, not a single "do this" verdict: the four
// methods don't cost the same per attempt (a table roll spends XP levels
// and consumes the item/book; a trade reroll costs a lectern + emeralds;
// a fishing cast only costs time) — see searchBestMethodCaveat in
// strings.ts, shown alongside this in the UI. Pure numbers only, no
// locale-dependent text, same reason as every other computed result in
// this app (see treasure.ts's header for the bug that pattern avoids).
import { findBestTableOdds, findBestBookOdds, type EnchantingSlot } from "./tableOdds";
import { treasureOdds, isStructureLootOnly } from "./treasure";
import { materialsFor, enchantability } from "./materials";
import { enchantmentById } from "./enchantments";
import type { ItemCategory } from "./types";

export type MethodKind = "table_item" | "table_book" | "trading" | "fishing";

export interface RankableMethod<T = undefined> {
  kind: MethodKind;
  /** Probability (0-1) of success on a single attempt via this method. */
  probability: number;
  /** Method-specific detail the caller wants back attached to the ranked result (e.g. which material/slot) — opaque to this module. */
  detail?: T;
}

export interface RankedMethod<T = undefined> extends RankableMethod<T> {
  /** 1/probability — how many attempts you'd expect to need on average. Infinity when probability is 0 (never happens via this method at this level). */
  expectedAttempts: number;
}

/** Sorts by probability descending, richest (fewest expected attempts) first. */
export function rankMethods<T = undefined>(methods: RankableMethod<T>[]): RankedMethod<T>[] {
  return methods
    .map((m) => ({ ...m, expectedAttempts: m.probability > 0 ? 1 / m.probability : Infinity }))
    .sort((a, b) => b.probability - a.probability);
}

/** material only applies to the table_item method; slot to both table methods. */
export interface MethodDetail {
  material?: string;
  slot?: EnchantingSlot;
}

export interface BestMethodsInput {
  category: ItemCategory;
  enchantId: string;
  level: number;
  bookshelves: number;
  luckOfTheSea?: number;
  /**
   * Monte-Carlo trials per material×slot point. Search mode computes this
   * for one user-picked enchant and wants precision (the library's own
   * defaults). The advisor computes it for every recommended enchant at
   * once, so it passes a smaller number to keep the batch fast — see
   * page.tsx's call site.
   */
  trialsPerPoint?: number;
}

/**
 * Computes and ranks every applicable acquisition method for one
 * enchant/level. Returns null when nothing applies at all (shouldn't
 * happen in practice — every enchantment has at least a structure-loot
 * or table route — but keeps the type honest for callers).
 */
export function computeBestMethods(input: BestMethodsInput): RankedMethod<MethodDetail>[] | null {
  const enchant = enchantmentById(input.enchantId);
  const methods: RankableMethod<MethodDetail>[] = [];

  if (!enchant.treasureOnly) {
    const materials = materialsFor(input.category);
    const materialInputs =
      materials.length > 0
        ? materials.map((m) => ({ id: m, enchantability: enchantability(input.category, m) }))
        : [{ id: "—", enchantability: enchantability(input.category) }];

    const bestTable = findBestTableOdds(
      input.category,
      input.enchantId,
      input.level,
      materialInputs,
      input.bookshelves,
      input.trialsPerPoint
    )[0];
    if (bestTable) {
      methods.push({
        kind: "table_item",
        probability: bestTable.probability,
        detail: { material: bestTable.material, slot: bestTable.slot },
      });
    }

    const bestBook = findBestBookOdds(input.enchantId, input.level, input.bookshelves, input.trialsPerPoint)[0];
    if (bestBook) {
      methods.push({ kind: "table_book", probability: bestBook.probability, detail: { slot: bestBook.slot } });
    }
  }

  if (!isStructureLootOnly(input.enchantId)) {
    for (const r of treasureOdds(input.enchantId, input.level, input.luckOfTheSea ?? 0)) {
      if (r.source === "trading") methods.push({ kind: "trading", probability: r.probability });
      if (r.source === "fishing") methods.push({ kind: "fishing", probability: r.probability });
    }
  }

  return methods.length > 0 ? rankMethods(methods) : null;
}
