import { test, expect } from "@playwright/test";

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
