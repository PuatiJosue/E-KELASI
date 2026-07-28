import { redirect } from "next/navigation";
import { LangProvider } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { Shell } from "@/components/Shell";
import { SurveillantSidebar } from "@/components/surveillant/Sidebar";
import { SurveillantTopbar } from "@/components/surveillant/Topbar";
import { getSurveillantContext } from "@/lib/surveillant-db";
import { isLiveMode } from "@/lib/env";
import { SuspendedNotice } from "@/components/SuspendedNotice";

export const dynamic = "force-dynamic";

export default async function SurveillantLayout({ children }: { children: React.ReactNode }) {
  const lang = getLang();
  const ctx = await getSurveillantContext();

  // Compte sans fiche surveillant rattachée → rien à afficher ici.
  if (isLiveMode() && !ctx) redirect("/login");

  // École suspendue (abonnement E-KLASS impayé) → accès bloqué, comme pour les profs.
  if (ctx?.schoolStatus === "suspended") {
    return (
      <LangProvider value={lang}>
        <SuspendedNotice />
      </LangProvider>
    );
  }

  return (
    <LangProvider value={lang}>
      <Shell
        sidebar={<SurveillantSidebar name={ctx?.name} avatarUrl={ctx?.avatarUrl} schoolName={ctx?.schoolName} />}
        topbar={<SurveillantTopbar schoolName={ctx?.schoolName} />}
        sidebarWidth={232}
      >
        {children}
      </Shell>
    </LangProvider>
  );
}
