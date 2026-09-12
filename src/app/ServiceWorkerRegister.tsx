"use client";

import { useEffect } from "react";

/**
 * Registers public/sw.js once the app has loaded in the browser. Renders
 * nothing — this is a side-effect-only component, kept separate from
 * LocaleProvider/page.tsx so it's obvious at a glance in layout.tsx what
 * it's for.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Non-fatal — the app works fully online without it, this only
        // loses the offline/installed-app benefits.
      });
    }
  }, []);

  return null;
}
