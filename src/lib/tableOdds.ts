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
  displayedLevel: number; // 1-30, what the slot shows in-game
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
  let hits = 0;
  for (let i = 0; i < trials; i++) {
    const eCost = computeECost(input.displayedLevel, input.enchantability);
    const rolled = simulateRoll(pool, eCost, input.isBook);
    if (rolled.some((r) => r.id === input.targetEnchantId && r.level >= input.targetLevel)) hits++;
  }
  return hits / trials;
}

export interface BestTableCombo {
  material: string;
  level: number;
  probability: number;
}

/**
 * Sweeps every material available for the category across levels 1-30 to
 * find the best odds of the target enchant/level. Materials with no
 * variants (e.g. bow) are handled by the caller passing a single entry.
 */
export function findBestTableOdds(
  category: ItemCategory,
  targetEnchantId: string,
  targetLevel: number,
  materials: Array<{ id: string; enchantability: number }>,
  trialsPerPoint = 1500
): BestTableCombo[] {
  const results: BestTableCombo[] = [];
  for (const material of materials) {
    for (let level = 1; level <= 30; level++) {
      const probability = simulateTableOdds({
        category,
        displayedLevel: level,
        enchantability: material.enchantability,
        targetEnchantId,
        targetLevel,
        trials: trialsPerPoint,
      });
      results.push({ material: material.id, level, probability });
    }
  }
  return results.sort((a, b) => b.probability - a.probability);
}

export interface BestBookLevel {
  level: number;
  probability: number;
}

/**
 * Books have no material/enchantability choice (enchantability is fixed at
 * 1, same as bow/trident/etc.) and aren't restricted to one item category's
 * pool — every non-treasure enchantment is a candidate. So the only thing
 * worth sweeping is the displayed level.
 */
export function findBestBookOdds(targetEnchantId: string, targetLevel: number, trialsPerPoint = 3000): BestBookLevel[] {
  const pool = nonTreasurePool();
  const results: BestBookLevel[] = [];
  for (let level = 1; level <= 30; level++) {
    const probability = simulateTableOdds({
      pool,
      displayedLevel: level,
      enchantability: 1,
      targetEnchantId,
      targetLevel,
      trials: trialsPerPoint,
      isBook: true,
    });
    results.push({ level, probability });
  }
  return results.sort((a, b) => b.probability - a.probability);
}
