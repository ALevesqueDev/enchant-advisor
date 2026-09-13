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

## Status

**MVP built and working**, two modes:

1. **Conseiller** — item picker → current-enchants input → goal picker →
   recommendation + anvil cost, covering all 16 item categories.
2. **Recherche d'enchantement** — pick a target enchantment + level; for
   non-treasure enchants, Monte-Carlo simulation of the real enchanting-table
   algorithm sweeps every material × table slot (bookshelf-aware, see item 8
   below) to find the best odds (`src/lib/tableOdds.ts`); for treasure
   enchants (Mending, Frost Walker, the curses), it correctly reports the
   table can never produce them and instead computes fishing and
   villager-trading odds (`src/lib/treasure.ts`) — only Soul Speed, Swift
   Sneak, and Wind Burst are flagged as structure-loot-only (neither fishing
   nor trading can produce them); Riptide and Channeling look
   treasure-flavored but are actually tradeable/fishable, see `treasure.ts`'s
   header for why that was a real bug once, not just a naming quirk.

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

With the original roadmap complete, the next batch is deliberately scoped
to **reliability and UX polish only** — no new user-facing features, and
nothing that adds real weight to the shipped bundle (a test runner is
dev-only; everything else is a few lines of markup or a native browser
API). Explicitly rejected for this batch as scope/weight creep: a
manual dark-mode toggle, PDF/image export of a build, and any
analytics/telemetry (conflicts with the app's stateless/no-backend/
no-accounts design).

12. **Crash safety net** — a React error boundary around the app so a
    render-time exception (e.g. a corrupted/hand-edited share link that
    slips past validation) shows a friendly "something broke, reload"
    message instead of a blank white screen, plus a `<noscript>` fallback
    for the (rare, since this is a fully client-rendered app) case of JS
    failing to load at all.
13. ~~Lightweight test suite (Vitest) for the pure logic~~ — done: 31 tests
    (at the time — check `npm run test`'s own output for the current
    count rather than any number written here, since it'll drift again;
    36 once `bestMethod.test.ts` landed with item 21 below) across
    `recommend.test.ts`, `anvil.test.ts` (including the build-up
    cost formula against the confirmed-live numbers from the anvil
    optimizer's roadmap entry, and the order-invariance claim itself),
    `tableOdds.test.ts` (the bookshelf formula's deterministic level
    ranges), and `shareLink.test.ts` (encode/decode round-trips,
    malformed-input handling, SSR-safety of `patchShareParams`). Plain
    Node environment, no jsdom — nothing under test touches the DOM.
    `vitest` is a devDependency only (`npm run test`), zero bytes shipped
    to users; bumped `@types/node` to `^24` alongside it since Vitest 5
    requires it and the project already runs on Node 24.
14. ~~Accessibility pass~~ — done: every `<select>` now has a properly
    linked `<label htmlFor>` instead of just sitting visually next to one;
    every toggle-style button (locale, mode, item category, goal) exposes
    `aria-pressed` for its selected state; the rarity dot in the
    advisor's lists gets `role="img"`/`aria-label` since it's the only
    place that info appears there (SearchMode's copy of the same dot gets
    `aria-hidden` instead, since it already sits next to visible rarity
    text); decorative emoji (rank medals, source icons) are
    `aria-hidden`; the "report a bug" external link gets a visually-hidden
    "(opens in a new tab)" hint; and `CopyLinkButton` is `aria-live` so
    the "copied" confirmation is announced, not just shown. All native
    `<button>`/`<select>` elements, so keyboard navigation (Tab/Enter/
    Space/arrow keys) already worked with no custom widget code needed.
    Color-contrast wasn't independently re-verified (no connected browser
    tool this session to measure it) — the existing palette was already
    designed with light/dark contrast in mind (see globals.css), so this
    is a lower-confidence claim than the rest of this item.
15. ~~Offline banner~~ — done: `OfflineBanner.tsx` listens for the
    browser's `online`/`offline` events and shows a small dismissed-when-
    online banner (`role="status"`/`aria-live` so it's announced, not just
    shown) explaining that a cached copy is being served and numbers may
    be stale until reconnected. `navigator.onLine` isn't available during
    the static build's server-side prerender, so it defaults to "online"
    there and self-corrects immediately on mount in a real browser — same
    hydrate-after-mount pattern as `LocaleContext`'s localStorage read.

    **Bug found and fixed 2026-09-12** (while testing an unrelated
    discoverability change, via a curl check of the actual rendered
    HTML): `typeof navigator === "undefined"` isn't enough to detect "not
    a real browser". Node 21+ ships a partial global `navigator` object
    (for Web-standard compatibility) whose `onLine` property is simply
    `undefined` — not `false`, not absent. That made the original guard
    (`someValue || false`-shaped) evaluate falsy during every
    server-rendered page — the banner was incorrectly showing on first
    paint on **every single page load**, in both `next dev` and the
    static production build, until the client-side effect corrected it a
    moment later. Never caught earlier because verification back then
    only checked `npm run build`'s exit code and HTTP status, not the
    actual rendered HTML content. Fixed by extracting the default-online
    logic into `onlineStatus.ts`'s `isOnlineByDefault()` (`!== false`
    instead of truthiness), now with 3 dedicated regression tests.
16. ~~Pre-filled bug report link~~ — done: `Footer.tsx`'s "report a bug"
    link now pre-fills the GitHub issue body with the exact current page
    URL (which already encodes the whole selection via shareLink.ts),
    plus locale, pinned game version, and `navigator.userAgent`. Built
    fresh in the click handler itself (not on mount, not via an effect)
    so it always reflects whatever's on screen at that moment with no
    extra state to keep in sync; the plain unprefilled link stays as the
    `href` fallback for no-JS or before hydration.

Another small reliability/UX-polish batch, same spirit as items 12-16 —
nothing new user-facing, nothing that adds runtime weight.

17. ~~CI on every push/PR~~ — done: `.github/workflows/ci.yml` runs
    `npm ci && npm run lint && npm run test && npm run build` on every
    push and PR (alongside the existing weekly version-freshness Action),
    closing the loop on the Vitest suite (item 13) actually being
    enforced going forward instead of relying on remembering to run it by
    hand. Setting this up caught a real, pre-existing problem: the
    committed `package-lock.json` had gone subtly out of sync with
    `node_modules` (a nested optional dependency pinned to conflicting
    versions in different parts of the tree, most likely dating from the
    Vitest install) — invisible to plain `npm install`, but `npm ci`
    (what CI and every teammate's clean clone actually uses) refused to
    install from it at all. Fixed by regenerating the lockfile from
    scratch.
18. ~~Custom 404 page~~ — done: `src/app/not-found.tsx` (Next's file
    convention) matches the app's look and, unlike `error.tsx`/
    `global-error.tsx`, safely uses the real `useLocale()` — a 404 isn't
    a crash, so there's nothing to be defensive about. Verified with a
    real request to a nonexistent path locally (HTTP 404, correct
    bilingual copy rendered).
19. ~~Open Graph / social preview metadata~~ — done: `layout.tsx` adds
    `openGraph`/`twitter` metadata plus `metadataBase` (needed to resolve
    the image into the absolute URL these platforms require) so a shared
    link (the app's own headline feature) actually shows a preview when
    pasted into Discord/Reddit/etc. instead of a bare URL. `og-image.png`
    is the app's own sparkle mark on its dark background — generated the
    same way the PWA icons were (a throwaway Node script, raw PNG bytes
    via built-in zlib, no image tool available) — deliberately without
    the app name baked into the image, since Discord/Twitter/etc. already
    render the `title` field as visible text alongside it. Verified
    locally: correct `og:*`/`twitter:*` tags with absolute URLs, image
    served with the right content-type.
20. ~~Print stylesheet~~ — done: a `@media print` block in `globals.css`
    turns the app into a plain paper "shopping list". Reuses the
    accessibility pass's `aria-pressed` attributes (item 14) to hide
    every non-selected choice in the category/goal/mode/locale toggle
    groups — only the active pick in each group prints — plus a new
    `data-has-level` attribute so a "current enchants" row still at
    "None" doesn't print as noise. Explicit `.no-print` on pure-action
    controls (Calculate, Copy link, the toggles, the bug-report link, the
    no-JS/offline banners). Also fixes a real print bug this surfaced:
    `.accent-gradient`/`.accent-text` render via a background-image (for
    the gradient fill/transparent-text trick) — printed with "background
    graphics" off (most printers' default), that background silently
    disappears and leaves invisible white-on-white text; forced to a
    plain black for print instead. Forces the light color palette
    regardless of system dark-mode preference, since nobody wants a
    near-black page eating a print cartridge.

21. ~~Best-method recommendation~~ — done, requested directly by the user
    rather than from the roadmap batches above: search mode now ranks
    every acquisition method (table on the item, table on a book,
    villager trading, fishing) by odds per attempt in one "Best method"
    section at the top of the results, instead of leaving the user to
    compare four separate sections by eye. `src/lib/bestMethod.ts` is a
    small, pure, tested ranking function (`rankMethods()` — probability
    → sorted list + expected-attempts-on-average, `1/probability`).
    Deliberately a ranking, not a single verdict: an attempt doesn't cost
    the same everywhere (a table roll spends XP levels and consumes the
    item/book, a trade reroll costs a lectern plus emeralds, a fishing
    cast only costs time) — a caveat sentence says so explicitly rather
    than pretending the comparison is perfectly fair. Sanity-checked
    manually for Efficiency III on a pickaxe with 15 bookshelves: table
    ≈2 expected attempts, book ≈19, trading ≈67, fishing ≈2099 — the
    ranking behaves exactly as expected.

## Versioning

The app follows semver (`MAJOR.MINOR.PATCH`), tracked in `package.json`'s
`"version"` field — the single source of truth, re-exported by
`src/lib/version.ts` (same pattern as `gameVersion.ts` reading
`game-version.json`, so the footer's displayed number can never drift from
the real one) and shown in the footer as "Enchant Advisor vX.Y.Z", plus
included in the pre-filled bug-report body.

- **MAJOR** — a breaking/ground-up redesign (adding a backend/accounts,
  dropping a mode). Expected to be rare.
- **MINOR** — a new feature. Every roadmap item above is a minor bump.
- **PATCH** — a bug fix or copy/UI tweak that isn't a feature.

**v1.0.0** (this entry) is the declared baseline — everything built up to
and including item 21 above.

To bump: `npm version <major|minor|patch> --no-git-tag-version` (updates
`package.json`/`package-lock.json` only, no auto-commit/tag — this project
commits deliberately, see the branch workflow below), then once merged to
`main`, tag that commit: `git tag -a vX.Y.Z -m "..."` and push the tag
(`git push origin vX.Y.Z`).

## Code-review follow-up (v1.0.1)

Ran the `mattpocock-skills:code-review` skill (two-axis: Standards against
the `codebase-design` skill's Fowler-smell baseline since no
`CODING_STANDARDS.md` exists, and Spec against this file) over the full
history from the first commit to v1.0.0. Findings and what was done about
each:

- **Spec axis — 3 stale doc claims, no code defects.** Fixed directly:
  this file previously said Riptide/Channeling were structure-loot-only
  (wrong since the trading/fishing-scope fix — corrected above), claimed
  the test suite had a fixed count that was already out of date, and
  still listed deployment as "not yet live" under "Not yet decided" (long
  since resolved, removed).
- **Standards axis — 6 Fowler-smell judgement calls, no hard violations**
  (no documented standards exist to violate). Addressed:
  - *Duplicated Code* (the table-combo/book-combo result blocks in
    `SearchMode.tsx`, and the label+select markup repeated 5x across
    `page.tsx`/`SearchMode.tsx`) — extracted `RankedResultsList.tsx` and
    `LabeledSelect.tsx`, two small deep modules per the `codebase-design`
    vocabulary (small props interface, the medal/progress-bar/formatting
    complexity hidden behind it). `RankedResultsList` also now backs the
    best-method ranking, unifying what was a third near-identical copy.
  - *Data Clump* (`page.tsx`'s `category`/`material`/`goalId`/`current`
    state, which always changed together but lived in 4 separate
    `useState` hooks) — moved to `advisorState.ts`: one `useReducer` whose
    actions (`CHANGE_CATEGORY`, `SET_MATERIAL`, `SET_GOAL`, `SET_LEVEL`,
    `HYDRATE`) own the "what resets/validates together" invariant instead
    of relying on every call site remembering it. `HYDRATE` in particular
    replaces 4 separate `setX` calls in the URL-hydration effect with one
    dispatch, and is now unit-tested directly (`advisorState.test.ts`, 14
    tests) — the validation logic is testable in isolation for the first
    time.
  - *Divergent Change* (`page.tsx` mixing layout, selection state,
    recommendation rendering, and anvil-table rendering in one 447-line
    component) — partially addressed as a side effect of the two
    extractions above (down to ~400 lines); a full per-step component
    split was deliberately **not** done this pass — bigger and riskier
    than the review asked for, without React Testing Library coverage to
    catch regressions, and the finding was already flagged "mild".
  - *Shotgun Surgery* (adding an `EnchantingSlot`/`MethodKind` variant
    touches several files) and *Primitive Obsession* (enchant ids as bare
    strings) — deliberately **left alone**. Both domains are small and
    essentially static (3 slots, 4 methods; enchant ids validated once at
    the data layer via `enchantmentById`); centralizing either now would
    be *Speculative Generality* — solving a change that isn't happening —
    which the same smell baseline warns against just as much as the
    smells it would "fix".

## Post-v1.0 roadmap (reliable, high-value additions only)

Bedrock Edition support was considered and explicitly rejected (see below)
— everything here stays Java-only. Three items agreed on, in order:

1. ~~Acquisition hints in the advisor~~ — done (v1.1.0): each "to add"/"to
   upgrade" recommendation can show its best acquisition method (table,
   book, trading, or fishing) inline, via a "How do I get these?" button.
   `bestMethod.ts`'s per-enchant assembly logic (previously only inline in
   `SearchMode.tsx`) was pulled out into `computeBestMethods()` — a real
   seam now that there are two call sites, not a hypothetical one — so
   both modes share it instead of duplicating the table/book/trade/fish
   orchestration. Fixed at 15 bookshelves / no Luck of the Sea and a
   smaller Monte-Carlo trial count (1500 vs search mode's own 6000/8000
   defaults) since this computes a whole goal's worth of enchants in one
   batch rather than the one enchant search mode focuses on — measured at
   ~120ms for a typical 4-enchant goal, not a UX concern. Recomputed
   whenever the target set changes (compared by a derived key at render
   time, not reset via an Effect — kept to React's own guidance on
   deriving instead of synchronizing state).
2. ~~Aggregate shopping-list totals~~ — done (v1.2.0): a grand total
   (level-1 books, XP levels) across every recommended enchantment in one
   anvil plan, not just the existing per-row numbers — extracted as
   `summarizeShoppingList()` in `anvil.ts` (pure, tested) rather than left
   inline in `page.tsx`. Originally proposed with a third number, lapis
   lazuli — **dropped before implementing**: verified (2+ independently
   corroborated sources) that the anvil has never consumed lapis for any
   operation, in any Java version; that's an enchanting-table-only cost.
   The original proposal was wrong, from memory, not from checking — the
   kind of mistake this project's whole sourcing discipline exists to
   catch, so it's worth naming here rather than quietly fixing it.
3. ~~Enchantment conflicts shown in search mode~~ — done (v1.3.0): reuses
   `incompatibleWith` (already derived from the real `exclusive_set` tag
   data, see `enchantments.ts`) to show what the searched enchantment
   can't be combined with, right next to the rarity line — no need to
   switch to the advisor to discover that, which already showed the same
   thing per-item via `recommend()`'s conflict detection.
4. **Anvil build-up interleaving optimizer** — bigger, deliberately
   scoped separately (see `anvil.ts`'s header on why the current model
   treats "getting a book to the target level" and "combining books onto
   the item" as two separate phases rather than one interleaved sequence)
   — likely worth a `grilling` pass before implementation to size it
   properly rather than guessing scope.

### Bedrock Edition — rejected

Researched (multiple independently-corroborated sources) before deciding:
Bedrock and Java actually share the SAME enchanting-table and anvil
formulas since the 1.20 parity update — the two most complex parts of
this app's engine. What genuinely differs (some per-item enchant
exclusivity, trading percentages) is real but narrower than expected.
The decision to skip it anyway: Bedrock has **no generated-data
equivalent to `misode/mcmeta`** — `Mojang/bedrock-samples` covers loot
tables/recipes, not the enchant-mechanics internals, so anything
Bedrock-specific would have to be sourced from wiki pages and reverse
engineering with no raw-data fallback ever available. That's a permanent
ceiling on the confidence this project could ever put behind a Bedrock
number, in a codebase whose whole credibility rests on "verified against
real generated data, not a wiki summary" (see the Cleaving/wind_burst
incidents above) — not worth compromising that principle for.

## Discoverability (v1.4.0)

Everything here is entirely within Claude Code's own reach — no external
account, no publishing on the user's behalf:

- **GitHub repo topics** — added via `gh repo edit --add-topic`
  (`minecraft`, `minecraft-java`, `enchanting`, `enchantment-calculator`,
  `anvil-calculator`, `nextjs`, `typescript`, `pwa`, `free-tool`,
  `bilingual`, `monte-carlo-simulation`, `minecraft-tools`) — the repo had
  none at all before this, a free/zero-risk GitHub-search win.
- **`src/app/sitemap.ts` / `src/app/robots.ts`** — Next's file
  conventions, auto-served at `/sitemap.xml`/`/robots.txt`. A single-page
  app only has one URL to list, but it's still a canonical-entry-point
  signal crawlers otherwise have to guess at.
- **JSON-LD structured data** (`WebApplication` schema, in `layout.tsx`)
  — tells search engines this is a free installable tool, not a blog
  post, which is what can unlock rich-result treatment.
- **Richer, bilingual `description`/`keywords` metadata** — the
  description used to be French-only; most enchantment-calculator
  searches skew English even from French speakers, so it now leads with
  an English sentence. Kept as one natural-reading description, not
  keyword-stuffed, since search engines discount/penalize that.
- **`alternates.canonical`** — removes ambiguity for crawlers about which
  URL variant (trailing slash, a shared link's query params, etc.) is the
  one to index.

**Explicitly NOT done, and can't be from here**: actually submitting the
site to Google Search Console (needs the user's own Google account),
posting to Reddit/Discord communities (needs the user's own accounts,
plus each community's self-promo rules checked first), and a demo GIF/
video (needs a connected browser tool, unavailable this session). The
user's own existing Minecraft community (the JDL server/LAN party
players) remains the highest-trust, lowest-effort channel and isn't
something Claude Code can act on at all.

## Mobile overflow bug + e2e test suite (v1.4.2)

A real user reported the site looking "cropped" on their phone. Diagnosed
with the `mattpocock-skills:diagnosing-bugs` discipline: no connected
browser tool this session either, but Playwright's headless Chromium
(installed on demand, no interactive extension needed) gave a genuine
Phase-1 feedback loop — measure `document.documentElement.scrollWidth`
vs `clientWidth` at real mobile viewport widths, which goes red exactly
when content overflows horizontally.

**Root cause**: the page's root container (`<div className="mx-auto
max-w-3xl ...">` in `page.tsx`) is a flex item of `<body class="flex
flex-col">` (the flex-column-body pattern that pins the footer to the
bottom). `mx-auto` on a flex item makes the browser size it by
shrink-to-fit — like a plain block with no width set — instead of
stretching to fill the flex line. Its shrink-to-fit (max-content) width
came out to ~464px (driven by the widest row rendered on first load,
the anvil-cost table under the default goal), so on every phone
narrower than that — every phone — the page overflowed horizontally.

**Two hypotheses tested and falsified before finding it** (per the
skill's "ranked, falsifiable hypotheses" discipline): adding `min-w-0`
to the container did nothing (proven by re-running the loop and getting
identical numbers); removing the anvil table's `min-w-[420px]` did
nothing either. The actual fix — adding an explicit `w-full` so the
flex item stretches instead of shrink-to-fitting — was confirmed by
watching the loop flip from red to green, then re-broken and re-fixed
once more to prove the test is genuinely red-capable (the skill's
Phase 2/6 discipline), not just coincidentally passing.

**Now permanent**: `playwright.config.ts` + `e2e/responsive.spec.ts`
(`npm run test:e2e`), checking horizontal overflow at 3 real phone
widths plus a desktop-still-centered sanity check, against the actual
production build (`next build && next start`, not `next dev`). Added
to `ci.yml` on every push/PR. This is exactly the class of bug Vitest's
unit tests structurally cannot catch (no real DOM/CSS box model in
Node) — the gap this closes.

Bumped to v1.4.2 (bug fix; the e2e suite is regression-test
infrastructure for it, not a new user-facing feature).

## Mobile touch-action (v1.5.0)

Considered and **rejected disabling pinch-zoom** (`maximum-scale=1`/
`user-scalable=no` in the viewport meta tag) for a more "app-like" mobile
feel. This is a well-documented WCAG failure (criteria 1.4.4/1.4.10 —
low-vision users rely on pinch-zoom to read content), well-known enough
that Safari on iOS has ignored `user-scalable=no` outright since iOS 10.
Contradicts the accessibility pass already done on this app (item 14
above) for no real gain.

Instead: `touch-action: manipulation` on `html` in `globals.css`, one
global rule. Per spec, `manipulation` explicitly keeps pinch-zoom and
panning — it only drops the non-standard double-tap-to-zoom gesture,
which is what was actually motivating the "disable zoom" idea (the
double-tap delay/accidental-zoom annoyance on buttons). Applied globally
on the root element rather than per-button so every future interactive
element gets it for free, with the same zero accessibility cost.

Bumped to v1.5.0 (a real, if small, user-facing behavior change).

## Mode toggle alignment (v1.5.1)

Reported by the user as looking "décentré" (off-center). Verified
visually with a Playwright screenshot (no interactive browser tool this
session either) before touching anything: on mobile, the hero content
above the toggle (badge, title, tagline) is explicitly `text-center`,
but the Conseiller/Recherche toggle itself — an `inline-flex` pill with
no centering of its own — sat flush left underneath it. Fixed by
wrapping it in the same `text-center sm:text-left` pattern the hero
title block already uses, so it's centered on mobile and left-aligned
on wider screens, consistent either way. Confirmed with before/after
screenshots at both breakpoints, and a permanent e2e regression test
(`e2e/responsive.spec.ts`) checking the group's horizontal center
matches the page's on mobile. Also gave the toggle's `role="group"` an
`aria-label` it was missing (a small accessibility gap surfaced while
writing a selector for the test that could tell it apart from the
locale toggle's own `role="group"`).

## Bookshelf-count curve chart (v1.6.0)

"Mega wow" roadmap item 2: Search mode now shows how the best achievable
table odds change across every bookshelf count 0-15, not just the one
count the player picked — answering "is it actually worth building more
bookshelves?" instead of just "what are my odds right now?".

`bookshelfCurve()` (`tableOdds.ts`) sweeps `findBestTableOdds()` at each
of the 16 counts. Runs at a lower trials-per-point (800 vs the single-
count lookup's 6000) since the curve's *shape* is what matters here, not
per-point precision — measured ~82ms for a pickaxe with 7 materials,
negligible next to the existing calculation. Covered by 3 new tests: the
16-point shape, a monotonic-non-decreasing check (every bookshelf count's
achievable level range is a superset of a lower count's, so odds can only
improve or hold — checked with a 0.05 tolerance for Monte Carlo noise,
re-run 5× during development to rule out flakiness), and a [0,1] bounds
check.

`BookshelfCurveChart.tsx` is a hand-rolled 16-bar chart (no charting
library — 16 bars doesn't justify the dependency weight), highlighting
the player's current bookshelf count and showing a one-sentence summary
(`bookshelfCurveSummary()` in `strings.ts`) of the best vs. worst odds in
the sweep. Gated on `!enchant.treasureOnly`, same as the existing table-
odds sections, since treasure-only enchants have no table odds to sweep.

Verified with a new Playwright e2e test that actually drives Search mode
(select an enchant, click Calculate, wait for the chart) rather than just
loading the static page — the existing overflow tests wouldn't have
caught a bug introduced only after this chart renders.

## Side-by-side enchantment comparison (v1.7.0)

"Mega wow" roadmap item 3: Search mode can now compare two enchantments
head-to-head ("Sharpness vs Smite for PVE" was the motivating example) —
a "Compare with another enchantment" checkbox reveals a second, fully
independent enchant/level/item selection, computed via `bestMethod.ts`'s
`computeBestMethods()` and shown side by side with the primary search's
own top pick, plus a one-line verdict (`compareVerdict()` in
`strings.ts`).

`computeBestMethods()` was exactly the right seam for this, unchanged:
its own header already says it's for a caller with "no pre-computed
results to reuse" (originally written for the advisor's acquisition
hints), which describes this second, ad-hoc selection precisely — no new
computation function needed, just a second call site.

Deliberately scoped down from a full "duplicate the whole search UI"
comparison: the comparison side reuses the primary panel's own bookshelf
count and Luck of the Sea rather than getting its own (the real question
is "which enchant should I chase on the table I already have", not "compare
two different table setups"), and shows only each side's single best
method rather than the full multi-section breakdown the primary search
gets — a clean two-column verdict, not two copies of the whole page. Not
wired into the share link for this pass (the primary search still is).

`methodResultItem()` — the label/probability-row mapping the main "best
method" list already built inline — was pulled out once the comparison
panel needed the exact same shape for a second call site: a real seam
now, not a hypothetical one, per `codebase-design`'s "one adapter is
hypothetical, two is real."

**Found and fixed in passing**: while re-verifying `npm ci` before this
commit, the previous release's bookshelf-curve monotonicity test (800
trials/point, 0.05 tolerance) flaked for the first time — 1 failure in
roughly 16 runs. Each curve point is the max of ~18 material×slot
Monte-Carlo estimates, so a point-to-point difference is noisier than a
single proportion's standard error suggests. Diagnosed per
`diagnosing-bugs`'s non-deterministic-bug guidance (raise the
reproduction rate until a fix is verifiable, don't just widen the
tolerance and hope): bumped to 2500 trials/point + a 0.06 tolerance,
re-run 30× with zero failures before trusting it.

Bumped to v1.7.0 (new user-facing feature; the test-flakiness fix rides
along rather than getting its own patch release, since it never shipped
as a visible bug — only as an occasional CI flake).

## Repo cleanup + architecture polish (2026-09-13, no version bump)

Two follow-up passes, both zero-behavior-change so neither earned a semver
bump per the versioning policy below:

**Repo cleanup**: removed `file.svg`/`globe.svg`/`next.svg`/`vercel.svg`/
`window.svg` — leftover `create-next-app` scaffold icons, confirmed
unreferenced anywhere before deleting. Tidied `.gitignore` (added
Windows/editor cruft patterns, removed a duplicated block).

**Architecture polish** (`mattpocock-skills:improve-codebase-architecture`,
adapted for an unattended pass — no user available to pick a candidate
interactively, so this stuck to fixes clear-cut enough not to need one):
exploration found the codebase already in good shape (unsurprising, since
it's been built under `codebase-design` discipline all session) — no deep
"shallow module" restructuring candidates, just a handful of concrete,
independently-verifiable fixes:

- **`enchantmentById()`**: O(n) `.find()` over `ENCHANTMENTS` on every
  call → a `Map` built once at module load. One of the most-called
  functions in the codebase (recommend.ts, anvil.ts, bestMethod.ts,
  treasure.ts, both page components); n≈40 makes the raw speed difference
  unmeasurable, but O(1)-by-id-lookup is the right shape regardless.
- **`treasure.ts`'s trading/loot pool**: was a zero-argument function
  rebuilt on every `treasureOdds()` call despite being 100% deterministic
  (pure function of static data) — hoisted to a module-level constant
  computed once.
- **`page.tsx`'s defeated memoization**: `anvilTargets` was a fresh
  `.filter().map()` array on every render, which silently defeated
  `anvilPlan`'s own `useMemo([anvilTargets])` — a new array reference
  every time meant it recomputed on every render regardless of whether
  `recommendations` had actually changed. `currentLevelByEnchant`,
  `stepsWithBuildUp`, and `shoppingList` had the same gap. All four now
  wrapped in `useMemo` with correct dependencies, restoring the
  memoization chain's actual intent (the cost involved is trivial either
  way — this is a correctness-of-intent fix, not a real bottleneck).
- **`STATUS_LABEL`/`STATUS_STYLE`**: were inline `Record` objects
  reallocated in `page.tsx` on every render. Extracted following the
  pattern `presentation.ts`'s `RARITY_KEY`/`rarityLabel`/`RARITY_VAR`
  already established for the exact same shape of problem (rarity, not
  status) — `statusLabel()` joins `strings.ts`, `STATUS_STYLE` joins
  `presentation.ts`.
- **`.panel-raised`**: dead CSS class, confirmed via grep to be applied
  nowhere in any component, removed from both the light and print rules
  in `globals.css`.

**Verification**: full lint/test/build/e2e suite green, plus a one-off
Playwright visual-regression harness (not committed — lives only in the
session's scratchpad) that screenshotted Advisor and Search mode at
mobile/desktop widths before and after every change and diffed them
pixel-by-pixel. First run produced a false-positive diff from Search
mode's own Monte-Carlo randomness (different runs roll different
percentages, unrelated to the code change); fixed by seeding
`Math.random()` with a fixed LCG via `page.addInitScript()` before each
capture so both runs see byte-identical "random" numbers. With that,
before/after came back pixel-identical (`maxDiffPixelRatio: 0` at every
viewport) — confirming all five changes are genuinely invisible.

## Stats Calculator — Phase 1: melee damage, DPS, Unbreaking (v1.8.0)

Third mode, "Calculateur de statistiques" — scoped through an extensive
`grilling` session (see the conversation log; not reproduced in full
here) that settled a large design tree: full multi-slot loadout builder
(not one item at a time), a live 3D character (skinview3d) rather than a
static icon, target-type auto-detected from the enchant chosen rather
than a separate selector, damage-per-hit AND DPS shown together, and a
4-phase rollout (melee+DPS+Unbreaking → mining speed → armor, pending its
own formula-verification pass → bow/crossbow/trident/mace/spear). The
"kit complet" loadout-planner idea flagged much earlier in this file's
roadmap turned out to be the same feature as this one, once the design
tree was worked through — they were merged rather than built twice.

**This is the app's first-ever runtime dependency** beyond
next/react/react-dom, and the first feature with a genuinely new source
of numbers: not enchanting-table/anvil mechanics (already deeply
verified all session) but combat formulas, a different part of the game
entirely. Every number below was freshly fetched from misode/mcmeta this
session (26.2-data for enchantment `effects`, 26.2-summary for
`item_components/data.json`'s base weapon attributes) — not reused from
memory or an earlier session's cache, and re-verified even for
enchantments (sharpness/protection/efficiency) already fetched in an
earlier pass, specifically to avoid assuming a cached value still holds.

**Real discovery that changed the plan**: modern Minecraft's
data-driven enchantments store their gameplay-effect FORMULAS as
structured data in the same enchantment JSON already used for
weight/cost (an `effects` field — e.g. sharpness:
`{type: add, value: {type: linear, base: 1.0, per_level_above_first: 0.5}}`).
This is why "very precise" combat stats are feasible at all with the
same sourcing discipline as everything else in this app, rather than
falling back to wiki numbers. Roughly half the effects are gated by a
generic `requirements` predicate system (target-mob-type checks,
damage-source-tag checks, `all_of`/`inverted` trees) — deliberately NOT
built as a general interpreter yet (see weaponStats.ts's header): only
Phase 1's actual 3 target types (generic/undead/arthropod) are
hardcoded. Build the general predicate system only when a real second
use case demands it, not speculatively.

**Data layer** (`weapon-data.json`, `weaponStats.ts`): base attack
damage/speed for sword+axe × all 7 tracked materials (confirmed copper
sword/axe exist, matching what materials.ts already assumed), plus
Sharpness/Smite/Bane of Arthropods (damage + mob-type target),
Sweeping Edge (sweep-attack ratio), Fire Aspect (burn seconds), and
Unbreaking's non-armor save-chance branch — all pure functions, 12 new
Vitest tests. One documented, real gap: the player's own base 1.0
attack_damage / 4.0 attack_speed (that every weapon modifier stacks on
top of) is hardcoded in Minecraft's Java source, not exposed by any
generator/data-pack export anywhere — cross-checked instead against
well-known, stable vanilla numbers (diamond sword = 7 dmg/1.6 attacks-
per-second) rather than presented as equally solid as the generator-
sourced fields.

**skinview3d** (MIT, Three.js-based) renders a live-rotating 3D
character. Dynamically imported (`import("skinview3d")` inside a
`useEffect`, never a top-level import) so it never touches SSR and, per
`next build`'s own output, code-splits into its own ~524KB chunk that
doesn't appear anywhere in the initial page load — confirmed by grepping
for the chunk hash in the built HTML. Advisor/Search visitors pay zero
cost for this; only Stats-mode visitors load it.

**The skin is an original, non-Mojang placeholder** — a small
programmatically-drawn (canvas, not a bundled image asset) "enchanted
construct" in the app's own accent colors, legacy 64×32 skin layout
(skinview3d auto-mirrors the left arm/leg from the right, avoiding any
risk of mis-placing the extended 64×64 format's separate left-side UV
regions). Deliberately not a Steve/Alex recreation: Mojang's usage
guidelines restrict redistributing their own texture/graphics assets,
confirmed via their published guidelines page during scoping. Real
skin-by-username lookup (via Mojang's session-server API) is designed
for (username field, localStorage-cached same pattern as locale) but
NOT wired up yet — CORS behavior of Mojang's API from a browser origin
wasn't verified this pass, and shipping a silently-broken network call
felt worse than an honest "coming soon" caption. Small follow-up, not
Phase 2/3/4.

Real Minecraft armor textures (for a later phase's armor visualization)
can't be bundled for the same Mojang-assets reason — will need original
stylized art per material tier, not extracted game textures.

Other equipment slots (helmet/chestplate/leggings/boots/offhand) are
visible on the page now, marked "Bientôt" — the page's end state is the
full loadout from day one; phases add real stat coverage to slots
already on screen, rather than each phase being a separate standalone
tool.

Bumped to v1.8.0 (new feature; also the version that introduces the
app's first non-framework dependency, worth flagging on its own even
though the version-bump reason is the feature, not the dependency).
