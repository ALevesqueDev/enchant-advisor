// Melee combat stats — Phase 1 of the "Calculateur de statistiques" mode.
//
// Base weapon numbers (weapon-data.json) and every enchantment formula below
// come from `effects`/`minecraft:attribute_modifiers` fields in the real
// generated game data (github.com/misode/mcmeta, 26.2-summary/26.2-data) —
// fetched and verified this session, not recalled from memory. See
// PROJECT.md for the full extraction record.
//
// Deliberately NOT a generic interpreter for the game's `requirements`
// predicate system (damage-source tags, entity-type checks, `all_of`/
// `inverted` trees, etc.) — that's real complexity with no caller yet, so
// building it now would be exactly the "one adapter is hypothetical"
// mistake codebase-design warns about. Instead, each enchantment below
// hardcodes the ONE condition it actually needs (a target-mob category, or
// nothing) as a plain enum. If a later phase needs the general predicate
// system, build it then, against real second/third use cases.
//
// One real, documented gap: the player's own base attack_damage (1.0) and
// attack_speed (4.0), which every weapon's own modifier stacks on top of,
// are NOT exposed anywhere in misode/mcmeta — they're hardcoded in the
// Java source, not data-driven. Cross-checked instead against well-known,
// stable vanilla behavior (e.g. diamond sword = 7 damage, 1.6 attacks/sec)
// which matches those two constants combined with the verified per-item
// modifiers above — solid by corroboration, just not generator-sourced
// like everything else in this file.
import weaponData from "./weapon-data.json";
import type { Material } from "./materials";

const PLAYER_BASE_ATTACK_DAMAGE = 1.0;
const PLAYER_BASE_ATTACK_SPEED = 4.0;

export type MeleeWeapon = "sword" | "axe" | "trident" | "mace";

/** Trident and mace have no material variants (materialsFor() already returns [] for both) — one fixed real-world item each, not seven material tiers. */
export const FIXED_STAT_WEAPONS: MeleeWeapon[] = ["trident", "mace"];

export interface WeaponBaseStats {
  attackDamage: number;
  attackSpeed: number;
  maxDamage: number;
}

const WEAPON_DATA = weaponData as Record<string, Record<string, WeaponBaseStats> | WeaponBaseStats>;

/**
 * Base damage/speed/durability for a weapon (+ material, for sword/axe --
 * ignored for trident/mace, which have a single fixed stat block instead)
 * — already includes the player's own base attributes (verify: diamond
 * sword = 7.0 dmg, 1.6/s).
 */
export function weaponBaseStats(weapon: MeleeWeapon, material: Material): WeaponBaseStats {
  const entry = WEAPON_DATA[weapon];
  const stats = FIXED_STAT_WEAPONS.includes(weapon) ? (entry as WeaponBaseStats) : (entry as Record<string, WeaponBaseStats>)?.[material];
  if (!stats) throw new Error(`No weapon data for ${weapon}/${material}`);
  return stats;
}

/** Sanity re-export so a caller can double-check the two hardcoded constants above against a live number if ever needed. */
export const PLAYER_BASE_ATTRIBUTES = { attackDamage: PLAYER_BASE_ATTACK_DAMAGE, attackSpeed: PLAYER_BASE_ATTACK_SPEED };

/** `base + per_level_above_first * (level - 1)` — the shape almost every enchantment effect in the raw data uses. */
function linear(base: number, perLevelAboveFirst: number, level: number): number {
  return level > 0 ? base + perLevelAboveFirst * (level - 1) : 0;
}

export type DamageTarget = "generic" | "undead" | "arthropod" | "aquatic";

interface DamageEnchant {
  target: DamageTarget;
  base: number;
  perLevelAboveFirst: number;
}

/** minecraft:damage effects, target condition from each enchant's own `requirements` predicate. */
const DAMAGE_ENCHANTS: Record<string, DamageEnchant> = {
  sharpness: { target: "generic", base: 1.0, perLevelAboveFirst: 0.5 },
  smite: { target: "undead", base: 2.5, perLevelAboveFirst: 2.5 },
  bane_of_arthropods: { target: "arthropod", base: 2.5, perLevelAboveFirst: 2.5 },
  impaling: { target: "aquatic", base: 2.5, perLevelAboveFirst: 2.5 },
};

export const DAMAGE_ENCHANT_IDS = Object.keys(DAMAGE_ENCHANTS);

export function damageEnchantTarget(enchantId: string): DamageTarget | null {
  return DAMAGE_ENCHANTS[enchantId]?.target ?? null;
}

export interface MeleeDamageResult {
  /** Which mob category this number applies to -- "generic" for Sharpness (always applies), "undead"/"arthropod" for Smite/Bane (only against that category; 0 bonus otherwise). */
  target: DamageTarget;
  damagePerHit: number;
  /** Damage x attack speed, assuming the weapon is fully charged (see the post-1.9 attack-cooldown note in PROJECT.md) -- an upper bound, not what spamming clicks gets you. */
  dps: number;
}

/** enchantId may be null/unrecognized -- returns the weapon's plain base numbers with no bonus, target "generic". */
export function computeMeleeDamage(base: WeaponBaseStats, enchantId: string | null, level: number): MeleeDamageResult {
  const effect = enchantId ? DAMAGE_ENCHANTS[enchantId] : undefined;
  const bonus = effect ? linear(effect.base, effect.perLevelAboveFirst, level) : 0;
  const damagePerHit = base.attackDamage + bonus;
  return { target: effect?.target ?? "generic", damagePerHit, dps: damagePerHit * base.attackSpeed };
}

/**
 * Sweeping Edge's `sweeping_damage_ratio` bonus -- extra damage the sweep
 * (area) attack deals, as a fraction of the main hit. Verified formula:
 * numerator/denominator, both `linear(1, 1, level)` -- simplifies to
 * level/(level+1), but kept as the raw fraction here since that's what's
 * actually in the game data (collapsing it could hide a future formula
 * change where numerator/denominator stop matching).
 */
export function sweepingEdgeRatio(level: number): number {
  if (level <= 0) return 0;
  const numerator = linear(1.0, 1.0, level);
  const denominator = linear(2.0, 1.0, level);
  return numerator / denominator;
}

/** Fire Aspect's ignite duration in seconds (raw effect is in ticks, 20/sec). */
export function fireAspectSeconds(level: number): number {
  return linear(4.0, 4.0, level) / 20;
}

/**
 * Unbreaking's chance to skip consuming durability on this use -- the
 * non-armor branch of its `remove_binomial` effect (swords/axes/tools, not
 * armor pieces). Verified formula: numerator/denominator, both
 * `linear(1, 1, level)` -- simplifies to level/(level+1).
 */
export function unbreakingSaveChance(level: number): number {
  if (level <= 0) return 0;
  const numerator = linear(1.0, 1.0, level);
  const denominator = linear(2.0, 1.0, level);
  return numerator / denominator;
}
