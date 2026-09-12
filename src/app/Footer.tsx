import { GAME_VERSION, DATA_VERIFIED_DATE } from "@/lib/gameVersion";

const GITHUB_ISSUES_URL = "https://github.com/ALevesqueDev/enchant-advisor/issues/new";
const CONTACT_EMAIL = "andrelevesquepro@gmail.com";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--surface-border)] pt-6 text-xs text-muted">
      <p>
        Basé sur Minecraft Java <span className="font-medium text-foreground">{GAME_VERSION}</span> — données
        vérifiées le {DATA_VERIFIED_DATE}. Les enchantements changent parfois d&apos;une version à l&apos;autre ;
        signale un écart si tu en vois un.
      </p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        <a href={GITHUB_ISSUES_URL} target="_blank" rel="noreferrer" className="hover:text-foreground">
          🐙 Signaler un bug / suggérer une amélioration
        </a>
        <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-foreground">
          ✉️ {CONTACT_EMAIL}
        </a>
      </div>
    </footer>
  );
}
