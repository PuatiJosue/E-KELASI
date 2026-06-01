import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "E-KELASI — Suivi scolaire",
  description: "E-KELASI — la plateforme de suivi scolaire qui relie écoles, professeurs et parents.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-theme="light" data-card-style="default" data-font="bricolage">
      <body>{children}</body>
    </html>
  );
}
