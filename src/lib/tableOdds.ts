// Enchanting-table probability engine.
//
// This is Monte Carlo simulation of the real vanilla algorithm, not a
// closed-form probability formula — the process (weighted pick, remove
// incompatible candidates, decaying chance to add another, repeat) doesn't
// have a clean analytical solution, and simulating the actual game logic
// is far less error-prone than trying to hand-derive one. Formulas verified
// against minecraft.wiki/w/Enchanting_mechanics on 2026-09-11:
//
//   eCost = round((displayedLevel + 1 + rand(0,b) + rand(0,b))
//                 * (1 + randTriangular(-0.15, 0.15)))
//     where b = floor(enchantability / 4), clamped to at least 1
//
//   Then repeatedly: build the candidate list (enchantments valid for the
//   item whose [minCost(level), maxCost(level)] range contains eCost, at
//   their highest such level), weighted-random pick one, remove it and
//   anything incompatible with it from the pool, then continue with
//   probability (eCost+1)/50 after halving eCost (floor) — stop otherwise
//   or when the pool is empty.
//
// Books follow the same roll, then one extra rule (confirmed against
// multiple independent sources, not just one wiki fetch, given this
// session's earlier wiki-fabrication incident — see PROJECT.md): if the
// roll produced more than one enchantment, one is discarded at random.
// Books also aren't restricted to an item category's candidate pool — see
// nonTreasurePool() in enchantments.ts and findBestBookOdds() below.

import { enchantmentsFor, nonTreasurePool } from "./enchantments";
import type { Enchantment, ItemCategory } from "./types";

/**
 * Bookshelf → displayed-level mechanics. Formula verified against
 * minecraft.wiki/w/Enchanting_mechanics on 2026-09-12 — but only the
 * *formula itself* and the well-known "15 bookshelves guarantees a
 * level-30 bottom slot" fact it reproduces exactly, not the page's own
 * prose summary of it, which claimed a bookshelf-count range that
 * contradicted its own formula. Same lesson as the Cleaving/wind_burst
 * incidents in PROJECT.md: verify by computing, don't trust a paraphrase.
 *
 *   xpBase = 1 + rand(0,7) + floor(B/2) + rand(0,B)   (B = bookshelves, capped at 15)
 *   top    = floor(max(1, xpBase / 3))
 *   middle = floor(2*xpBase / 3) + 1
 *   bottom = max(xpBase, 2*B)
 *
 * Only the first 15 bookshelves count — more than that has no further
 * effect, same as in-game. The level is re-rolled every time the table's
 * seed changes (any inventory click), so a Monte-Carlo trial re-rolls it
 * fresh each time too, rather than treating it as a single fixed number.
 */
export type EnchantingSlot = "top" | "middle" | "bottom";
export const ENCHANTING_SLOTS: EnchantingSlot[] = ["top", "middle", "bottom"];

function levelFromXpBase(slot: EnchantingSlot, xpBase: number, bookshelves: number): number {
  switch (slot) {
    case "top":
      return Math.floor(Math.max(1, xpBase / 3));
    case "middle":
      return Math.floor((2 * xpBase) / 3) + 1;
    case "bottom":
      return Math.max(xpBase, 2 * bookshelves);
  }
}

/** One random displayed level for `slot` at a given bookshelf count. */
function rollSlotLevel(slot: EnchantingSlot, bookshelves: number): number {
  const b = Math.max(0, Math.min(15, bookshelves));
  const xpBase = 1 + Math.floor(Math.random() * 8) + Math.floor(b / 2) + Math.floor(Math.random() * (b + 1));
  return levelFromXpBase(slot, xpBase, b);
}

/**
 * The full range a slot could ever show at a given bookshelf count —
 * display-only (e.g. "Bottom slot, level 24-30"), not used by the
 * simulation itself, which re-rolls a fresh value every trial instead of
 * assuming the middle or edges of this range.
 */
export function slotLevelRange(slot: EnchantingSlot, bookshelves: number): { min: number; max: number } {
  const b = Math.max(0, Math.min(15, bookshelves));
  return {
    min: levelFromXpBase(slot, 1 + Math.floor(b / 2), b),
    max: levelFromXpBase(slot, 1 + 7 + Math.floor(b / 2) + b, b),
  };
}

function minCost(e: Enchantment, level: number): number {
  return e.minCost.base + e.minCost.perLevelAboveFirst * (level - 1);
}
function maxCost(e: Enchantment, level: number): number {
  return e.maxCost.base + e.maxCost.perLevelAboveFirst * (level - 1);
}

/** Sum of two uniform(0,1) draws minus 1 — a symmetric triangular distribution on [-1, 1]. */
function randTriangular(): number {
  return Math.random() - Math.random();
}

function computeECost(displayedLevel: number, enchantability: number): number {
  const b = Math.max(1, Math.floor(enchantability / 4));
  const randomBonus = Math.floor(Math.random() * (b + 1)) + Math.floor(Math.random() * (b + 1));
  const modified = displayedLevel + 1 + randomBonus;
  const withVariance = modified * (1 + randTriangular() * 0.15);
  return Math.max(1, Math.round(withVariance));
}

interface RolledEnchant {
  id: string;
  level: number;
}

/** One simulated table roll against a fixed candidate pool. */
function simulateRoll(pool: Enchantment[], startingECost: number, isBook = false): RolledEnchant[] {
  let remaining = pool;
  let eCost = startingECost;
  const picked: RolledEnchant[] = [];

  while (true) {
    const candidates: RolledEnchant[] = [];
    const candidateEnchants: Enchantment[] = [];
    for (const e of remaining) {
      for (let level = e.maxLevel; level >= 1; level--) {
        if (eCost >= minCost(e, level) && eCost <= maxCost(e, level)) {
          candidates.push({ id: e.id, level });
          candidateEnchants.push(e);
          break;
        }
      }
    }
    if (candidates.length === 0) break;

    const totalWeight = candidateEnchants.reduce((sum, e) => sum + e.weight, 0);
    let roll = Math.random() * totalWeight;
    let chosenIndex = 0;
    for (let i = 0; i < candidateEnchants.length; i++) {
      roll -= candidateEnchants[i].weight;
      if (roll <= 0) {
        chosenIndex = i;
        break;
      }
    }
    const chosen = candidates[chosenIndex];
    const chosenEnchant = candidateEnchants[chosenIndex];
    picked.push(chosen);

    remaining = remaining.filter(
      (e) => e.id !== chosenEnchant.id && !chosenEnchant.incompatibleWith.includes(e.id)
    );

    const continueChance = (eCost + 1) / 50;
    if (Math.random() >= continueChance) break;
    eCost = Math.floor(eCost / 2);
  }

  if (isBook && picked.length > 1) {
    picked.splice(Math.floor(Math.random() * picked.length), 1);
  }

  return picked;
}

export interface TableOddsInput {
  /** Item category to restrict the candidate pool to (via enchantmentsFor). Ignored if `pool` is given. */
  category?: ItemCategory;
  /** Explicit candidate pool override — used for fishing's book slot and book mode, neither restricted by item category. */
  pool?: Enchantment[];
  /**
   * Fixed table level (1-30), used as-is every trial. Only fishing's book
   * roll in treasure.ts uses this path now — it's modeling "a book that
   * rolled at full power," not a physical table with bookshelves.
   */
  displayedLevel?: number;
  /**
   * Real-table alternative to `displayedLevel`: pass both `bookshelves`
   * and `slot` and the displayed level is re-rolled from the real formula
   * every trial (see the header above), matching what actually happens at
   * a table with that many shelves. Takes priority over `displayedLevel`
   * when both are given.
   */
  bookshelves?: number;
  slot?: EnchantingSlot;
  enchantability: number;
  targetEnchantId: string;
  targetLevel: number;
  trials?: number;
  /** Applies the book-specific "-1 enchantment if more than one" rule. */
  isBook?: boolean;
}

/** Probability (0-1) that a single table roll offers targetEnchantId at >= targetLevel. */
export function simulateTableOdds(input: TableOddsInput): number {
  const trials = input.trials ?? 4000;
  const pool = input.pool ?? enchantmentsFor(input.category!);
  const rollLevel: () => number =
    input.slot && input.bookshelves !== undefined
      ? () => rollSlotLevel(input.slot!, input.bookshelves!)
      : () => input.displayedLevel!;

  let hits = 0;
  for (let i = 0; i < trials; i++) {
    const eCost = computeECost(rollLevel(), input.enchantability);
    const rolled = simulateRoll(pool, eCost, input.isBook);
    if (rolled.some((r) => r.id === input.targetEnchantId && r.level >= input.targetLevel)) hits++;
  }
  return hits / trials;
}

export interface BestTableCombo {
  material: string;
  slot: EnchantingSlot;
  probability: number;
}

/**
 * Sweeps every material available for the category across the 3 real
 * table slots (at the player's own bookshelf count) to find the best odds
 * of the target enchant/level. Materials with no variants (e.g. bow) are
 * handled by the caller passing a single entry.
 *
 * This used to sweep an abstract "displayed level 1-30" instead of
 * bookshelves/slot — accurate, but not actionable: a player can't type in
 * a table level, only choose a bookshelf count and then watch one of 3
 * slots. Bookshelf-count helper (PROJECT.md roadmap) replaced that sweep
 * with this one so results map directly onto what's actually clickable.
 */
export function findBestTableOdds(
  category: ItemCategory,
  targetEnchantId: string,
  targetLevel: number,
  materials: Array<{ id: string; enchantability: number }>,
  bookshelves: number,
  trialsPerPoint = 6000
): BestTableCombo[] {
  const results: BestTableCombo[] = [];
  for (const material of materials) {
    for (const slot of ENCHANTING_SLOTS) {
      const probability = simulateTableOdds({
        category,
        bookshelves,
        slot,
        enchantability: material.enchantability,
        targetEnchantId,
        targetLevel,
        trials: trialsPerPoint,
      });
      results.push({ material: material.id, slot, probability });
    }
  }
  return results.sort((a, b) => b.probability - a.probability);
}

export interface BookshelfCurvePoint {
  bookshelves: number;
  /** Best probability achievable at this exact bookshelf count (best material × slot combo). */
  probability: number;
}

/**
 * "How much does adding another bookshelf actually help?" — sweeps every
 * bookshelf count 0-15 (not just the player's current one) and, at each
 * count, finds the best material × slot combo the same way
 * findBestTableOdds() does. Lower trial count per point than
 * findBestTableOdds's own default since this runs that same sweep 16
 * times over — the curve's shape is what matters here, not the same
 * precision a single-count lookup wants.
 */
export function bookshelfCurve(
  category: ItemCategory,
  targetEnchantId: string,
  targetLevel: number,
  materials: Array<{ id: string; enchantability: number }>,
  trialsPerPoint = 800
): BookshelfCurvePoint[] {
  const points: BookshelfCurvePoint[] = [];
  for (let bookshelves = 0; bookshelves <= 15; bookshelves++) {
    const best = findBestTableOdds(category, targetEnchantId, targetLevel, materials, bookshelves, trialsPerPoint)[0];
    points.push({ bookshelves, probability: best?.probability ?? 0 });
  }
  return points;
}

export interface BestBookSlot {
  slot: EnchantingSlot;
  probability: number;
}

/**
 * Books have no material/enchantability choice (enchantability is fixed at
 * 1, same as bow/trident/etc.) and aren't restricted to one item category's
 * pool — every non-treasure enchantment is a candidate. So (since the
 * bookshelf-count helper above) the only thing left worth sweeping is
 * which of the 3 slots to watch.
 */
export function findBestBookOdds(
  targetEnchantId: string,
  targetLevel: number,
  bookshelves: number,
  trialsPerPoint = 8000
): BestBookSlot[] {
  const pool = nonTreasurePool();
  const results: BestBookSlot[] = [];
  for (const slot of ENCHANTING_SLOTS) {
    const probability = simulateTableOdds({
      pool,
      bookshelves,
      slot,
      enchantability: 1,
      targetEnchantId,
      targetLevel,
      trials: trialsPerPoint,
      isBook: true,
    });
    results.push({ slot, probability });
  }
  return results.sort((a, b) => b.probability - a.probability);
}
