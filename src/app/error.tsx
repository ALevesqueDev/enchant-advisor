"use client";

// Next's app-dir file convention: automatically wraps page.tsx (and
// everything under it) in an error boundary. Catches a render-time crash
// here instead of the user getting a blank white screen — the most likely
// trigger is a corrupted/hand-edited share link that slips past
// shareLink.ts's validation into some state the UI doesn't expect.
//
// Deliberately self-contained (no useLocale(), no shared components):
// an error boundary should assume as little as possible about the rest
// of the app still working, so the copy is hardcoded bilingual rather
// than routed through the locale system that (however unlikely) could be
// part of what broke. See global-error.tsx for the root-layout-level
// equivalent of this file.
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <span className="text-3xl">⚠️</span>
      <div>
        <p className="font-display text-lg font-semibold">Une erreur est survenue</p>
        <p className="mt-1 text-sm text-muted">
          Essaie de recharger — si ça persiste, signale-le via le lien &laquo;&nbsp;Report a bug&nbsp;&raquo; en bas
          de page.
        </p>
      </div>
      <div>
        <p className="font-display text-lg font-semibold">Something went wrong</p>
        <p className="mt-1 text-sm text-muted">
          Try reloading — if it keeps happening, report it via the &ldquo;Report a bug&rdquo; link at the bottom of
          the page.
        </p>
      </div>
      <button onClick={reset} className="accent-gradient mt-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm">
        ↻ Recharger / Reload
      </button>
    </div>
  );
}
