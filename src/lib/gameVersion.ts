// The single source of truth for which Minecraft version this app's data
// matches lives in game-version.json (plain JSON, not TS) specifically so
// scripts/check-game-version.mjs can read the same file without needing a
// TypeScript compiler. Bump it there — and re-verify enchantment-data.json
// and materials.ts against https://github.com/misode/mcmeta (tag
// `<version>-data` / `<version>-summary`) — whenever a new stable release
// ships, or just run the checker script, which does this automatically.
//
// Confirmed 2026-09-11 against Mojang's own version manifest
// (piston-meta.mojang.com/mc/game/version_manifest_v2.json): latest stable
// release = 26.2. Mojang moved to a year.release scheme (26.x) at some
// point after this assistant's Jan 2026 training cutoff — the old "1.21.x"
// naming this assistant knew is no longer current.
import gameVersion from "./game-version.json";

export const GAME_VERSION = gameVersion.version;
export const DATA_VERIFIED_DATE = gameVersion.verifiedDate;
