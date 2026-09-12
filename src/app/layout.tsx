import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Cinzel } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "./LocaleContext";
import ServiceWorkerRegister from "./ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display font for headings — a fantasy/RPG serif that reads as "enchanted
// grimoire" rather than a generic app title.
const cinzel = Cinzel({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const SITE_URL = "https://enchant-advisor.vercel.app";
const DESCRIPTION =
  "Recommande les meilleurs enchantements Minecraft à ajouter selon l'objet, ce qui est déjà dessus, et l'objectif visé.";

export const metadata: Metadata = {
  // Resolves the relative image URLs below into absolute ones — required
  // for Open Graph/Twitter previews, which most platforms fetch directly
  // rather than resolving relative to the page.
  metadataBase: new URL(SITE_URL),
  title: "Enchant Advisor",
  description: DESCRIPTION,
  // iOS ignores the web app manifest entirely — these are what actually
  // make "Add to Home Screen" open in standalone (no browser chrome) mode
  // on an iPhone/iPad. Android/desktop Chrome use manifest.ts instead.
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Enchant Advisor",
  },
  // Makes a shared link (the app's own headline feature — see
  // shareLink.ts) actually show a preview when pasted into Discord/
  // Reddit/etc. instead of a bare URL. og-image.png is the app's own
  // sparkle mark (see public/og-image.png's generator script) — no app
  // name baked into the image itself, since Discord/Twitter/etc. already
  // render `title` below as visible text alongside it.
  openGraph: {
    title: "Enchant Advisor",
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Enchant Advisor",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Enchant Advisor",
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
};

// Matches --background's dark value (globals.css) — the color the browser
// UI (Android's toolbar, iOS's status bar area) tints to match the app.
export const viewport: Viewport = {
  themeColor: "#0a0912",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Most of the page is statically pre-rendered and visible without
            JS, but every interaction (item picker, calculations, language
            toggle) needs it — this only shows up with JS actually disabled. */}
        <noscript>
          <div style={{ background: "#7c3aed", color: "#fff", padding: "10px 16px", textAlign: "center", fontSize: 14 }}>
            Cette page a besoin de JavaScript pour fonctionner. / This page requires JavaScript to work.
          </div>
        </noscript>
        <LocaleProvider>{children}</LocaleProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
