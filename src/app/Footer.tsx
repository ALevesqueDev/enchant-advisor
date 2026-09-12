import { GAME_VERSION, DATA_VERIFIED_DATE } from "@/lib/gameVersion";

const GITHUB_ISSUES_URL = "https://github.com/ALevesqueDev/enchant-advisor/issues/new";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--surface-border)] pt-6 text-xs text-muted">
      <p>
        Basé sur Minecraft Java <span className="font-medium text-foreground">{GAME_VERSION}</span> — données
        vérifiées le {DATA_VERIFIED_DATE}. Les enchantements changent parfois d&apos;une version à l&apos;autre ;
        signale un écart si tu en vois un.
      </p>
      <div className="mt-3">
        <a href={GITHUB_ISSUES_URL} target="_blank" rel="noreferrer" className="hover:text-foreground">
          🐙 Signaler un bug / suggérer une amélioration
        </a>
      </div>
      <p className="mt-3">© {new Date().getFullYear()} — code source visible à titre informatif, tous droits réservés.</p>
    </footer>
  );
}
