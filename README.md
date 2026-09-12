# Enchant Advisor

Given a Minecraft Java item, its tier, the enchantments already on it, and
what you want to do with it, recommends the enchantments to add next, gives
the cheapest anvil combine cost, and simulates the real enchanting-table
odds (or fishing/trading odds for treasure enchantments) for a target
enchantment + level.

**Live:** https://enchant-advisor.vercel.app

See [`PROJECT.md`](PROJECT.md) for the goal taxonomy, competitive research,
data sourcing, version pinning, and the roadmap.

## Stack

Next.js (App Router) + TypeScript + Tailwind. Fully client-side — no
backend, no database. All enchantment rules (conflicts, max levels, anvil
cost formulas, table weights) are static game data pinned to a specific
Minecraft version — see `src/lib/gameVersion.ts`.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run lint    # eslint
```

## License

Source is public for transparency and testing — see [`LICENSE`](LICENSE).
All rights reserved; no reuse license is granted. Bug reports and
suggestions are welcome via GitHub Issues.
