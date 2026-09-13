import { defineConfig, devices } from "@playwright/test";

// Deliberately minimal: one project (Chromium), one job — this exists to
// catch layout/rendering bugs that Vitest's unit tests structurally can't
// (they never touch a real DOM/CSS engine), not to be a full
// cross-browser matrix. See e2e/responsive.spec.ts's header for the real
// bug this setup caught on day one.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Builds and serves the real production output (not `next dev`) — the
  // bug this suite exists for reproduced identically in both, but the
  // production build is what users actually get.
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
