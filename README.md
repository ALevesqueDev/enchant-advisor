# Enchant Advisor

Given a Minecraft Java item, its tier, the enchantments already on it, and
what you want to do with it, recommends the enchantments to add next — then
gives the cheapest anvil combine order and XP cost for the result.

See [`PROJECT.md`](PROJECT.md) for the goal taxonomy, competitive research,
and rules reference. Nothing is built yet beyond the scaffold.

## Stack

Next.js (App Router) + TypeScript + Tailwind. Fully client-side — no
backend, no database. All enchantment rules (conflicts, max levels, anvil
cost formulas) are static game data, so a server isn't needed.

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
