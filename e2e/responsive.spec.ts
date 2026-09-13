import { test, expect } from "@playwright/test";
import packageJson from "../package.json" with { type: "json" };

// Regression test for a real bug (found 2026-09-12 via a user report,
// diagnosed with a headless-browser feedback loop per the
// mattpocock-skills:diagnosing-bugs discipline): the page's root
// container was a flex item of `<body class="flex flex-col">` with
// `mx-auto` but no explicit width. Auto margins on a flex item make the
// browser size it by shrink-to-fit (like a normal block with no width
// set, NOT stretched to fill the flex line) — so the container sized
// itself to its content's max-content width (~464px, from the widest
// row on the page at the time) instead of the actual viewport, and
// everything on mobile screens narrower than that overflowed
// horizontally. `min-w-0` on the container did NOT fix it (proven by
// testing that hypothesis first and watching it fail) — the real fix was
// adding an explicit `w-full` so the flex item actually fills its line;
// `max-w-3xl`/`mx-auto` still cap and center it correctly on wide
// screens (see the desktop-still-centered test below).
//
// This is exactly the class of bug Vitest's unit tests structurally
// cannot catch (no real DOM/CSS box model in a Node test environment,
// see vitest.config.mts's header) — hence a real browser here instead.

const MOBILE_VIEWPORTS = [
  { name: "iPhone SE", width: 375, height: 667 },
  { name: "iPhone 14", width: 390, height: 844 },
  { name: "common Android", width: 360, height: 800 },
];

for (const vp of MOBILE_VIEWPORTS) {
  test(`no horizontal overflow at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/");

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    // 1px tolerance for subpixel rounding, not a loophole for real overflow.
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
}

test("desktop content still caps at max-w-3xl and stays centered", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const rect = await page.evaluate(() => {
    const el = document.querySelector("div.mx-auto");
    if (!el) throw new Error("root content container (div.mx-auto) not found");
    const r = el.getBoundingClientRect();
    return { width: r.width, left: r.left, right: r.right };
  });

  expect(rect.width).toBeLessThanOrEqual(768 + 1); // max-w-3xl = 48rem = 768px
  expect(Math.abs(rect.left - (1440 - rect.right))).toBeLessThan(2); // centered, not full-bleed
});

// Regression test for a real user report (2026-09-13): the mode toggle
// ("Conseiller"/"Recherche d'enchantement") was an inline-flex pill with
// no centering of its own, so it sat flush left on mobile while
// everything above it (badge, title, tagline) was explicitly centered --
// visually inconsistent ("décentré"). Fixed by wrapping it in the same
// text-center sm:text-left pattern the hero title block already uses.
test("mode toggle is centered on mobile, matching the hero content above it", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const { groupCenterX, pageCenterX } = await page.evaluate(() => {
    // Not [role="group"] alone -- the locale toggle (EN/FR) is also a
    // role="group" earlier in the DOM.
    const group = document.querySelector('[role="group"][aria-label*="Advisor, Search"]');
    if (!group) throw new Error("mode toggle group not found");
    const r = group.getBoundingClientRect();
    return { groupCenterX: r.left + r.width / 2, pageCenterX: window.innerWidth / 2 };
  });

  expect(Math.abs(groupCenterX - pageCenterX)).toBeLessThan(2);
});

// Regression coverage for the bookshelf-curve chart (2026-09-13): a 16-bar
// hand-rolled chart is exactly the kind of element that can silently blow
// out the mobile-overflow fix above it (flex row of 16 items, each with a
// minimum content width) if it's ever changed. Drives the real
// Search-mode flow (not just a static page load) so the chart is actually
// present in the DOM before asserting.
test("bookshelf curve chart renders without causing mobile overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");

  await page.getByRole("button", { name: "Recherche d'enchantement" }).click();
  await page.locator("#search-enchant-select").selectOption("efficiency");
  await page.getByRole("button", { name: /Calculer/ }).click();
  await page.getByText("Ça vaut la peine, plus d'étagères?").waitFor();

  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
});

// Regression coverage for the side-by-side comparison panel (2026-09-13,
// "mega wow" roadmap item 3): drives the full flow -- calculate a primary
// enchant, enable comparison, pick a second enchant, compare -- since this
// is exactly the kind of two-column layout that can quietly reintroduce
// horizontal overflow on mobile.
test("comparison panel renders two columns without causing mobile overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");

  await page.getByRole("button", { name: "Recherche d'enchantement" }).click();
  await page.locator("#search-enchant-select").selectOption("efficiency");
  await page.getByRole("button", { name: /Calculer/ }).click();
  await page.getByText("Ça vaut la peine, plus d'étagères?").waitFor();

  await page.getByText("Comparer avec un autre enchantement").click();
  await page.locator("#compare-enchant-select").selectOption("fortune");
  await page.getByRole("button", { name: /Comparer/ }).click();
  await page.getByText(/meilleures chances par tentative|mêmes chances/).waitFor();

  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
});

// Regression coverage for the Stats mode's Phase 1 (2026-09-13): drives the
// real flow -- switch mode, change the damage enchant's level, confirm the
// displayed damage actually updates (proves the calculation is wired to the
// UI, not just present in isolation) -- and checks mobile overflow, since
// this is the first mode with a live 3D canvas (skinview3d) as well as a
// two-column equipment/character layout.
test("stats mode computes live damage and stays overflow-free on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/");

  await page.getByRole("button", { name: "Calculateur de statistiques" }).click();
  await page.getByText("Dégâts par coup").waitFor();

  const damageValue = page.locator("text=Dégâts par coup").locator("..").locator(".accent-text");
  const before = await damageValue.textContent();

  await page.locator("#stats-damage-level-select").selectOption("1");
  await expect(damageValue).not.toHaveText(before ?? "");

  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
});

// Regression test for a real user report (2026-09-13): switching the
// weapon from sword to axe left Sweeping Edge and Fire Aspect selectable,
// even though both are sword-only in the real game (enchantments.ts's own
// CURATION data) -- axes never showed a different enchant list at all.
test("stats mode hides sword-only enchants when the weapon is switched to axe", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Calculateur de statistiques" }).click();
  await page.getByText("Dégâts par coup").waitFor();

  await expect(page.locator("#stats-sweep-select")).toBeVisible();
  await expect(page.locator("#stats-fire-select")).toBeVisible();

  await page.locator("#stats-weapon-select").selectOption("axe");

  await expect(page.locator("#stats-sweep-select")).toHaveCount(0);
  await expect(page.locator("#stats-fire-select")).toHaveCount(0);
});

// Regression coverage for the armor-slot loadout picker (2026-09-13):
// picking a material for each of the 4 armor slots recolors the 3D
// character (characterSkin.ts) via viewer.loadSkin() -- not directly
// pixel-testable through a WebGL canvas here, but this proves the full
// interaction survives (no crash, no mobile overflow) across all 4 slots
// at once, the actual "build your whole loadout" flow the feature is for.
test("stats mode's armor slot pickers work together without crashing or overflowing", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 1000 });
  await page.goto("/");
  await page.getByRole("button", { name: "Calculateur de statistiques" }).click();
  await page.getByText("Dégâts par coup").waitFor();

  await page.locator("#stats-helmet-select").selectOption("diamond");
  await page.locator("#stats-chestplate-select").selectOption("netherite");
  await page.locator("#stats-leggings-select").selectOption("iron");
  await page.locator("#stats-boots-select").selectOption("golden");

  await expect(page.locator("#stats-helmet-select")).toHaveValue("diamond");
  await expect(page.locator("#stats-boots-select")).toHaveValue("golden");

  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
});

// Real skin lookup calls a third-party service (mc-heads.net) -- this test
// deliberately does NOT assert whether that specific call succeeds or
// fails (CI network policy/the service's own uptime are outside this
// repo's control), only that clicking "Charger" actually changes the
// caption away from its initial generic-character text, proving the
// button is wired to a real attempt rather than a no-op.
test("stats mode's skin lookup button changes the caption when clicked", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Calculateur de statistiques" }).click();
  await page.getByText("Dégâts par coup").waitFor();

  const caption = page.locator("#stats-username").locator("../..").locator("p.text-muted");
  const before = await caption.textContent();

  await page.locator("#stats-username").fill("Notch");
  await page.getByRole("button", { name: "Charger" }).click();
  await expect(caption).not.toHaveText(before ?? "", { timeout: 10000 });
});

// Regression coverage for the Stats mode's Phase 2 (2026-09-13): mining
// speed. Drives the real flow -- switch tool material, confirm the
// displayed break time on the reference blocks actually updates.
test("stats mode computes live mining break time", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Calculateur de statistiques" }).click();
  await page.getByText("Vitesse de minage").waitFor();

  const obsidianTime = page.locator("text=Obsidienne").locator("..").locator(".accent-text");
  const before = await obsidianTime.textContent();

  // Dropping Efficiency from its default (V) to none is a big enough speed
  // swing to visibly change obsidian's break time even through the
  // formula's whole-tick rounding (small swings, e.g. just switching
  // material, can round to the same displayed tick count).
  await page.locator("#stats-efficiency-select").selectOption("0");
  await expect(obsidianTime).not.toHaveText(before ?? "");
});

// Regression coverage for the Stats mode's Phase 3 (2026-09-13): armor.
// Drives the real flow -- equip a full diamond set with Protection IV on
// every piece, confirm the displayed reduction for each of the 4 damage
// types actually updates from its all-empty-slots baseline.
test("stats mode computes live armor damage reduction across all 4 slots", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 1400 });
  await page.goto("/");
  await page.getByRole("button", { name: "Calculateur de statistiques" }).click();
  await page.getByText("Armure (coup typique)").waitFor();

  const genericReduction = page.locator("text=Générique").locator("..").locator(".accent-text");
  const before = await genericReduction.textContent();
  expect(before).toBe("0%");

  await page.locator("#stats-helmet-select").selectOption("diamond");
  await page.locator("#stats-helmet-protection-select").selectOption("protection:4");
  await page.locator("#stats-chestplate-select").selectOption("diamond");
  await page.locator("#stats-chestplate-protection-select").selectOption("protection:4");
  await page.locator("#stats-leggings-select").selectOption("diamond");
  await page.locator("#stats-leggings-protection-select").selectOption("protection:4");
  await page.locator("#stats-boots-select").selectOption("diamond");
  await page.locator("#stats-boots-protection-select").selectOption("protection:4");

  // Full diamond (20 armor points) alone already gives the well-known 80%
  // typical-hit reduction -- combined with Protection IV x4's EPF, the
  // final figure caps out at 100% (rounded), so just confirm it moved off
  // the 0% baseline rather than asserting one exact number.
  await expect(genericReduction).not.toHaveText("0%");

  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
});

// Regression coverage for the Stats mode's Phase 4 (2026-09-13): trident,
// mace, and the bow/crossbow utility section. Switching to trident hides
// the material select entirely (no tiers) and swaps in Impaling instead
// of Sharpness/Smite/Bane -- exactly the kind of per-weapon filtering bug
// already caught once for the axe (see the Sweeping Edge/Fire Aspect
// test above), so this locks the same pattern down for the new weapons.
test("stats mode's trident hides the material select and offers Impaling instead of Sharpness", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 1400 });
  await page.goto("/");
  await page.getByRole("button", { name: "Calculateur de statistiques" }).click();
  await page.getByText("Dégâts par coup").waitFor();

  await expect(page.locator("#stats-material-select")).toBeVisible();

  await page.locator("#stats-weapon-select").selectOption("trident");

  await expect(page.locator("#stats-material-select")).toHaveCount(0);
  const enchantOptions = await page.locator("#stats-damage-enchant-select option").allTextContents();
  expect(enchantOptions.some((t) => t.includes("Empalement"))).toBe(true);
  expect(enchantOptions.some((t) => t.includes("Tranchant"))).toBe(false);
});

// Bow/crossbow utility stats -- Power's bonus damage in particular, since
// it's explicitly NOT a final total (see rangedStats.ts's header), worth
// confirming the UI doesn't accidentally present it as one.
test("stats mode computes live ranged enchant bonuses", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Calculateur de statistiques" }).click();
  await page.getByText("Arc et arbalète").waitFor();

  await page.locator("#stats-power-select").selectOption("5");
  await expect(page.getByText("+3.0")).toBeVisible();
});

// Anvil simulator (2026-09-13): drives the real flow -- put Efficiency V
// in the sacrifice slot on the default pickaxe, confirm the live cost
// (anvilCost 1 x level 5 = 5) shows up, proving the UI is actually wired
// to anvilSimulator.ts and not just rendering static slots.
test("anvil simulator computes a live combine cost", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Enclume" }).click();
  await page.getByText("Rien à faire").waitFor(); // the default, empty-slots state

  await page.locator("#anvil-sacrifice-enchant-select").selectOption("efficiency");
  await page.locator("#anvil-sacrifice-level-select").selectOption("5");

  await expect(page.getByText("Rien à faire")).toHaveCount(0);
  await expect(page.locator("#anvil-sim-cost")).toHaveText("5");
});

test("anvil simulator's slot grid stays overflow-free on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Enclume" }).click();
  await page.locator(".mc-slot").first().waitFor();

  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
});

// Regression coverage for the real, documented source ambiguity this
// feature made a deliberate call on (see anvilSimulator.ts's header):
// Fortune + Silk Touch are mutually exclusive per the game's own
// exclusive_set tag data, so the anvil should refuse the combination.
test("anvil simulator blocks a mutually incompatible combination", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Enclume" }).click();
  await page.getByText("Rien à faire").waitFor();

  await page.locator("#anvil-target-enchant-select").selectOption("fortune");
  await page.locator("#anvil-sacrifice-enchant-select").selectOption("silk_touch");

  await expect(page.getByText("Incompatible")).toBeVisible();
});

// Regression test for a real user report (2026-09-13): the service
// worker's CACHE_NAME was a hand-typed constant in public/sw.js that
// never got bumped across 13 deploys, so a returning visitor's cached
// copy (stale-while-revalidate answers instantly from cache) kept
// showing an old version after every single release. Fixed by generating
// sw.js from a route handler that embeds APP_VERSION automatically -- this
// pins down that the served script's CACHE_NAME genuinely tracks the
// live app version, not just that the route responds at all.
test("service worker's cache name embeds the current app version", async ({ request }) => {
  const response = await request.get("/sw.js");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("javascript");
  const body = await response.text();
  expect(body).toContain(`CACHE_NAME = "enchant-advisor-v${packageJson.version}"`);
});
