# Enchant Advisor — project notes

**Decided:** Minecraft Java Edition only · web app · advisor + anvil
combine-order/cost calculator.

## What it does

1. User picks an **item** (pickaxe, axe, sword, bow, crossbow, trident,
   armor piece, shield, fishing rod, elytra) and its **material tier** where
   relevant (tier mostly matters for durability/enchant slots, not for which
   enchants apply — same enchant pool for wood through netherite).
2. User enters **enchantments already on the item** (name + level).
3. User picks a **goal** from that item's goal taxonomy (below).
4. The advisor recommends the enchantment delta to add, respecting:
   - mutual-exclusivity groups (e.g. Fortune vs Silk Touch, Sharpness vs
     Smite vs Bane of Arthropods, Riptide vs Loyalty/Channeling, Multishot
     vs Piercing, Infinity vs Mending)
   - per-enchant max level
   - treasure-only enchants flagged (Mending, Frost Walker, Curse of
     Binding, Curse of Vanishing, Soul Speed, Swift Sneak — not available
     from the enchant table, only loot/trading/fishing, or the "Curses" via
     table+bonus)
   - what's already maxed vs still worth adding
5. Once the target set is confirmed, the **anvil calculator** gives the
   cheapest combine order and total XP levels, applying:
   - prior-work penalty (doubles: 0→1→2→4→8→... per item, resets never)
   - combine cost = sum of book/item level costs + penalties
   - the 39-level "Too Expensive!" survival cap (creative has none)

## Goal taxonomy (draft — first pass from Java wiki knowledge, not yet reviewed)

| Item | Goals |
|---|---|
| Pickaxe | Mining (ressources/vitesse), Silk Touch (déco/verre/glace) |
| Axe | Bûcheronnage, Combat (les haches sont une arme viable en Java) |
| Sword | PvP, Farm de mobs (Looting), Zone/foule (Sweeping Edge) |
| Bow | PvP, Farm de mobs (Infinity+Power vs consommation de flèches) |
| Crossbow | PvP (Piercing), Volée de feu d'artifice (Multishot+Quick Charge) |
| Trident | Mêlée, Riptide (déplacement/pluie), Loyalty (lancer) — Riptide et Loyalty/Channeling s'excluent |
| Helmet | Survie générale, Sous l'eau (Respiration/Aqua Affinity), Mineur (pas de casque spécifique mais Respiration utile en grotte noyée) |
| Chestplate | Survie générale, PvP |
| Leggings | Survie générale, PvP |
| Boots | Survie générale, Chute (Feather Falling), Mobilité (Depth Strider vs Frost Walker — s'excluent), Discrétion (Soul Speed sur âme sable) |
| Shield | Survie générale (Unbreaking/Mending only — pas grand-chose d'autre) |
| Fishing Rod | Pêche efficace (Lure), Butin (Luck of the Sea) |
| Elytra | Survie générale (Unbreaking/Mending) |

Needs a real pass to confirm this matches actual player mental models before
coding it — this is my first draft, not verified against user needs.

## Anvil rules reference

- Prior-work penalty formula, combine costs, and the enchant conflict table
  are fixed game data — see the [Minecraft Wiki: Anvil mechanics](https://minecraft.wiki/w/Anvil#Costs_for_combining_items)
  and [Enchanting mechanics](https://minecraft.wiki/w/Enchanting_mechanics)
  pages as the source of truth when implementing — don't hand-derive from
  memory, verify against the wiki tables.

## Not yet decided

- Tech stack (nothing scaffolded yet)
- Exact UI flow (item picker → enchant picker → goal picker → result, or
  fewer/more steps)
- Whether to persist anything (accounts, saved builds) or keep it fully
  stateless/client-side
- Name (this is a placeholder working title)

## Status

Idea captured, competitive research done (see README.md), goal taxonomy
drafted. **Nothing built.** Next step is your call — see chat.
