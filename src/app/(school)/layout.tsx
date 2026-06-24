import { LangProvider } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { Shell } from "@/components/Shell";
import { SchoolSidebar } from "@/components/school/Sidebar";
import { SchoolTopbar } from "@/components/school/Topbar";
import { getMySchool } from "@/lib/school-db";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";
import { SuspendedNotice } from "@/components/SuspendedNotice";

export const dynamic = "force-dynamic";

async function getUserName(): Promise<string | undefined> {
  if (!isLiveMode()) return undefined;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return undefined;
  const { data } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  return data?.full_name ?? undefined;
}

export default async function SchoolLayout({ children }: { children: React.ReactNode }) {
  const [school, userName] = await Promise.all([getMySchool(), getUserName()]);
  const lang = getLang();

  // École suspendue (abonnement E-KLASS impayé) → accès direction bloqué.
  if (school?.status === "suspended") {
    return (
      <LangProvider value={lang}>
        <SuspendedNotice />
      </LangProvider>
    );
  }

  // Branding : si l'école a une couleur custom, on l'applique sur tout le shell,
  // y compris les nuances dérivées (boutons, puces, accents, tableau de bord).
  const c = school?.brandColor;
  const brandStyle = c
    ? ({
        ["--brand" as string]: c,
        ["--brand-600" as string]: `color-mix(in srgb, ${c} 82%, #000)`,
        ["--brand-700" as string]: `color-mix(in srgb, ${c} 65%, #000)`,
        ["--brand-100" as string]: `color-mix(in srgb, ${c} 22%, #fff)`,
        ["--brand-50" as string]: `color-mix(in srgb, ${c} 10%, #fff)`,
        ["--brand-soft" as string]: `color-mix(in srgb, ${c} 12%, transparent)`,
      } as React.CSSProperties)
    : undefined;

  return (
    <LangProvider value={lang}>
      <Shell
        sidebar={<SchoolSidebar school={school} userName={userName} />}
        topbar={<SchoolTopbar school={school} />}
        sidebarWidth={240}
        style={brandStyle}
      >
        {children}
      </Shell>
    </LangProvider>
  );
}
