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
// the item via a single FRESH book (never before used in an anvil), one
// enchant per anvil operation. Under that model the total cost across all
// steps is the same regardless of order (the penalty sequence 2^0-1, 2^1-1,
// ... is fixed by the step COUNT, not by which enchant lands on which step,
// and each enchant's own cost doesn't depend on when it's applied either).
// That's a real, useful fact — competitor calculators that present a
// "cheapest order" for this exact case are just permuting a total that
// doesn't change. Order only starts to matter once you're pre-combining two
// books to level one up before it ever touches the final item, which this
// first version doesn't model — see PROJECT.md "Not yet decided".

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
