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
  },
});
