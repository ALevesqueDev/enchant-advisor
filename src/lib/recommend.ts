// The recommendation engine: given what's already on the item and the
// chosen goal, work out what to add, what to upgrade, what's already
// optimal, and what current enchantment is blocking a target one.

import { enchantmentById } from "./enchantments";
import type { EnchantSet, Goal, Recommendation } from "./types";

export function recommend(current: EnchantSet, goal: Goal): Recommendation[] {
  const results: Recommendation[] = [];

  for (const [enchantId, targetLevel] of Object.entries(goal.targets)) {
    const currentLevel = current[enchantId] ?? 0;
    const enchant = enchantmentById(enchantId);

    // Does something already on the item conflict with this target?
    const blocker = Object.keys(current).find(
      (id) => current[id] > 0 && enchant.incompatibleWith.includes(id) && id !== enchantId
    );

    if (blocker) {
      results.push({
        enchantId,
        currentLevel,
        targetLevel,
        status: "conflict",
        conflictsWith: blocker,
      });
      continue;
    }

    if (currentLevel >= targetLevel) {
      results.push({ enchantId, currentLevel, targetLevel, status: "already-optimal" });
    } else if (currentLevel === 0) {
      results.push({ enchantId, currentLevel, targetLevel, status: "add" });
    } else {
      results.push({ enchantId, currentLevel, targetLevel, status: "upgrade" });
    }
  }

  return results;
}

/** Enchantments on the item that the chosen goal doesn't target — kept, harmless, just not the focus. */
export function untouchedCurrentEnchants(current: EnchantSet, goal: Goal): string[] {
  return Object.keys(current).filter((id) => current[id] > 0 && !(id in goal.targets));
}
