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
persisted to localStorage) switches every item/enchantment name shown; the
app's own UI chrome (buttons, section headers, goal descriptions) stays
French-only for now — that's a deliberate scope line, not an oversight, since
those aren't official game strings and translating them well is a separate
piece of work. Re-extract both name files whenever `game-version.json` bumps,
same source, tag `<version>-assets`.

The "category" concept (e.g. "pickaxe" without a material) isn't a real
Minecraft concept — every real name is material-specific. Where a
material-agnostic label is needed (the advisor's item picker), Diamond
stands in as the representative tier ("Diamond Pickaxe" / "Pioche en
diamant"); the search mode's ranked results show the item's actual matched
material instead.

## Roadmap

Roughly in order — later items depend on earlier ones less than they depend
on which of these you actually want first.

1. ~~Data-freshness check script~~ — done, see Version pinning above.
2. ~~Bilingual item/enchantment names~~ — done, see Localization above.
3. **Full UI localization** — the app's own copy (buttons, section headers,
   goal names) is still French-only regardless of the name-locale toggle;
   worth doing once the phrasing has settled, so it isn't re-translated
   every time UI text changes.
4. **Book-enchanting mode** — both the anvil calculator and the table-odds
   simulator currently model enchanting the item directly. Enchanting a
   book first (then anvil-transferring it) is a very common real strategy
   and has slightly different rules (the "-1 enchantment" quirk for books —
   see `tableOdds.ts`).
5. **Full anvil optimizer** — model pre-combining two low-level books into
   a higher-level one before it ever touches the final item, which is where
   combine *order* actually starts to affect total cost (today's calculator
   correctly says order doesn't matter, but only because it doesn't model
   this cheaper path).
6. **Shareable builds** — serialize the current item/enchants/goal (or
   search) selection into the URL query string so a link can be shared
   without needing any backend/accounts.
7. **Bookshelf-count helper** — let the user pick "0-15 bookshelves"
   instead of typing the displayed level directly, matching what they
   actually see at their own table.
8. **Mobile QA pass** — one real click-blocking bug already surfaced
   (`.glint::after` missing `pointer-events: none`) from the visual
   redesign; worth a dedicated pass across both modes on a real phone.
9. **PWA support** — add a manifest + service worker so it can be
   "installed" to a phone home screen. Purely cosmetic (it's still a web
   app under the hood) but closes the "is this an app?" question for good.
10. ~~Public repo + license~~ — done: the repo is public, all rights
    reserved (see LICENSE), and the footer's GitHub Issues link works.
