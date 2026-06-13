import { LangProvider } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { Shell } from "@/components/Shell";
import { SchoolSidebar } from "@/components/school/Sidebar";
import { SchoolTopbar } from "@/components/school/Topbar";
import { getMySchool } from "@/lib/school-db";
import { SuspendedNotice } from "@/components/SuspendedNotice";

export const dynamic = "force-dynamic";

export default async function SchoolLayout({ children }: { children: React.ReactNode }) {
  const school = await getMySchool();
  const lang = getLang();

  // École suspendue (abonnement E-KELASI impayé) → accès direction bloqué.
  if (school?.status === "suspended") {
    return (
      <LangProvider value={lang}>
        <SuspendedNotice />
      </LangProvider>
    );
  }

  // Branding : si l'école a une couleur custom, on l'applique sur tout le shell.
  const brandStyle = school?.brandColor
    ? ({ ["--brand" as string]: school.brandColor } as React.CSSProperties)
    : undefined;

  return (
    <LangProvider value={lang}>
      <Shell
        sidebar={<SchoolSidebar school={school} />}
        topbar={<SchoolTopbar school={school} />}
        sidebarWidth={240}
        style={brandStyle}
      >
        {children}
      </Shell>
    </LangProvider>
  );
}
