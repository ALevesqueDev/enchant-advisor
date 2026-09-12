"use client";

import { useState } from "react";
import { t } from "@/lib/strings";
import type { Locale } from "@/lib/i18n";

/**
 * Copies the current page URL to the clipboard. Nothing needs to be built
 * here — page.tsx / SearchMode.tsx already keep the URL's query string in
 * sync with the live selection via shareLink.ts's patchShareParams(), so
 * "share this" is just "hand someone the address bar".
 */
export default function CopyLinkButton({ locale }: { locale: Locale }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (permissions, insecure context) — the
      // user can still select the address bar manually, nothing to do here.
    }
  }

  return (
    <button
      onClick={copyLink}
      // aria-live announces the "copied" confirmation to screen readers
      // without needing focus to move — otherwise the only feedback is the
      // visible text swap, which a screen reader user wouldn't get at all.
      aria-live="polite"
      className="panel rounded-full px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
    >
      {copied ? t("shareCopied", locale) : t("shareCopyLink", locale)}
    </button>
  );
}
