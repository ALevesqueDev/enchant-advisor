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

export const metadata: Metadata = {
  title: "Enchant Advisor",
  description: "Recommande les meilleurs enchantements Minecraft à ajouter selon l'objet, ce qui est déjà dessus, et l'objectif visé.",
  // iOS ignores the web app manifest entirely — these are what actually
  // make "Add to Home Screen" open in standalone (no browser chrome) mode
  // on an iPhone/iPad. Android/desktop Chrome use manifest.ts instead.
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Enchant Advisor",
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
        <LocaleProvider>{children}</LocaleProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
