// All app UI copy (not item/enchantment names — those live in i18n.ts,
// pulled from the game's own language files). These are our own strings,
// so both languages are hand-written here rather than sourced from
// anywhere external.

import type { Locale } from "./i18n";
import type { EnchantingSlot, BookshelfCurvePoint } from "./tableOdds";
import type { MethodKind } from "./bestMethod";

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

  shoppingListHeader: { en: "📋 Everything you'll need", fr: "📋 Tout ce qu'il te faut" },
  shoppingListBooksLabel: { en: "Level 1 books to prepare", fr: "Livres niveau 1 à préparer" },
  shoppingListXpLabel: { en: "XP levels, start to finish", fr: "Niveaux d'XP, du début à la fin" },
  shoppingListNote: {
    en: "Includes building up any enchantment you can't get directly at its target level (see the notes above), not just the main combine sequence.",
    fr: "Inclut la construction de tout enchantement qu'on ne peut pas obtenir directement à son niveau visé (voir les notes ci-dessus), pas juste la séquence de combinaison principale.",
  },

  advisorAcquisitionButton: { en: "✦ How do I get these?", fr: "✦ Comment obtenir ça?" },
  advisorAcquisitionCalculating: { en: "Calculating…", fr: "Calcul en cours…" },
  advisorAcquisitionBestWay: { en: "Best way to get it:", fr: "Meilleure façon de l'obtenir :" },
  advisorAcquisitionNote: {
    en: "Assumes 15 bookshelves and no Luck of the Sea — switch to Enchantment Search for a specific setup.",
    fr: "Suppose 15 étagères et pas de Luck of the Sea — passe par Recherche d'enchantement pour ta configuration précise.",
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
  searchIncompatibleWith: { en: "Incompatible with:", fr: "Incompatible avec :" },

  sourceFishing: { en: "Fishing", fr: "Pêche" },
  sourceTrading: { en: "Trading (librarian)", fr: "Commerce (bibliothécaire)" },
  sourceStructureOnly: { en: "Structure loot only", fr: "Butin de structure uniquement" },

  searchBookshelfCurveHeader: { en: "Is it worth more bookshelves?", fr: "Ça vaut la peine, plus d'étagères?" },
  searchBookshelfCurveNote: {
    en: "Best odds at each bookshelf count (0-15), not just the one you picked above — so you can see whether adding more is actually worth it.",
    fr: "Meilleures chances pour chaque nombre d'étagères (0 à 15), pas juste celui choisi plus haut — pour voir si en ajouter change vraiment quelque chose.",
  },
  searchBookshelfCurveAxis: { en: "bookshelves", fr: "étagères" },

  searchBestMethodHeader: { en: "Best method", fr: "Meilleure méthode" },
  searchBestMethodCaveat: {
    en: "Ranked by odds per attempt — but an attempt doesn't cost the same everywhere: a table roll spends XP levels and consumes the item/book, a trading reroll costs a lectern plus emeralds, a fishing cast only costs time. Weigh that against the numbers below.",
    fr: "Classé par probabilité par tentative — mais une tentative ne coûte pas la même chose partout : un lancer de table coûte des niveaux d'XP et consomme l'objet/livre, un reroll de commerce coûte un lutrin et des émeraudes, un lancer de pêche ne coûte que du temps. À pondérer avec les chiffres ci-dessous.",
  },
  methodTableItem: { en: "Table (on the item)", fr: "Table (sur l'objet)" },
  methodTableBook: { en: "Table (book)", fr: "Table (livre)" },
  neverAtThisLevel: { en: "essentially never at this level", fr: "quasiment jamais à ce niveau" },

  compareToggleLabel: { en: "Compare with another enchantment", fr: "Comparer avec un autre enchantement" },
  compareEnchantLabel: { en: "Enchantment B", fr: "Enchantement B" },
  compareButton: { en: "✦ Compare", fr: "✦ Comparer" },
  compareSameSetupNote: {
    en: "Same bookshelf count and Luck of the Sea as above — only the enchantment, level, and item change.",
    fr: "Même nombre d'étagères et même Luck of the Sea que ci-dessus — seuls l'enchantement, le niveau et l'objet changent.",
  },

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
  shareCopyLinkHint: {
    en: "Keeps your current selection — paste it anywhere to share exactly this.",
    fr: "Garde ta sélection actuelle — colle-le n'importe où pour partager exactement ça.",
  },

  notFoundTitle: { en: "Page not found", fr: "Page introuvable" },
  notFoundBody: {
    en: "There's nothing at this address. The app itself lives at a single page — you probably want that one.",
    fr: "Il n'y a rien à cette adresse. L'app tient sur une seule page — c'est probablement celle-là que tu cherches.",
  },
  notFoundBackHome: { en: "← Back to Enchant Advisor", fr: "← Retour à Enchant Advisor" },

  footerReportLink: { en: "🐙 Report a bug / suggest an improvement", fr: "🐙 Signaler un bug / suggérer une amélioration" },
  opensInNewTab: { en: "(opens in a new tab)", fr: "(ouvre un nouvel onglet)" },
  offlineBanner: {
    en: "📡 You're offline — showing the cached version. Some numbers may be out of date until you're back online.",
    fr: "📡 Tu es hors-ligne — version enregistrée affichée. Certains chiffres peuvent dater jusqu'à ta reconnexion.",
  },
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

const METHOD_KEY: Record<MethodKind, UiKey> = {
  table_item: "methodTableItem",
  table_book: "methodTableBook",
  trading: "sourceTrading",
  fishing: "sourceFishing",
};

export function methodLabel(kind: MethodKind, locale: Locale): string {
  return t(METHOD_KEY[kind], locale);
}

const STATUS_KEY: Record<string, UiKey> = {
  add: "statusAdd",
  upgrade: "statusUpgrade",
  "already-optimal": "statusOptimal",
  conflict: "statusConflict",
};

/** Locale text for a recommendation's status (see recommend.ts's Recommendation["status"]). */
export function statusLabel(status: string, locale: Locale): string {
  return t(STATUS_KEY[status] ?? "statusOptimal", locale);
}

/** "≈4 attempts on average" / "essentially never at this level" for an Infinity (zero-probability) case. */
export function expectedAttemptsNote(expectedAttempts: number, locale: Locale): string {
  if (!Number.isFinite(expectedAttempts)) return t("neverAtThisLevel", locale);
  const rounded =
    expectedAttempts < 10
      ? expectedAttempts.toFixed(1)
      : Math.round(expectedAttempts).toLocaleString(locale === "en" ? "en-US" : "fr-FR");
  return locale === "en" ? `≈${rounded} attempts on average` : `≈${rounded} essais en moyenne`;
}

/** "Best odds: 62% at 15 bookshelves (vs 8% at 0)." — the one-sentence takeaway from the bookshelf curve, for anyone who won't stop to read the chart itself. */
export function bookshelfCurveSummary(points: BookshelfCurvePoint[], locale: Locale): string {
  const best = points.reduce((a, b) => (b.probability > a.probability ? b : a));
  const worst = points.reduce((a, b) => (b.probability < a.probability ? b : a));
  const bestPct = (best.probability * 100).toFixed(1);
  const worstPct = (worst.probability * 100).toFixed(1);
  return locale === "en"
    ? `Best odds: ${bestPct}% at ${best.bookshelves} bookshelves (vs ${worstPct}% at ${worst.bookshelves}).`
    : `Meilleures chances : ${bestPct}% à ${best.bookshelves} étagères (contre ${worstPct}% à ${worst.bookshelves}).`;
}

/** "Percussion has better odds per attempt (12.3% vs 4.1%)." — the one-line verdict under a side-by-side enchantment comparison. */
export function compareVerdict(nameA: string, probA: number, nameB: string, probB: number, locale: Locale): string {
  if (Math.abs(probA - probB) < 0.001) {
    return locale === "en" ? "Roughly the same odds either way." : "À peu près les mêmes chances des deux côtés.";
  }
  const winnerName = probA > probB ? nameA : nameB;
  const winnerPct = (Math.max(probA, probB) * 100).toFixed(1);
  const loserPct = (Math.min(probA, probB) * 100).toFixed(1);
  return locale === "en"
    ? `${winnerName} has better odds per attempt (${winnerPct}% vs ${loserPct}%).`
    : `${winnerName} a de meilleures chances par tentative (${winnerPct} % vs ${loserPct} %).`;
}

export function levelTargetNote(currentLevel: number, targetLevel: number, locale: Locale): string {
  const arrow =
    currentLevel > 0 ? (locale === "en" ? `Level ${currentLevel} → ` : `Niveau ${currentLevel} → `) : "";
  return locale === "en" ? `${arrow}Level ${targetLevel} target` : `${arrow}Niveau ${targetLevel} visé`;
}
