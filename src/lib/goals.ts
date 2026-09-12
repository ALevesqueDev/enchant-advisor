// Goal taxonomy: for each item category, the intended-use presets a player
// picks from. Each goal maps to a target enchantment profile (id -> level
// worth reaching). This is the actual "advisor" knowledge — everything else
// in the app is mechanical (conflicts, anvil math).
//
// Two deliberate omissions from "technically compatible": Fortune isn't
// offered as a woodcutting target for axes (wood always drops 1:1, so it
// does nothing useful there even though the game lets you apply it), and
// Loyalty isn't bundled into every trident goal by default since it's a
// utility choice, not a damage/survival one.

import type { Goal, ItemCategory, LocalizedText } from "./types";

/** Shorthand for a bilingual label literal. */
function L(en: string, fr: string): LocalizedText {
  return { en, fr };
}

export const GOALS: Record<ItemCategory, Goal[]> = {
  pickaxe: [
    { id: "mining", label: L("Mining (resources)", "Minage (ressources)"), targets: { efficiency: 5, fortune: 3, unbreaking: 3, mending: 1 } },
    { id: "silk_touch", label: L("Silk Touch (deco, glass, ice)", "Silk Touch (déco, verre, glace)"), targets: { efficiency: 5, silk_touch: 1, unbreaking: 3, mending: 1 } },
  ],
  shovel: [
    { id: "mining", label: L("Mining (resources)", "Minage (ressources)"), targets: { efficiency: 5, fortune: 3, unbreaking: 3, mending: 1 } },
    { id: "silk_touch", label: L("Silk Touch (paths, gravel)", "Silk Touch (chemins, gravier)"), targets: { efficiency: 5, silk_touch: 1, unbreaking: 3, mending: 1 } },
  ],
  hoe: [
    { id: "farming", label: L("Farming", "Agriculture"), targets: { efficiency: 5, unbreaking: 3, mending: 1 } },
  ],
  axe: [
    { id: "woodcutting", label: L("Woodcutting", "Bûcheronnage"), targets: { efficiency: 5, unbreaking: 3, mending: 1 } },
    { id: "combat", label: L("Combat (axe as a weapon)", "Combat (hache comme arme)"), targets: { sharpness: 5, unbreaking: 3, mending: 1 } },
  ],
  sword: [
    { id: "pvp", label: L("PvP", "PvP"), targets: { sharpness: 5, unbreaking: 3, mending: 1, fire_aspect: 2 } },
    { id: "mob_farm", label: L("Mob farm (loot)", "Farm de mobs (butin)"), targets: { sharpness: 5, looting: 3, unbreaking: 3, mending: 1 } },
    { id: "crowd", label: L("Crowd / area (Sweeping Edge)", "Foule / zone (Sweeping Edge)"), targets: { sharpness: 5, sweeping_edge: 3, unbreaking: 3, mending: 1 } },
  ],
  bow: [
    { id: "pvp", label: L("PvP", "PvP"), targets: { power: 5, punch: 1, flame: 1, unbreaking: 3, mending: 1 } },
    { id: "sustained", label: L("Sustained use (infinite ammo)", "Usage prolongé (munitions infinies)"), targets: { power: 5, infinity: 1, unbreaking: 3 } },
  ],
  crossbow: [
    { id: "pvp", label: L("PvP", "PvP"), targets: { quick_charge: 3, piercing: 4, unbreaking: 3, mending: 1 } },
    { id: "fireworks", label: L("Firework volley", "Volée de feux d'artifice"), targets: { multishot: 1, quick_charge: 3, unbreaking: 3, mending: 1 } },
  ],
  trident: [
    { id: "melee", label: L("Melee", "Mêlée"), targets: { impaling: 5, unbreaking: 3, mending: 1 } },
    { id: "riptide", label: L("Riptide (movement/rain)", "Riptide (déplacement/pluie)"), targets: { riptide: 3, impaling: 5, unbreaking: 3, mending: 1 } },
    { id: "throw", label: L("Throwing (Loyalty)", "Lancer (Loyalty)"), targets: { loyalty: 3, impaling: 5, unbreaking: 3, mending: 1 } },
  ],
  mace: [
    { id: "general", label: L("General combat", "Combat général"), targets: { density: 5, wind_burst: 3, unbreaking: 3, mending: 1 } },
    { id: "armor_break", label: L("Anti-armor (Breach)", "Anti-armure (Breach)"), targets: { breach: 4, wind_burst: 3, unbreaking: 3, mending: 1 } },
  ],
  spear: [
    { id: "general", label: L("General combat", "Combat général"), targets: { lunge: 3, sharpness: 5, unbreaking: 3, mending: 1 } },
  ],
  helmet: [
    { id: "general", label: L("General survival", "Survie générale"), targets: { protection: 4, unbreaking: 3, mending: 1 } },
    { id: "underwater", label: L("Underwater / flooded caves", "Sous l'eau / grottes noyées"), targets: { respiration: 3, aqua_affinity: 1, protection: 4, unbreaking: 3, mending: 1 } },
  ],
  chestplate: [
    { id: "general", label: L("General survival", "Survie générale"), targets: { protection: 4, unbreaking: 3, mending: 1 } },
    { id: "pvp", label: L("PvP", "PvP"), targets: { protection: 4, thorns: 3, unbreaking: 3, mending: 1 } },
  ],
  leggings: [
    { id: "general", label: L("General survival", "Survie générale"), targets: { protection: 4, unbreaking: 3, mending: 1 } },
    { id: "stealth", label: L("Stealth (Swift Sneak)", "Discrétion (Swift Sneak)"), targets: { swift_sneak: 3, protection: 4, unbreaking: 3, mending: 1 } },
  ],
  boots: [
    { id: "general", label: L("General survival", "Survie générale"), targets: { protection: 4, unbreaking: 3, mending: 1 } },
    { id: "fall", label: L("Falls", "Chutes"), targets: { feather_falling: 4, protection: 4, unbreaking: 3, mending: 1 } },
    { id: "mobility_water", label: L("Water mobility (Depth Strider)", "Mobilité aquatique (Depth Strider)"), targets: { depth_strider: 3, protection: 4, unbreaking: 3, mending: 1 } },
    { id: "mobility_ice", label: L("Ice mobility (Frost Walker)", "Mobilité glaciale (Frost Walker)"), targets: { frost_walker: 2, protection: 4, unbreaking: 3, mending: 1 } },
    { id: "nether", label: L("Soul sand speed (Soul Speed)", "Vitesse sur sable des âmes (Soul Speed)"), targets: { soul_speed: 3, protection: 4, unbreaking: 3, mending: 1 } },
  ],
  shield: [
    { id: "general", label: L("General survival", "Survie générale"), targets: { unbreaking: 3, mending: 1 } },
  ],
  fishing_rod: [
    { id: "loot", label: L("Loot (treasure)", "Butin (trésors)"), targets: { luck_of_the_sea: 3, unbreaking: 3, mending: 1 } },
    { id: "speed", label: L("Fast fishing", "Pêche rapide"), targets: { lure: 3, unbreaking: 3, mending: 1 } },
  ],
  elytra: [
    { id: "general", label: L("General survival", "Survie générale"), targets: { unbreaking: 3, mending: 1 } },
  ],
};
