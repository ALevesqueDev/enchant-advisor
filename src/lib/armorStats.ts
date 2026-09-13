// Armor damage reduction — Phase 3 of the Stats Calculator.
//
// Both formula stages below are verbatim from minecraft.wiki/w/Armor
// (fetched via the wiki's own MediaWiki API, section-by-section, to get
// exact wikitext rather than a truncated/paraphrased page render — a
// rendered-page fetch of this exact page kept cutting off before reaching
// these formulas in an earlier pass; this is now HIGH confidence, not the
// "medium confidence" a first attempt landed at):
//
//   Stage 1 (armor points + toughness), simplified form (quoted):
//     damage reduction % = min(80, max(4/5*armorPoints,
//       4*armorPoints - 16*damage/(toughness+8)))
//   Per the wiki's own prose: "a BASE damage reduction of 4%*armorPoints"
//   (reached for a small/typical hit -- this is the well-known "20 armor =
//   80% reduction" folk number, since 4*20=80, capped at the 80 ceiling)
//   "a MINIMUM damage reduction of 4%*armorPoints/5" (the floor a large
//   enough hit decays toward) "and a maximum damage reduction of 80%".
//   So the reduction is NOT one fixed number -- it's higher for small hits
//   (near 4*armorPoints) and lower for big hits (settling at 0.8*armorPoints).
//
//   Stage 2 (Enchantment Protection Factor), quoted:
//     "the EPFs of all applicable enchantments are added together, having
//      a maximum of 20 ... damage reduction is resultingEPF/25"
//   Protection contributes EPF 1/level to EVERY damage type (except
//   sources that bypass invulnerability); Fire/Blast/Projectile
//   Protection each contribute EPF 2/level to ONLY their own type, on top
//   of whatever Protection itself already contributes.
//
// Verified per-enchantment EPF-per-level cross-checked in both directions
// this session: the wiki's own table (1/2/2/2) matches each protection
// enchantment's `per_level_above_first` field in the raw generated data.
import type { Material } from "./materials";

export type ArmorSlot = "helmet" | "chestplate" | "leggings" | "boots";
export type DamageType = "generic" | "fire" | "blast" | "projectile";
export type ProtectionEnchantId = "protection" | "fire_protection" | "blast_protection" | "projectile_protection";

const ARMOR_STATS: Record<ArmorSlot, Partial<Record<Material, { armor: number; toughness: number }>>> = {
  helmet: {
    leather: { armor: 1, toughness: 0 },
    chainmail: { armor: 2, toughness: 0 },
    iron: { armor: 2, toughness: 0 },
    golden: { armor: 2, toughness: 0 },
    diamond: { armor: 3, toughness: 2 },
    netherite: { armor: 3, toughness: 3 },
    copper: { armor: 2, toughness: 0 },
    turtle_shell: { armor: 2, toughness: 0 },
  },
  chestplate: {
    leather: { armor: 3, toughness: 0 },
    chainmail: { armor: 5, toughness: 0 },
    iron: { armor: 6, toughness: 0 },
    golden: { armor: 5, toughness: 0 },
    diamond: { armor: 8, toughness: 2 },
    netherite: { armor: 8, toughness: 3 },
    copper: { armor: 4, toughness: 0 },
  },
  leggings: {
    leather: { armor: 2, toughness: 0 },
    chainmail: { armor: 4, toughness: 0 },
    iron: { armor: 5, toughness: 0 },
    golden: { armor: 3, toughness: 0 },
    diamond: { armor: 6, toughness: 2 },
    netherite: { armor: 6, toughness: 3 },
    copper: { armor: 3, toughness: 0 },
  },
  boots: {
    leather: { armor: 1, toughness: 0 },
    chainmail: { armor: 1, toughness: 0 },
    iron: { armor: 2, toughness: 0 },
    golden: { armor: 1, toughness: 0 },
    diamond: { armor: 3, toughness: 2 },
    netherite: { armor: 3, toughness: 3 },
    copper: { armor: 1, toughness: 0 },
  },
};

export function armorPiecePoints(slot: ArmorSlot, material: Material): { armor: number; toughness: number } {
  return ARMOR_STATS[slot][material] ?? { armor: 0, toughness: 0 };
}

/** EPF contributed per level, by which protection enchantment. */
const PROTECTION_EPF_PER_LEVEL: Record<ProtectionEnchantId, number> = {
  protection: 1,
  fire_protection: 2,
  blast_protection: 2,
  projectile_protection: 2,
};

/** Which damage type(s) a protection enchantment's EPF applies to. "protection" applies to all four; the other three are type-specific, stacking on top of whatever Protection itself already contributes. */
const PROTECTION_DAMAGE_TYPE: Record<ProtectionEnchantId, DamageType | "all"> = {
  protection: "all",
  fire_protection: "fire",
  blast_protection: "blast",
  projectile_protection: "projectile",
};

export interface ArmorPieceEnchant {
  enchantId: ProtectionEnchantId;
  level: number;
}

/** Sums EPF across up to 4 armor pieces for one damage type, capped at 20 per the verified formula. */
export function totalEpf(pieces: Array<ArmorPieceEnchant | undefined>, damageType: DamageType): number {
  let epf = 0;
  for (const piece of pieces) {
    if (!piece || piece.level <= 0) continue;
    const appliesTo = PROTECTION_DAMAGE_TYPE[piece.enchantId];
    if (appliesTo === "all" || appliesTo === damageType) {
      epf += PROTECTION_EPF_PER_LEVEL[piece.enchantId] * piece.level;
    }
  }
  return Math.min(20, epf);
}

/** Stage 1 (armor+toughness) damage reduction %, for one specific incoming hit. */
export function armorReductionPercent(armorPoints: number, toughness: number, incomingDamage: number): number {
  const floor = (4 / 5) * armorPoints;
  const scaled = 4 * armorPoints - (16 * incomingDamage) / (toughness + 8);
  return Math.min(80, Math.max(floor, scaled));
}

/**
 * The reduction % reached for a small/typical hit (damage -> 0) -- this is
 * the well-known "20 armor points = 80% reduction" figure players
 * recognize (4*20=80, capped at 80). NOT independent of incoming damage in
 * general (see armorReductionPercent) -- this is the upper end of the
 * range, not a universal constant.
 */
export function armorReductionTypicalPercent(armorPoints: number): number {
  return Math.min(80, 4 * armorPoints);
}

/** The reduction % a large enough hit decays toward -- the lower end of the range, per the wiki's own "minimum damage reduction" phrasing. */
export function armorReductionFloorPercent(armorPoints: number): number {
  return Math.min(80, (4 / 5) * armorPoints);
}

/** Stage 2 (EPF) damage reduction %. */
export function epfReductionPercent(epf: number): number {
  return (Math.min(20, epf) / 25) * 100;
}

/** Combines both stages into one final "% less damage taken" figure -- NOT a simple sum (each stage applies to what the previous stage already let through). */
export function combinedReductionPercent(armorReduction: number, epfReduction: number): number {
  const remaining = (1 - armorReduction / 100) * (1 - epfReduction / 100);
  return (1 - remaining) * 100;
}
