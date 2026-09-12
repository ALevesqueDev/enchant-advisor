# Enchant Advisor

A Minecraft Java Edition enchanting advisor. Tell it what item you have, what's
already enchanted on it, and what you're trying to do with it — it recommends
what to add next, prices the anvil work, and simulates real drop odds for a
specific enchantment and level.

**🔗 Try it: https://enchant-advisor.vercel.app**

## What it does

- **Advisor** — pick an item and a goal (mining, PvP, a mob farm, exploration…),
  see the enchantments still worth adding, and the anvil XP cost to get there.
- **Odds search** — pick a target enchantment and level; for anything obtainable
  from the enchanting table, a Monte-Carlo simulation of the real weighted-pick
  algorithm finds the best material and table level for it. For treasure
  enchantments (Mending and the like, which the table can never produce), it
  computes real fishing and villager-trading odds instead.
- **Version-aware** — every number is pinned to a specific Minecraft release and
  re-verified on a schedule against the game's own generated data, not a wiki
  page (see [`PROJECT.md`](PROJECT.md) for why that distinction mattered in
  practice).

## Why this exists

Most enchantment calculators out there start from "what do you want to end up
with" and price the anvil work backward from a list you already picked. This
one instead starts from what's *already* on the item and what you're trying to
do with it, and works out the delta — closer to advice than to a calculator.

## Tech

Next.js (App Router) + TypeScript + Tailwind, fully client-side — no backend,
no database, no accounts. Deployed on Vercel. Game data lives in versioned JSON
(`src/lib/*.json`), checked weekly against
[misode/mcmeta](https://github.com/misode/mcmeta) by a small script and a
GitHub Action — see [`PROJECT.md`](PROJECT.md) for the full design notes,
sourcing, and roadmap.

## License

This source is public for transparency, not for reuse — see
[`LICENSE`](LICENSE). All rights reserved. Found a bug or have a suggestion?
[Open an issue](https://github.com/ALevesqueDev/enchant-advisor/issues/new).

---

<details>
<summary>For maintainers: running it locally</summary>

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
node scripts/check-game-version.mjs   # manual version-freshness check
```

</details>
