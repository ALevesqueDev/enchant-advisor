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

Repo: https://github.com/ALevesqueDev/enchant-advisor (private) · Live:
https://enchant-advisor.vercel.app (auto-deploys from `main`; `dev` gets its
own preview URL per push)

## Version pinning

**All game data is tied to a specific Minecraft version and WILL drift.**
Mojang also switched from the old `1.21.x` naming to a `year.release` scheme
(`26.x`) at some point after this assistant's Jan 2026 cutoff — the app is
currently pinned to **26.2** (confirmed stable via Mojang's own version
manifest on 2026-09-11; see `src/lib/gameVersion.ts`, shown in the footer).

To bump it: update `GAME_VERSION`/`DATA_VERIFIED_DATE` in `gameVersion.ts`,
then re-verify `enchantments.ts`, `materials.ts`, and the anvil cost table
against `github.com/misode/mcmeta` at the new version's `<version>-data` /
`<version>-summary` tags (not the rolling `data`/`summary` branches, which
track the latest snapshot — that's what caused the version confusion this
pass). A small script that diffs our hardcoded values against a freshly
fetched version would catch drift automatically — see Roadmap.

## Roadmap

Roughly in order — later items depend on earlier ones less than they depend
on which of these you actually want first.

1. **Data-freshness check script** — a script that re-fetches
   `enchantments.ts`'s numbers from misode/mcmeta and diffs against what's
   hardcoded, so a new Minecraft version doesn't silently go stale. Cheap,
   high value given the version-pinning issue above.
2. **Book-enchanting mode** — both the anvil calculator and the table-odds
   simulator currently model enchanting the item directly. Enchanting a
   book first (then anvil-transferring it) is a very common real strategy
   and has slightly different rules (the "-1 enchantment" quirk for books —
   see `tableOdds.ts`).
3. **Full anvil optimizer** — model pre-combining two low-level books into
   a higher-level one before it ever touches the final item, which is where
   combine *order* actually starts to affect total cost (today's calculator
   correctly says order doesn't matter, but only because it doesn't model
   this cheaper path).
4. **Shareable builds** — serialize the current item/enchants/goal (or
   search) selection into the URL query string so a link can be shared
   without needing any backend/accounts.
5. **Bookshelf-count helper** — let the user pick "0-15 bookshelves"
   instead of typing the displayed level directly, matching what they
   actually see at their own table.
6. **Mobile QA pass** — one real click-blocking bug already surfaced
   (`.glint::after` missing `pointer-events: none`) from the visual
   redesign; worth a dedicated pass across both modes on a real phone.
7. **PWA support** — add a manifest + service worker so it can be
   "installed" to a phone home screen. Purely cosmetic (it's still a web
   app under the hood) but closes the "is this an app?" question for good.
8. **Public repo + license**, if bug reports from outside testers matter —
   right now the GitHub issues link in the footer 404s for anyone who
   isn't a collaborator on the private repo.
