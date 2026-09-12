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

## Goal taxonomy (approved, then corrected during implementation)

Approved as drafted, then fixed against `src/lib/goals.ts` (now the source
of truth — see the file header there for the full rationale):

- **Fixed:** boots' "Discrétion" was wrongly attached to Soul Speed (which
  is a movement-speed enchant, not stealth). Swift Sneak — the actual
  stealth enchant — lives on **leggings**, not boots. Boots' Soul Speed goal
  is now correctly labeled "Vitesse sur sable des âmes".
- **Split:** boots' "Mobilité" became two goals (Depth Strider vs Frost
  Walker) since they're mutually exclusive — bundling them made no sense.
- **Added:** Shovel, Hoe, Mace, and Spear (the last two didn't exist in the
  first draft's scope). Spear/Lunge were added to the game in 1.21.11
  (Sept 2026), after this assistant's training cutoff — see the
  `enchantments.ts` header for what's verified vs. best-guess there.
- **Axe woodcutting excludes Fortune** even though the game allows it —
  wood always drops 1:1, so it does nothing for that goal.

See `src/lib/goals.ts` for the live table.

## Anvil rules reference

- Prior-work penalty formula, combine costs, and the enchant conflict table
  are fixed game data — see the [Minecraft Wiki: Anvil mechanics](https://minecraft.wiki/w/Anvil#Costs_for_combining_items)
  and [Enchanting mechanics](https://minecraft.wiki/w/Enchanting_mechanics)
  pages as the source of truth when implementing — don't hand-derive from
  memory, verify against the wiki tables.

## Not yet decided

- Whether to persist anything (accounts, saved builds) or keep it fully
  stateless/client-side — currently fully stateless, no backend
- Name (this is a placeholder working title)
- The anvil calculator only models "each enchant via one fresh book" — it
  doesn't yet handle pre-combining two lower-level books to reach a higher
  level before touching the final item, which is where combine *order*
  actually starts to matter (see `src/lib/anvil.ts` header)
- Deployment (not yet live anywhere — runs locally via `npm run dev`)

## Status

**MVP built and working**, two modes:

1. **Conseiller** — item picker → current-enchants input → goal picker →
   recommendation + anvil cost, covering all 16 item categories.
2. **Recherche d'enchantement** — pick a target enchantment + level; for
   non-treasure enchants, Monte-Carlo simulation of the real enchanting-table
   algorithm sweeps every material × level 1-30 to find the best odds
   (`src/lib/tableOdds.ts`); for treasure enchants (Mending, Frost Walker,
   the curses), it correctly reports the table can never produce them and
   instead computes fishing and villager-trading odds
   (`src/lib/treasure.ts`) — Soul Speed, Swift Sneak, Riptide, and
   Channeling are flagged as structure-loot-only since neither fishing nor
   trading can produce them.

**Data was re-verified mid-project against the actual generated game data**
(github.com/misode/mcmeta) after a wiki-summary fetch turned out to have
fabricated an enchantment ("Cleaving") that doesn't exist in the real game
registry — a good example of why `src/lib/*.ts` headers cite raw JSON
sources over wiki prose wherever the raw data was reachable. Also discovered
mid-project, confirmed against the same raw data rather than dismissed:
Copper tools/armor and the Spear weapon (with its Lunge enchantment) both
exist in the current game, past this assistant's Jan 2026 training cutoff.

`npm run build` and `npm run lint` both pass clean.

Repo: https://github.com/ALevesqueDev/enchant-advisor (public, all rights
reserved — see LICENSE) · Live: https://enchant-advisor.vercel.app
(auto-deploys from `main`; `dev` gets its own preview URL per push)

## Version pinning

**All game data is tied to a specific Minecraft version and WILL drift.**
Mojang also switched from the old `1.21.x` naming to a `year.release` scheme
(`26.x`) at some point after this assistant's Jan 2026 cutoff — the app is
currently pinned to **26.2** (confirmed stable via Mojang's own version
manifest on 2026-09-11; see `src/lib/game-version.json`, shown in the footer).

**Automated now**: `scripts/check-game-version.mjs` re-fetches Mojang's
version manifest plus the enchantment data from `misode/mcmeta`, diffs it
against `src/lib/enchantment-data.json`, and prints a report (exit code 1 if
anything needs attention). A weekly GitHub Action
(`.github/workflows/check-game-version.yml`) runs it and opens/updates a
`game-version-drift`-labeled issue when there's something to review — it
never edits code itself, since new content (a new item category, a goal
worth adding) needs a human call, not just number-patching. Run it manually
with `npm run check-version`.

**The first real run already earned its keep** — before this script existed,
three actual data errors had crept into the app itself (not just drift from
a new version): `wind_burst`'s anvil cost was mistyped (2 instead of 4), and
`riptide`/`channeling` were wrongly marked treasure-only while `wind_burst`
was wrongly marked *not* treasure-only — all three sourced from an earlier
wiki-summary fetch rather than the raw `non_treasure` tag data. Fixed by
cross-checking the tag directly; see `src/lib/treasure.ts`'s comments.

To bump the pin by hand: update `src/lib/game-version.json`, then run
`npm run check-version` against the new version and apply what it reports to
`enchantment-data.json` / `enchantments.ts` / `materials.ts`.

## Localization

Item and enchantment names are the REAL names Minecraft itself uses in each
language — extracted from the game's own `en_us.json`/`fr_fr.json` at our
pinned version (`src/lib/enchantment-names.json`, `src/lib/item-names.json`),
not a machine translation. A locale toggle (`src/app/LocaleContext.tsx`,
persisted to localStorage) switches every item/enchantment name shown, AND
every UI string (`src/lib/strings.ts` — our own copy, hand-written in both
languages since none of it is official game text). Re-extract the two name
files whenever `game-version.json` bumps, same source, tag `<version>-assets`.

The "category" concept (e.g. "pickaxe" without a material) isn't a real
Minecraft concept — every real name is material-specific. The advisor's item
picker (step 1) now has an explicit material selector next to the category
grid, defaulting to Diamond; the selected category's own button reflects
whatever material is chosen (e.g. "Iron Pickaxe" once picked), while the
other 15 buttons keep showing their Diamond-tier name as a neutral preview.
Search mode's ranked results already showed the item's actual matched
material per row.

**Rule going forward, learned from a real bug**: never bake rendered,
locale-dependent text into `useState`. `treasureOdds()` used to build its
`note` strings at calculate-time using whatever locale was active then —
switch the language toggle afterward without recalculating, and the old
language's text stayed on screen. Fixed by having that function return
plain numbers only, with a separate `treasureSourceNote()` that renders
against the CURRENT locale at render time, called directly from JSX. Every
other computed result in the app (recommendations, anvil plans, table/book
odds) was already numbers-only for unrelated reasons and didn't have this
bug — this is now the pattern to keep following.

**The material choice is display-only in the advisor** — `recommend()` and
`planAnvilCombines()` don't take material as an input at all, since neither
the enchantment recommendation nor the anvil XP cost actually depends on
what the tool/armor is made of in this game (only the enchanting *table*
does, via enchantability — that's what `materialsFor`/`enchantability` in
`materials.ts` already feed into search mode's Monte-Carlo sweep). If a
future feature needs material to affect the advisor's own output, this is
the seam to extend, not a new one.

## Roadmap

Roughly in order — later items depend on earlier ones less than they depend
on which of these you actually want first.

1. ~~Data-freshness check script~~ — done, see Version pinning above.
2. ~~Bilingual item/enchantment names~~ — done, see Localization above.
3. ~~Full UI localization~~ — done, see Localization above (`src/lib/strings.ts`).
4. ~~Advisor material/tier selector~~ — done: step 1 now has an explicit
   material picker instead of silently assuming Diamond.
5. ~~Book-enchanting mode~~ — done: search mode has an "item vs book"
   toggle. A book uses the full non-treasure pool (not category-restricted,
   see `nonTreasurePool()`), fixed enchantability 1, and the "-1
   enchantment if more than one comes up" rule (`isBook` in
   `tableOdds.ts::simulateRoll`) — confirmed against multiple independent
   sources, not just the original wiki fetch, given this session's earlier
   wiki-fabrication incident. Fishing's book-slot roll in `treasure.ts` was
   missing this same rule before it was added here — fixed alongside it.
   The anvil calculator didn't need changes: it already assumed "each
   enchantment arrives via a fresh book," which is the book's own eventual
   fate regardless of how it got that enchantment.
6. ~~Full anvil optimizer~~ — done, with a deliberate scope line:
   `planBuildUp()` in `anvil.ts` prices leveling an enchantment up from
   scratch via repeated equal-level merges (combining two copies at the
   SAME level bumps the result by exactly one level — verified against
   multiple sources this time, not just one wiki fetch). Shown as a
   supplementary note per anvil-plan row where the target level is above 1.
   **Not done**: this is intentionally decoupled from the main sequential
   plan rather than fully interleaved — modeling "level up enchant A while
   also touching the item for enchants B and C in some interleaved order"
   is a much bigger combinatorial problem, and the linear build-up chain
   already provably costs the same as the more obvious-looking balanced
   binary tree (see the proof in `anvil.ts`), so there was no cheaper
   structure being left on the table by skipping that interleaving.
7. ~~Shareable builds~~ — done: `src/lib/shareLink.ts` encodes the whole
   selection (mode, locale, and either the advisor's item/material/goal/
   current-enchants or search mode's enchant/level/item/Luck-of-the-Sea)
   into short query-string keys (`m`, `l`, `it`, `mt`, `g`, `h`, `e`, `lv`,
   `c`, `lk`), kept in sync live via `history.replaceState()` (no
   navigation, no reload, no history spam per keystroke) so the address bar
   is always a paste-able link — plus an explicit "Copy link" button next to
   the locale toggle for anyone who'd rather not trust that. On load, the
   URL is read once and every field is validated against real categories/
   materials/goals/enchantment ids before being applied; anything missing
   or stale just falls back to the normal defaults instead of crashing.
8. ~~Bookshelf-count helper~~ — done: search mode's table/book odds used
   to sweep an abstract "displayed level 1-30", which isn't something a
   player can actually type in at a real table — only a bookshelf count
   (0-15) and then one of 3 slots are ever in their control. Replaced that
   sweep with the real bookshelf → per-slot-level formula
   (`slotLevelRange`/`rollSlotLevel` in `tableOdds.ts`), verified against
   minecraft.wiki/w/Enchanting_mechanics on 2026-09-12 — though only the
   *formula itself*, not the page's own prose summary of it, which
   contradicted its own formula on bookshelf-count ranges (same
   don't-trust-the-paraphrase lesson as the Cleaving/wind_burst incidents
   above). Cross-checked by simulating it directly: 15 bookshelves
   deterministically gives a level-30 bottom slot, matching the game's
   best-known fact about full bookshelf rooms. Results are now reported as
   "material × slot" (top/middle/bottom) instead of "material × level",
   each with the real achievable level range shown alongside for context.
9. **Mobile QA pass** — one real click-blocking bug already surfaced
   (`.glint::after` missing `pointer-events: none`) from the visual
   redesign; worth a dedicated pass across both modes on a real phone.
10. ~~PWA support~~ — done: `src/app/manifest.ts` (Next's file convention,
    auto-served at `/manifest.webmanifest` and auto-linked, no manual
    `<link>` needed) plus `public/sw.js`, a stale-while-revalidate service
    worker registered client-side by `ServiceWorkerRegister.tsx`. Since the
    whole app is static with no backend (see "Not yet decided" above),
    caching everything means genuine offline use after the first visit,
    not just satisfying the install checkbox. `layout.tsx` adds the
    `appleWebApp`/`viewport.themeColor` metadata iOS needs for a proper
    standalone "Add to Home Screen" (iOS ignores the web manifest
    entirely). App icons (`icon.png`, `apple-icon.png`, and the
    manifest's `icon-192`/`icon-512` in `public/`) are a small sparkle
    glyph in the app's own accent gradient, generated as raw PNGs by a
    scratch Node script (no image-editing tool was available in this
    environment) rather than left as Next's default logo.
11. ~~Public repo + license~~ — done: the repo is public, all rights
    reserved (see LICENSE), and the footer's GitHub Issues link works.
