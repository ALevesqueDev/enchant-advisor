// Ranged-weapon enchant stats (bow/crossbow) — Phase 4 of the Stats
// Calculator. Every formula verified verbatim against the real
// enchantment `effects` data (github.com/misode/mcmeta, 26.2-data) this
// session, same discipline as weaponStats.ts.
//
// Deliberately does NOT compute a "final arrow damage" or "final charge
// time" number: a bow/crossbow's own base attack_damage attribute is
// confirmed EMPTY in the generated data (neither item carries one at all
// — damage comes from the fired projectile's own physics, and the base
// crossbow charge time isn't exposed anywhere either). Showing Power's
// bonus as if it were added to a made-up base number, or Quick Charge's
// reduction as if subtracted from a guessed base time, would be exactly
// the kind of unverified number this project's whole sourcing discipline
// exists to avoid — so these stay honest, standalone bonus/reduction
// figures instead of a fabricated total.

function linear(base: number, perLevelAboveFirst: number, level: number): number {
  return level > 0 ? base + perLevelAboveFirst * (level - 1) : 0;
}

/** Power's bonus arrow damage (added to the arrow's own base damage, which this app doesn't compute -- see file header). */
export function powerBonusDamage(level: number): number {
  return linear(1.0, 0.5, level);
}

/** Piercing's extra entities one arrow can hit. */
export function piercingCount(level: number): number {
  return level > 0 ? linear(1.0, 1.0, level) : 0;
}

/** Multishot fires 3 arrows total for the cost of 1 (max_level 1 -- it's a flag, not a scaling enchant). */
export const MULTISHOT_ARROW_COUNT = 3;

/** Quick Charge's crossbow reload-time reduction, in seconds (negative; not a final time -- base crossbow charge time isn't exposed in the generated data). */
export function quickChargeReductionSeconds(level: number): number {
  return level > 0 ? linear(-0.25, -0.25, level) : 0;
}
