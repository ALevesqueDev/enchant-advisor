"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";

const LocaleCtx = createContext<{ locale: Locale; setLocale: (l: Locale) => void }>({
  locale: "fr",
  setLocale: () => {},
});

const STORAGE_KEY = "enchant-advisor-locale";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");

  useEffect(() => {
    // One-time hydration of a persisted preference on mount, not a reaction
    // to a prop/state change — SSR always renders "fr" (there's no request
    // context to read a preference from), then this corrects it client-side
    // once localStorage is reachable.
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored === "en" || stored === "fr") setLocaleState(stored);
    } catch {
      // localStorage unavailable (private browsing, etc.) — default stays "fr".
    }
  }, []);

  // Keep the <html lang> attribute honest for screen readers/browser
  // translate prompts — the initial SSR value is always "fr" (see above).
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function setLocale(l: Locale) {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // Non-fatal — the choice just won't persist across visits.
    }
  }

  return <LocaleCtx.Provider value={{ locale, setLocale }}>{children}</LocaleCtx.Provider>;
}

export function useLocale() {
  return useContext(LocaleCtx);
}
