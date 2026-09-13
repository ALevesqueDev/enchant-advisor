// Interactive 2-slot anvil combine simulator — mirrors the real in-game
// "Repair & Name" GUI (target slot + sacrifice slot -> result), reusing
// anvil.ts's own priorWorkPenalty() rather than a second copy of it.
//
// Scope, deliberately narrower than the real anvil (see PROJECT.md for the
// full record): one enchantment per slot (not a whole book's worth at
// once), sacrifice is always a book (not another item), no repair-with-
// material and no durability modeling. Renaming is the one extra real
// mechanic included, since it's simple and fully verified (see below).
//
// Renaming cost: verified verbatim against minecraft.wiki/w/Anvil_mechanics
// this session -- a flat 1 level, on top of whatever else the operation
// costs, whether or not anything is also being enchanted.
//
// Incompatible enchantments: the SAME wiki page contains two internally
// CONTRADICTORY passages -- one says the anvil refuses the combination
// outright (a red "X", current behavior); a worked example elsewhere on
// the same page shows that exact scenario completing anyway, discarding
// the sacrifice's conflicting enchant for a small surcharge (this reads
// as leftover pre-1.13 wording, per the page's own aside about that era's
// different behavior, not re-verified against a live game this pass).
// Implemented the "refuse" rule here since it's the clearly-stated general
// rule, not a stray example -- flagged plainly in the UI, not silently
// picked, same honesty standard as everywhere else in this app.
import { priorWorkPenalty } from "./anvil";
import { enchantmentById } from "./enchantments";

export interface AnvilSlot {
  /** null = nothing enchanted in this slot (an empty book, or a bare item with no prior enchantment). */
  enchantId: string | null;
  level: number;
  /** How many times THIS item has already been an anvil TARGET before -- each side tracks its own. */
  priorUses: number;
}

export type AnvilSimResult =
  | { status: "blocked-incompatible" }
  | { status: "nothing-to-do" }
  | {
      status: "ok";
      resultEnchantId: string;
      resultLevel: number;
      cost: number;
      tooExpensive: boolean;
    };

/**
 * One combine operation: `target` (the item/book being kept) + `sacrifice`
 * (the book being consumed) + optional renaming -> the result and its XP
 * cost, or a blocked/no-op state.
 */
export function simulateAnvilCombine(target: AnvilSlot, sacrifice: AnvilSlot, renaming: boolean): AnvilSimResult {
  const penalties = priorWorkPenalty(target.priorUses) + priorWorkPenalty(sacrifice.priorUses);
  const renameCost = renaming ? 1 : 0;

  if (!sacrifice.enchantId || sacrifice.level <= 0) {
    // Nothing being merged in -- a pure rename is still a real, chargeable operation.
    if (renaming) {
      return { status: "ok", resultEnchantId: target.enchantId ?? "", resultLevel: target.level, cost: penalties + renameCost, tooExpensive: penalties + renameCost > 39 };
    }
    return { status: "nothing-to-do" };
  }

  const sacrificeEnchant = enchantmentById(sacrifice.enchantId);

  if (target.enchantId && target.enchantId !== sacrifice.enchantId) {
    const targetEnchant = enchantmentById(target.enchantId);
    if (targetEnchant.incompatibleWith.includes(sacrifice.enchantId)) {
      return { status: "blocked-incompatible" };
    }
  }

  const sameEnchant = target.enchantId === sacrifice.enchantId;
  const resultLevel = sameEnchant
    ? target.level === sacrifice.level
      ? Math.min(sacrificeEnchant.maxLevel, target.level + 1) // equal levels -- the one real bump
      : Math.max(target.level, sacrifice.level) // unequal -- higher wins, no bonus
    : sacrifice.level; // target had nothing (or something compatible-and-different, which this single-enchant-per-slot model doesn't represent) -- sacrifice's enchant applies fresh

  const enchantCost = sacrificeEnchant.anvilCost * resultLevel; // book source -- no x2 (sacrifice is always a book in this simulator, see file header)
  const cost = penalties + enchantCost + renameCost;

  return { status: "ok", resultEnchantId: sacrifice.enchantId, resultLevel, cost, tooExpensive: cost > 39 };
}
