// The app's own version — distinct from GAME_VERSION (gameVersion.ts),
// which is the pinned Minecraft release the game DATA matches, not this
// codebase. Reads directly from package.json's "version" field rather
// than duplicating the number here, for the same reason gameVersion.ts
// reads from game-version.json instead of a hardcoded constant: one
// source of truth, so the two can never quietly drift out of sync.
//
// Follows semver: MAJOR for a breaking/ground-up redesign (rare — adding
// a backend/accounts, dropping a mode), MINOR for each new feature
// (everything in PROJECT.md's roadmap so far), PATCH for bug fixes and
// copy/UI tweaks that aren't a feature. Bump via
// `npm version <major|minor|patch> --no-git-tag-version`, then tag the
// merge commit on `main` (`git tag -a vX.Y.Z`) — see PROJECT.md.
import pkg from "../../package.json";

export const APP_VERSION = pkg.version;
