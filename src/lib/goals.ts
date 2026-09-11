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

import type { Goal, ItemCategory } from "./types";

export const GOALS: Record<ItemCategory, Goal[]> = {
  pickaxe: [
    { id: "mining", label: "Minage (ressources)", targets: { efficiency: 5, fortune: 3, unbreaking: 3, mending: 1 } },
    { id: "silk_touch", label: "Silk Touch (déco, verre, glace)", targets: { efficiency: 5, silk_touch: 1, unbreaking: 3, mending: 1 } },
  ],
  shovel: [
    { id: "mining", label: "Minage (ressources)", targets: { efficiency: 5, fortune: 3, unbreaking: 3, mending: 1 } },
    { id: "silk_touch", label: "Silk Touch (chemins, gravier)", targets: { efficiency: 5, silk_touch: 1, unbreaking: 3, mending: 1 } },
  ],
  hoe: [
    { id: "farming", label: "Agriculture", targets: { efficiency: 5, unbreaking: 3, mending: 1 } },
  ],
  axe: [
    { id: "woodcutting", label: "Bûcheronnage", targets: { efficiency: 5, unbreaking: 3, mending: 1 } },
    { id: "combat", label: "Combat (hache comme arme)", targets: { sharpness: 5, unbreaking: 3, mending: 1 } },
  ],
  sword: [
    { id: "pvp", label: "PvP", targets: { sharpness: 5, unbreaking: 3, mending: 1, fire_aspect: 2 } },
    { id: "mob_farm", label: "Farm de mobs (butin)", targets: { sharpness: 5, looting: 3, unbreaking: 3, mending: 1 } },
    { id: "crowd", label: "Foule / zone (Sweeping Edge)", targets: { sharpness: 5, sweeping_edge: 3, unbreaking: 3, mending: 1 } },
  ],
  bow: [
    { id: "pvp", label: "PvP", targets: { power: 5, punch: 1, flame: 1, unbreaking: 3, mending: 1 } },
    { id: "sustained", label: "Usage prolongé (munitions infinies)", targets: { power: 5, infinity: 1, unbreaking: 3 } },
  ],
  crossbow: [
    { id: "pvp", label: "PvP", targets: { quick_charge: 3, piercing: 4, unbreaking: 3, mending: 1 } },
    { id: "fireworks", label: "Volée de feux d'artifice", targets: { multishot: 1, quick_charge: 3, unbreaking: 3, mending: 1 } },
  ],
  trident: [
    { id: "melee", label: "Mêlée", targets: { impaling: 5, unbreaking: 3, mending: 1 } },
    { id: "riptide", label: "Riptide (déplacement/pluie)", targets: { riptide: 3, impaling: 5, unbreaking: 3, mending: 1 } },
    { id: "throw", label: "Lancer (Loyalty)", targets: { loyalty: 3, impaling: 5, unbreaking: 3, mending: 1 } },
  ],
  mace: [
    { id: "general", label: "Combat général", targets: { density: 5, wind_burst: 3, unbreaking: 3, mending: 1 } },
    { id: "armor_break", label: "Anti-armure (Breach)", targets: { breach: 4, wind_burst: 3, unbreaking: 3, mending: 1 } },
  ],
  spear: [
    { id: "general", label: "Combat général", targets: { lunge: 3, sharpness: 5, unbreaking: 3, mending: 1 } },
  ],
  helmet: [
    { id: "general", label: "Survie générale", targets: { protection: 4, unbreaking: 3, mending: 1 } },
    { id: "underwater", label: "Sous l'eau / grottes noyées", targets: { respiration: 3, aqua_affinity: 1, protection: 4, unbreaking: 3, mending: 1 } },
  ],
  chestplate: [
    { id: "general", label: "Survie générale", targets: { protection: 4, unbreaking: 3, mending: 1 } },
    { id: "pvp", label: "PvP", targets: { protection: 4, thorns: 3, unbreaking: 3, mending: 1 } },
  ],
  leggings: [
    { id: "general", label: "Survie générale", targets: { protection: 4, unbreaking: 3, mending: 1 } },
    { id: "stealth", label: "Discrétion (Swift Sneak)", targets: { swift_sneak: 3, protection: 4, unbreaking: 3, mending: 1 } },
  ],
  boots: [
    { id: "general", label: "Survie générale", targets: { protection: 4, unbreaking: 3, mending: 1 } },
    { id: "fall", label: "Chutes", targets: { feather_falling: 4, protection: 4, unbreaking: 3, mending: 1 } },
    { id: "mobility_water", label: "Mobilité aquatique (Depth Strider)", targets: { depth_strider: 3, protection: 4, unbreaking: 3, mending: 1 } },
    { id: "mobility_ice", label: "Mobilité glaciale (Frost Walker)", targets: { frost_walker: 2, protection: 4, unbreaking: 3, mending: 1 } },
    { id: "nether", label: "Vitesse sur sable des âmes (Soul Speed)", targets: { soul_speed: 3, protection: 4, unbreaking: 3, mending: 1 } },
  ],
  shield: [
    { id: "general", label: "Survie générale", targets: { unbreaking: 3, mending: 1 } },
  ],
  fishing_rod: [
    { id: "loot", label: "Butin (trésors)", targets: { luck_of_the_sea: 3, unbreaking: 3, mending: 1 } },
    { id: "speed", label: "Pêche rapide", targets: { lure: 3, unbreaking: 3, mending: 1 } },
  ],
  elytra: [
    { id: "general", label: "Survie générale", targets: { unbreaking: 3, mending: 1 } },
  ],
};
