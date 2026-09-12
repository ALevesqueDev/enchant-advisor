"use client";

import { useEffect, useState } from "react";
import { t } from "@/lib/strings";
import type { Locale } from "@/lib/i18n";

/**
 * The service worker (public/sw.js, PWA support roadmap item) already
 * makes the app keep working with no connection by serving its cache —
 * this just tells the user that's what's happening, instead of leaving
 * them wondering why a "Calculate" they just ran might be using a stale
 * cached page. `navigator.onLine` isn't available during the static
 * build's server-side prerender, so this defaults to "online" there (same
 * hydrate-after-mount pattern as LocaleContext's localStorage read) and
 * corrects itself immediately once mounted in a real browser.
 */
export default function OfflineBanner({ locale }: { locale: Locale }) {
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="no-print mb-4 rounded-lg px-4 py-2 text-center text-xs font-medium"
      style={{ background: "var(--status-upgrade-bg)", color: "var(--status-upgrade-fg)" }}
    >
      {t("offlineBanner", locale)}
    </div>
  );
}
