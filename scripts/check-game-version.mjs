#!/usr/bin/env node
// Checks whether our pinned Minecraft version (src/lib/game-version.json)
// is still the latest stable release, and if not, diffs our enchantment
// data against a fresh fetch from github.com/misode/mcmeta (the same raw
// generated-game-data mirror this project's data was built from — NOT the
// wiki; see PROJECT.md for why wiki-summary fetches aren't trusted here).
//
// Exit code 0: nothing to do (either up to date, or up to date and no diff).
// Exit code 1: a newer stable version exists — report printed to stdout,
//              or one/more comparable value differs — meant for a human
//              (or a CI step) to read, not to auto-apply.
//
// Usage: node scripts/check-game-version.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIB_DIR = path.join(__dirname, "..", "src", "lib");

const pinned = JSON.parse(readFileSync(path.join(LIB_DIR, "game-version.json"), "utf8"));
const ourData = JSON.parse(readFileSync(path.join(LIB_DIR, "enchantment-data.json"), "utf8"));

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": "enchant-advisor-version-check/1.0" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return res.json();
}

// A real recursive comparison, not JSON.stringify — key order in an object
// literal isn't meaningful, but stringify treats it as if it were.
function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => deepEqual(a[key], b[key]));
}

async function main() {
  const manifest = await fetchJson("https://piston-meta.mojang.com/mc/game/version_manifest_v2.json");
  const latestStable = manifest.latest.release;

  if (latestStable === pinned.version) {
    console.log(`Up to date — pinned version ${pinned.version} is still the latest stable release.`);
    return;
  }

  console.log(`## Minecraft version drift detected\n`);
  console.log(`Pinned: **${pinned.version}** (verified ${pinned.verifiedDate})`);
  console.log(`Latest stable: **${latestStable}**\n`);

  let registryList;
  try {
    registryList = await fetchJson(
      `https://raw.githubusercontent.com/misode/mcmeta/${latestStable}-registries/enchantment/data.json`
    );
  } catch (e) {
    console.log(`Could not fetch the enchantment registry at tag \`${latestStable}-registries\`: ${e.message}`);
    console.log(`(Tags lag a little behind a fresh release sometimes — check misode/mcmeta manually.)`);
    process.exitCode = 1;
    return;
  }

  const ourIds = new Set(Object.keys(ourData));
  const theirIds = new Set(registryList);

  const added = [...theirIds].filter((id) => !ourIds.has(id));
  const removed = [...ourIds].filter((id) => !theirIds.has(id));

  if (added.length > 0) {
    console.log(`### New enchantments (not in enchantment-data.json)\n`);
    for (const id of added) console.log(`- \`${id}\``);
    console.log("");
  }
  if (removed.length > 0) {
    console.log(`### Enchantments removed from the game (still in our data)\n`);
    for (const id of removed) console.log(`- \`${id}\``);
    console.log("");
  }

  // treasureOnly isn't a field on the enchantment itself — it's "not a
  // member of the non_treasure tag". Fetch that once rather than guessing.
  let nonTreasureIds = new Set();
  try {
    const nonTreasureTag = await fetchJson(
      `https://raw.githubusercontent.com/misode/mcmeta/${latestStable}-data/data/minecraft/tags/enchantment/non_treasure.json`
    );
    nonTreasureIds = new Set(nonTreasureTag.values.map((v) => v.replace("minecraft:", "")));
  } catch (e) {
    console.log(`Could not fetch the non_treasure tag: ${e.message} — treasureOnly won't be checked this run.\n`);
  }

  const shared = [...ourIds].filter((id) => theirIds.has(id));
  const changed = [];

  for (const id of shared) {
    let fresh;
    try {
      fresh = await fetchJson(
        `https://raw.githubusercontent.com/misode/mcmeta/${latestStable}-data/data/minecraft/enchantment/${id}.json`
      );
    } catch (e) {
      console.log(`Could not fetch \`${id}\`: ${e.message}`);
      continue;
    }
    const freshComparable = {
      maxLevel: fresh.max_level,
      treasureOnly: nonTreasureIds.size > 0 ? !nonTreasureIds.has(id) : ourData[id].treasureOnly,
      weight: fresh.weight,
      anvilCost: fresh.anvil_cost,
      minCost: { base: fresh.min_cost.base, perLevelAboveFirst: fresh.min_cost.per_level_above_first },
      maxCost: { base: fresh.max_cost.base, perLevelAboveFirst: fresh.max_cost.per_level_above_first },
    };
    const ours = ourData[id];
    if (!deepEqual(ours, freshComparable)) {
      changed.push({ id, ours, fresh: freshComparable });
    }
  }

  if (changed.length > 0) {
    console.log(`### Changed values\n`);
    for (const c of changed) {
      console.log(`- \`${c.id}\``);
      console.log(`  - ours:  ${JSON.stringify(c.ours)}`);
      console.log(`  - fresh: ${JSON.stringify(c.fresh)}`);
    }
    console.log("");
  }

  if (added.length === 0 && removed.length === 0 && changed.length === 0) {
    console.log(
      `No enchantment data differences found — only the version pin itself needs bumping in game-version.json.`
    );
  } else {
    console.log(`Review the differences above, update enchantment-data.json / enchantments.ts accordingly, ` +
      `then bump game-version.json.`);
  }

  process.exitCode = 1;
}

main().catch((e) => {
  console.error("check-game-version failed:", e.message);
  process.exitCode = 1;
});
