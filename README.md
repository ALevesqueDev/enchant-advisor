# Enchant Advisor

Idea: given a tool/armor type + tier (e.g. diamond pickaxe), the enchantments
already on it, and what the player wants to do with it, recommend the best
enchantments to add next — not just "what's the cheapest anvil order for a
list I already picked."

Status: **idea stage** — competitive research done, no build decisions made
yet.

## Competitive landscape (checked 2026-09-11)

The "anvil combine order / XP cost calculator" niche is crowded:

- [XGamingServer](https://xgamingserver.com/tools/minecraft/enchantment-calculator) — conflicts + optimal combine order + "Max All" auto-fill
- [MinecraftMaps](https://www.minecraftmaps.com/tools/enchantments) — cheapest combine tree, prior-work penalty, 39-level cap
- [GamingStunt](https://gamingstunt.com/tools/minecraft/minecraft-enchantment-calculator) — XP cost + risky-path warnings
- [HowToPlayHub](https://howtoplayhub.com/minecraft/enchantment-guide) — closest to our angle: "recommended builds with one-line reasons"
- [MineConfig](https://mineconfig.com/en/enchant) — Java + Bedrock, cost + order
- [MinecraftSearch planner](https://minecraftsearch.com/tools/enchantment-planner) — combine order from a chosen enchant list
- [enchantment.tools](https://enchantment.tools/) — prior-work-penalty-aware cheapest path

**None of these clearly start from "here's what's already on the item +
here's my goal" and recommend the delta.** That's the open angle — needs a
closer look at HowToPlayHub specifically before committing, since it's the
nearest match.

## Open questions before any build decision

1. **Java or Bedrock?** Enchant-table odds, anvil rules, and available
   enchantments differ between editions.
2. **Scope**: just anvil/creative combining, or also enchant-table
   probability advice (what to do at the table itself)?
3. **"Goal" taxonomy**: what are the intended-use categories? (mining /
   combat / exploration / farming / PvP / trading gear / etc.) — this is the
   core of the recommendation logic and needs to be nailed down before any
   data model.
4. **Platform**: web app, mobile app, or both?
5. **Data source**: hand-encode the enchantment compatibility/conflict rules
   (they're fixed game data, not many of them) vs. pull from an existing
   open dataset.

Nothing built yet — this file is the starting point for the next session.
