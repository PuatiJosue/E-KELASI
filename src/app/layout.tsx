import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "E-KELASI — Console admin",
  description: "Plateforme de suivi scolaire — console super admin.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-theme="light" data-card-style="default" data-font="bricolage">
      <body>{children}</body>
    </html>
  );
}
