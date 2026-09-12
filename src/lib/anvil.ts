// Anvil cost calculator.
//
// Formulas verified against minecraft.wiki/w/Anvil_mechanics on 2026-09-11
// (see PROJECT.md) rather than recalled from memory:
//
//   priorWorkPenalty(n) = 2^n - 1      (n = times this item has been used
//                                        as an anvil TARGET before)
//   step cost = priorWorkPenalty(target) + priorWorkPenalty(sacrifice)
//               + enchantCost
//   enchantCost = anvilCost * resultingLevel   (anvilCost applies when the
//               source is a BOOK; combining two enchanted ITEMS costs
//               double — that item-vs-book 2x relationship is a
//               long-standing, well-corroborated rule, kept here even
//               though it wasn't re-verified against raw data this pass)
//   39-level cap applies PER OPERATION in Survival/Adventure, not to a
//   cumulative total — Creative has no cap.
//
// `anvilCost` itself (per enchantment, in enchantments.ts) WAS re-verified
// against the actual game data on 2026-09-11 and turned out to be roughly
// double what an earlier wiki-summary fetch had reported for several
// enchantments (e.g. Loyalty) — the raw per-enchantment JSON files are
// trusted over that summary; see enchantments.ts's header.
//
// Scope: this models the common case — applying each target enchantment to
// the item via a single FRESH book ALREADY AT THE TARGET LEVEL, one enchant
// per anvil operation. Under that model the total cost across all steps is
// the same regardless of order (the penalty sequence 2^0-1, 2^1-1, ... is
// fixed by the step COUNT, not by which enchant lands on which step, and
// each enchant's own cost doesn't depend on when it's applied either).
// That's a real, useful fact — competitor calculators that present a
// "cheapest order" for this exact case are just permuting a total that
// doesn't change.
//
// What THIS model glosses over: getting a book "already at the target
// level" isn't free if you can't find/buy/roll one directly — you may need
// to build it up from lower-level books via repeated same-level anvil
// merges (combining two copies at an EQUAL level bumps the result by
// exactly one level — verified against multiple independent sources, not
// just one wiki fetch, given this session's earlier wiki-fabrication
// incident). buildUpPlan() below prices that path; it's kept SEPARATE from
// planAnvilCombines() rather than interleaved into one unified multi-step
// sequence — modeling "level up enchant A while also touching the item for
// enchants B and C in some interleaved order" is a much bigger combinatorial
// problem than this pass takes on. See PROJECT.md for that scoping call.

import { enchantmentById } from "./enchantments";

export interface AnvilStep {
  enchantId: string;
  level: number;
  priorWorkPenalty: number;
  enchantCost: number;
  stepCost: number;
  tooExpensive: boolean;
}

export interface AnvilPlan {
  steps: AnvilStep[];
  totalCost: number;
  anyTooExpensive: boolean;
}

function priorWorkPenalty(timesUsed: number): number {
  return Math.pow(2, timesUsed) - 1;
}

/**
 * targets: enchantment id -> level to apply, in the order they'll be combined.
 * Order doesn't change the total (see file header) but does change which
 * individual step might hit the 39 cap first, so it's still shown per-step.
 */
export function planAnvilCombines(targets: Array<{ id: string; level: number }>): AnvilPlan {
  const steps: AnvilStep[] = targets.map((t, index) => {
    const enchant = enchantmentById(t.id);
    const penalty = priorWorkPenalty(index);
    const enchantCost = enchant.anvilCost * t.level;
    const stepCost = penalty + enchantCost; // sacrifice (fresh book) contributes 0 penalty
    return {
      enchantId: t.id,
      level: t.level,
      priorWorkPenalty: penalty,
      enchantCost,
      stepCost,
      tooExpensive: stepCost > 39,
    };
  });

  return {
    steps,
    totalCost: steps.reduce((sum, s) => sum + s.stepCost, 0),
    anyTooExpensive: steps.some((s) => s.tooExpensive),
  };
}

export interface BuildUpStep {
  fromLevel: number;
  toLevel: number;
  /** Cost to build the fresh same-level spare this step merges in, from scratch. */
  spareCost: number;
  /** Cost of the merge itself (both sides' prior-work penalty + the enchant cost at the resulting level). */
  mergeCost: number;
  tooExpensive: boolean;
}

export interface BuildUpPlan {
  steps: BuildUpStep[];
  totalCost: number;
  /** How many level-1 books this consumes in total, across every spare built along the way. */
  level1BooksNeeded: number;
  anyTooExpensive: boolean;
}

/**
 * Cost to build ONE book at `level` entirely from scratch (level-1 books
 * are free/given — that's a single table roll, priced separately by
 * src/lib/tableOdds.ts). Indexed by level; buildCost[1] = 0.
 *
 *   buildCost(1) = 0
 *   buildCost(n) = 2*buildCost(n-1) + 2*(2^(n-2) - 1) + anvilCost*n
 *
 * The two `buildCost(n-1)` terms are the two level-(n-1) copies needed
 * (one becomes the result, one is sacrificed); the `2*(2^(n-2)-1)` is
 * both copies' own prior-work penalty at that final merge (each has been
 * touched n-2 times to reach level n-1); `anvilCost*n` is the enchant cost
 * at the resulting level n.
 */
function buildCostTable(anvilCost: number, maxLevel: number): number[] {
  const cost = [0, 0]; // cost[0] unused, cost[1] = 0
  for (let n = 2; n <= maxLevel; n++) {
    cost[n] = 2 * cost[n - 1] + 2 * (Math.pow(2, n - 2) - 1) + anvilCost * n;
  }
  return cost;
}

/**
 * Prices leveling an enchantment up from `fromLevel` (0 if you have
 * nothing yet) to `toLevel` via repeated equal-level merges, keeping one
 * "main" book/item growing and building a fresh matching spare at each
 * level along the way. This linear chain costs EXACTLY the same as the
 * more obvious-looking balanced binary tree (build two halves, merge them,
 * recursively) — provable by induction from the same order-invariance
 * fact the main planAnvilCombines() relies on — so there's no smarter
 * structure to search for here despite appearances.
 *
 * Returns null if fromLevel >= toLevel (nothing to build).
 */
export function planBuildUp(anvilCost: number, fromLevel: number, toLevel: number): BuildUpPlan | null {
  const start = Math.max(fromLevel, 1);
  if (start >= toLevel) return null;

  const buildCost = buildCostTable(anvilCost, toLevel - 1);
  const steps: BuildUpStep[] = [];
  // Starting from nothing, the "main" chain's own seed is a level-1 book
  // too — not just the spares merged into it at each step below.
  let level1BooksNeeded = fromLevel < 1 ? 1 : 0;

  for (let k = start; k < toLevel; k++) {
    const mainTouches = k - start;
    const spareTouches = k - 1; // the spare is always built fresh from level 1
    const spareCost = buildCost[k] ?? 0;
    const mergeCost = priorWorkPenalty(mainTouches) + priorWorkPenalty(spareTouches) + anvilCost * (k + 1);
    steps.push({
      fromLevel: k,
      toLevel: k + 1,
      spareCost,
      mergeCost,
      tooExpensive: mergeCost > 39,
    });
    level1BooksNeeded += Math.pow(2, k - 1);
  }

  return {
    steps,
    totalCost: steps.reduce((sum, s) => sum + s.spareCost + s.mergeCost, 0),
    level1BooksNeeded,
    anyTooExpensive: steps.some((s) => s.tooExpensive),
  };
}
