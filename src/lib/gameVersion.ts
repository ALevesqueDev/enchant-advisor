// The single source of truth for which Minecraft version this app's data
// matches. Bump this — and re-verify enchantments.ts/materials.ts/anvil.ts
// against https://github.com/misode/mcmeta (tag `<version>-data` and
// `<version>-summary`) — whenever a new stable release ships.
//
// Confirmed 2026-09-11 against Mojang's own version manifest
// (piston-meta.mojang.com/mc/game/version_manifest_v2.json): latest stable
// release = 26.2. Mojang moved to a year.release scheme (26.x) at some
// point after this assistant's Jan 2026 training cutoff — the old "1.21.x"
// naming this assistant knew is no longer current. Data was cross-checked
// identical between the 26.2 stable tag and the 26.3-rc-2 snapshot this
// project originally pulled from, so nothing needed correcting — only
// labeling.
export const GAME_VERSION = "26.2";
export const DATA_VERIFIED_DATE = "2026-09-11";
