import type { Metadata } from "next";
import { Hanken_Grotesk, Fraunces, IBM_Plex_Mono } from "next/font/google";

import "./globals.css";

// UI / corps — humaniste, calme, lisible (nav, formulaires, tableaux, boutons).
const sans = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
// Display — serif doux pour les titres de page et le hero (gravité + chaleur).
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
// Données — numéros de facture et identifiants uniquement (touche « grand livre »).
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Payback — Relance amiable d'impayés",
    template: "%s · Payback",
  },
  description:
    "Payback aide les indépendants et petites structures à relancer leurs factures impayées de façon amiable et automatisée.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${sans.variable} ${display.variable} ${mono.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
