import { GAME_VERSION, DATA_VERIFIED_DATE } from "@/lib/gameVersion";
import { t } from "@/lib/strings";
import type { Locale } from "@/lib/i18n";

const GITHUB_ISSUES_URL = "https://github.com/ALevesqueDev/enchant-advisor/issues/new";

export default function Footer({ locale }: { locale: Locale }) {
  return (
    <footer className="mt-16 border-t border-[var(--surface-border)] pt-6 text-xs text-muted">
      <p>
        {t("footerVersionPrefix", locale)} <span className="font-medium text-foreground">{GAME_VERSION}</span>{" "}
        {t("footerVersionSuffix", locale)} {DATA_VERIFIED_DATE}. {t("footerVersionNote", locale)}
      </p>
      <div className="mt-3">
        <a href={GITHUB_ISSUES_URL} target="_blank" rel="noreferrer" className="hover:text-foreground">
          {t("footerReportLink", locale)}
        </a>
      </div>
      <p className="mt-3">
        © {new Date().getFullYear()} {t("footerRights", locale)}
      </p>
    </footer>
  );
}
