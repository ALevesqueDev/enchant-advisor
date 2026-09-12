"use client";

import Link from "next/link";
import { t } from "@/lib/strings";
import { useLocale } from "./LocaleContext";

// Next's app-dir file convention: rendered for any URL that doesn't
// match a route. Still nested inside layout.tsx (LocaleProvider
// included), unlike error.tsx/global-error.tsx which deliberately avoid
// depending on that — this isn't a crash, just a normal "no match", so
// there's nothing to be defensive about here.
export default function NotFound() {
  const { locale } = useLocale();

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <span className="text-3xl" aria-hidden="true">
        🧭
      </span>
      <div>
        <p className="font-display text-lg font-semibold">{t("notFoundTitle", locale)}</p>
        <p className="mt-1 text-sm text-muted">{t("notFoundBody", locale)}</p>
      </div>
      <Link href="/" className="accent-gradient mt-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm">
        {t("notFoundBackHome", locale)}
      </Link>
    </div>
  );
}
