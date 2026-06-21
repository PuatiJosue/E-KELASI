import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "E-KLASS — Suivi scolaire",
  description: "E-KLASS — la plateforme de suivi scolaire qui relie écoles, professeurs et parents.",
};

export const viewport: Viewport = {
  themeColor: "#1E2F6D",
};

// Applique le thème choisi (clair/sombre/auto) avant le premier rendu pour
// éviter tout clignotement. Préférence stockée dans localStorage (ek-appearance).
const THEME_SCRIPT = `(function(){try{var p=localStorage.getItem('ek-appearance')||'auto';var dark=p==='dark'||(p==='auto'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',dark?'dark':'light');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-theme="light" data-card-style="default" data-font="bricolage">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
