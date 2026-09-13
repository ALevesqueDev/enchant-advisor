import type { MetadataRoute } from "next";

// Next's app-dir file convention: this is auto-served at
// /manifest.webmanifest and auto-linked from every page's <head> — no
// manual <link rel="manifest"> needed. See PROJECT.md's PWA roadmap entry
// and src/app/sw.js/route.ts (the offline service worker this pairs with).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Enchant Advisor",
    short_name: "Enchant Advisor",
    description:
      "Recommande les meilleurs enchantements Minecraft Java à ajouter selon l'objet, ce qui est déjà dessus, et l'objectif visé.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0912",
    theme_color: "#0a0912",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
