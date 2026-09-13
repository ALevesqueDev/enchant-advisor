import { defineConfig } from "vitest/config";
import path from "node:path";

// Deliberately minimal — no jsdom, no plugins. Every file under test here
// is plain TypeScript with no React/DOM dependency (recommend.ts, anvil.ts,
// tableOdds.ts, shareLink.ts), so the default Node environment is enough
// and keeps this a dev-only dependency with nothing extra to maintain.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    // e2e/*.spec.ts are Playwright tests (npm run test:e2e) — Vitest's
    // default include glob matches *.spec.ts too, and picking them up
    // here crashes since Playwright's test() API isn't Vitest's.
    exclude: ["**/node_modules/**", "e2e/**"],
  },
});
