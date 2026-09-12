"use client";

import { GAME_VERSION, DATA_VERIFIED_DATE } from "@/lib/gameVersion";
import { t } from "@/lib/strings";
import type { Locale } from "@/lib/i18n";

const GITHUB_NEW_ISSUE_URL = "https://github.com/ALevesqueDev/enchant-advisor/issues/new";

/**
 * Pre-fills the GitHub issue body with the exact current state instead of
 * opening a blank form. The page's own URL already encodes the whole
 * selection (shareLink.ts's shareable-builds feature), so this turns
 * every bug report into an exact repro instead of "it didn't work,
 * IDK what I had selected". Built fresh at click time (not on mount, not
 * via an effect) so it always reflects whatever's on screen right then,
 * with no extra state or re-render to keep in sync.
 */
function buildBugReportUrl(locale: Locale): string {
  const body = [
    `**Link (exact state):** ${window.location.href}`,
    `**Language:** ${locale}`,
    `**Game version:** ${GAME_VERSION} (data verified ${DATA_VERIFIED_DATE})`,
    `**Browser:** ${navigator.userAgent}`,
    "",
    "**What happened:**",
    "",
    "**What you expected instead:**",
  ].join("\n");
  return `${GITHUB_NEW_ISSUE_URL}?${new URLSearchParams({ body }).toString()}`;
}

export default function Footer({ locale }: { locale: Locale }) {
  function handleReportClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    window.open(buildBugReportUrl(locale), "_blank", "noopener,noreferrer");
  }

  return (
    <footer className="mt-16 border-t border-[var(--surface-border)] pt-6 text-xs text-muted">
      <p>
        {t("footerVersionPrefix", locale)} <span className="font-medium text-foreground">{GAME_VERSION}</span>{" "}
        {t("footerVersionSuffix", locale)} {DATA_VERIFIED_DATE}. {t("footerVersionNote", locale)}
      </p>
      <div className="no-print mt-3">
        {/* href is a working (just unprefilled) fallback for no-JS/before hydration; onClick upgrades it with the live state. */}
        <a
          href={GITHUB_NEW_ISSUE_URL}
          onClick={handleReportClick}
          target="_blank"
          rel="noreferrer"
          className="hover:text-foreground"
        >
          {t("footerReportLink", locale)} <span className="sr-only">{t("opensInNewTab", locale)}</span>
        </a>
      </div>
      <p className="mt-3">
        © {new Date().getFullYear()} {t("footerRights", locale)}
      </p>
    </footer>
  );
}
