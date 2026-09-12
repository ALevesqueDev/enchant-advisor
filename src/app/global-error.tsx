"use client";

// Next's app-dir convention for a crash in the ROOT LAYOUT itself (fonts,
// LocaleProvider, ServiceWorkerRegister) — much rarer than a crash inside
// page.tsx (see error.tsx for that, far more likely, case), but since this
// file *replaces* the whole layout when it triggers, it has to render its
// own <html>/<body> and can't lean on anything from layout.tsx, globals.css
// classes included. Plain inline styles and no context/hooks on purpose —
// this is the last line of defense, so it assumes nothing else works.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0912",
          color: "#f1eef9",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: 420, padding: "0 16px", textAlign: "center" }}>
          <div style={{ fontSize: 32 }}>⚠️</div>
          <p style={{ fontWeight: 600, fontSize: 18, marginTop: 12, marginBottom: 4 }}>Une erreur est survenue</p>
          <p style={{ fontSize: 14, opacity: 0.75, marginTop: 0 }}>Essaie de recharger la page.</p>
          <p style={{ fontWeight: 600, fontSize: 18, marginTop: 16, marginBottom: 4 }}>Something went wrong</p>
          <p style={{ fontSize: 14, opacity: 0.75, marginTop: 0 }}>Try reloading the page.</p>
          <button
            onClick={reset}
            style={{
              marginTop: 16,
              padding: "10px 20px",
              borderRadius: 999,
              border: "none",
              background: "linear-gradient(90deg, #7c3aed, #22d3ee)",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            ↻ Recharger / Reload
          </button>
        </div>
      </body>
    </html>
  );
}
