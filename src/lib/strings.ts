// All app UI copy (not item/enchantment names — those live in i18n.ts,
// pulled from the game's own language files). These are our own strings,
// so both languages are hand-written here rather than sourced from
// anywhere external.

import type { Locale } from "./i18n";
import type { EnchantingSlot } from "./tableOdds";

const UI = {
  heroTagline: {
    en: "Your item, what's already enchanted on it, and your goal — we tell you what to add, and what it'll cost at the anvil.",
    fr: "Ton objet, ce qui est déjà enchanté dessus, et ton objectif — on te dit quoi ajouter, et ce que ça va coûter à l'enclume.",
  },
  modeAdvisor: { en: "Advisor", fr: "Conseiller" },
  modeSearch: { en: "Enchantment Search", fr: "Recherche d'enchantement" },

  step1Item: { en: "Item", fr: "Objet" },
  step1Material: { en: "Material", fr: "Matériau" },
  step2CurrentEnchants: { en: "Enchantments already on the item", fr: "Enchantements déjà sur l'objet" },
  step3Goal: { en: "Goal", fr: "Objectif" },
  step4Recommendation: { en: "Recommendation", fr: "Recommandation" },
  step5AnvilCost: { en: "Anvil cost", fr: "Coût d'enclume" },

  treasureTag: { en: "(treasure)", fr: "(trésor)" },
  levelPrefix: { en: "Level", fr: "Niveau" },
  noneOption: { en: "—", fr: "—" },

  statusAdd: { en: "To add", fr: "À ajouter" },
  statusUpgrade: { en: "To upgrade", fr: "À améliorer" },
  statusOptimal: { en: "Already optimal", fr: "Déjà optimal" },
  statusConflict: { en: "Conflict", fr: "Conflit" },

  keptNoImpact: { en: "Kept, no impact on this goal:", fr: "Conservés sans impact sur cet objectif :" },

  anvilAssumption: {
    en: "Assuming each enchantment is applied via a separate, fresh book. The total doesn't depend on order — only how many prior operations the item has been through affects the penalty.",
    fr: "En supposant chaque enchantement appliqué via un livre neuf, séparément. Le total ne dépend pas de l'ordre — seul le nombre d'opérations précédentes sur l'objet compte pour la pénalité.",
  },
  anvilStep: { en: "Step", fr: "Étape" },
  anvilEnchantment: { en: "Enchantment", fr: "Enchantement" },
  anvilPenalty: { en: "Penalty", fr: "Pénalité" },
  anvilCost: { en: "Cost", fr: "Coût" },
  anvilTotal: { en: "Total", fr: "Total" },
  anvilXpTotalSuffix: { en: "XP levels total.", fr: "niveaux d'XP au total." },
  anvilBuildUpNote: {
    en: "If you can't get this level directly: building it up from Level 1 books via repeated same-level combines costs an extra",
    fr: "Si tu n'as pas ce niveau directement : le construire à partir de livres niveau 1 en combinant des paires de même niveau coûte",
  },
  anvilBuildUpBooksSuffix: {
    en: "Level 1 books needed.",
    fr: "livres niveau 1 nécessaires.",
  },
  anvilTooExpensive: {
    en: '⚠ At least one step exceeds 39 levels — the anvil will refuse the operation ("Too Expensive!") in Survival/Adventure. Drop a lower-priority goal, or finish this combo in Creative mode.',
    fr: "⚠ Au moins une étape dépasse 39 niveaux — l'enclume refusera l'opération (\"Too Expensive!\") en survie/aventure. Retire un objectif de moindre priorité, ou termine ce combo en mode créatif.",
  },

  searchEnchantmentLabel: { en: "Enchantment to search for", fr: "Enchantement recherché" },
  searchLevelLabel: { en: "Target level", fr: "Niveau visé" },
  searchItemLabel: { en: "Item", fr: "Objet" },
  searchBookshelvesLabel: { en: "Bookshelves around your table", fr: "Étagères autour de ta table" },
  searchBookshelvesNote: {
    en: "Only the first 15 count. Your table re-rolls what each of the 3 slots shows every time you touch your inventory — this simulates that randomness instead of assuming a fixed table level.",
    fr: "Seules les 15 premières comptent. Ta table retire au hasard ce que chacun des 3 emplacements affiche à chaque fois que tu touches ton inventaire — ceci simule ce hasard plutôt que de supposer un niveau de table fixe.",
  },
  slotTop: { en: "Top slot", fr: "Emplacement du haut" },
  slotMiddle: { en: "Middle slot", fr: "Emplacement du milieu" },
  slotBottom: { en: "Bottom slot", fr: "Emplacement du bas" },
  searchBookNote: {
    en: "A book gets the same roll as an item, but if more than one enchantment comes up, one is discarded at random — books have lower odds of stacking extras than the item they'll end up transferred onto.",
    fr: "Un livre suit le même tirage qu'un objet, mais si plusieurs enchantements sortent, l'un d'eux est retiré au hasard — un livre a moins de chances de cumuler des extras que l'objet sur lequel il sera transféré.",
  },
  enchantedBook: { en: "Enchanted Book", fr: "Livre enchanté" },
  searchLuckOfSeaLabel: { en: "Luck of the Sea (fishing)", fr: "Luck of the Sea (pêche)" },
  searchCalculating: { en: "Calculating…", fr: "Calcul en cours…" },
  searchCalculate: { en: "✦ Calculate", fr: "✦ Calculer" },
  searchTreasureOnlyNote: {
    en: "can never come from the enchanting table — it's a treasure enchantment. No item, material, or level changes that.",
    fr: "ne peut jamais sortir de la table d'enchantement — c'est un enchantement trésor. Aucun objet, matériau ou niveau n'y change quoi que ce soit.",
  },
  searchBestCombosPrefix: { en: "Best combinations —", fr: "Meilleures combinaisons —" },
  searchMonteCarloNoteItem: {
    en: "Monte-Carlo simulation of the game's real algorithm (not a closed-form formula) — see src/lib/tableOdds.ts. These odds are for enchanting the item directly, not a book.",
    fr: "Simulation Monte-Carlo de l'algorithme réel du jeu (pas une formule fermée) — voir src/lib/tableOdds.ts. Ces probabilités concernent l'objet enchanté directement, pas un livre.",
  },
  searchMonteCarloNoteBook: {
    en: "Monte-Carlo simulation of the game's real algorithm, including the book-specific rule that drops one enchantment if more than one comes up — see src/lib/tableOdds.ts.",
    fr: "Simulation Monte-Carlo de l'algorithme réel du jeu, incluant la règle propre aux livres qui retire un enchantement si plusieurs sortent — voir src/lib/tableOdds.ts.",
  },
  searchSourcesHeader: { en: "Sources and odds", fr: "Sources et probabilités" },

  sourceFishing: { en: "Fishing", fr: "Pêche" },
  sourceTrading: { en: "Trading (librarian)", fr: "Commerce (bibliothécaire)" },
  sourceStructureOnly: { en: "Structure loot only", fr: "Butin de structure uniquement" },

  rarityCommon: { en: "Common", fr: "Commun" },
  rarityUncommon: { en: "Uncommon", fr: "Peu commun" },
  rarityRare: { en: "Rare", fr: "Rare" },
  rarityEpic: { en: "Epic", fr: "Épique" },

  footerVersionPrefix: { en: "Based on Minecraft Java", fr: "Basé sur Minecraft Java" },
  footerVersionSuffix: {
    en: "— data verified on",
    fr: "— données vérifiées le",
  },
  footerVersionNote: {
    en: "Enchantments occasionally change between versions; report anything that looks off.",
    fr: "Les enchantements changent parfois d'une version à l'autre ; signale un écart si tu en vois un.",
  },
  shareCopyLink: { en: "🔗 Copy link", fr: "🔗 Copier le lien" },
  shareCopied: { en: "✓ Link copied!", fr: "✓ Lien copié !" },

  footerReportLink: { en: "🐙 Report a bug / suggest an improvement", fr: "🐙 Signaler un bug / suggérer une amélioration" },
  footerRights: {
    en: "— source visible for transparency, all rights reserved.",
    fr: "— code source visible à titre informatif, tous droits réservés.",
  },
} satisfies Record<string, Record<Locale, string>>;

export type UiKey = keyof typeof UI;

export function t(key: UiKey, locale: Locale): string {
  return UI[key][locale];
}

export function blockedByNote(blockerName: string, locale: Locale): string {
  return locale === "en"
    ? `Blocked by ${blockerName} already on the item`
    : `Bloqué par ${blockerName} déjà sur l'objet`;
}

const SLOT_KEY: Record<EnchantingSlot, UiKey> = { top: "slotTop", middle: "slotMiddle", bottom: "slotBottom" };

export function slotLabel(slot: EnchantingSlot, locale: Locale): string {
  return t(SLOT_KEY[slot], locale);
}

export function levelTargetNote(currentLevel: number, targetLevel: number, locale: Locale): string {
  const arrow =
    currentLevel > 0 ? (locale === "en" ? `Level ${currentLevel} → ` : `Niveau ${currentLevel} → `) : "";
  return locale === "en" ? `${arrow}Level ${targetLevel} target` : `${arrow}Niveau ${targetLevel} visé`;
}
