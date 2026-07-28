import { LangProvider } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { Shell } from "@/components/Shell";
import { TeacherSidebar } from "@/components/teacher/Sidebar";
import { TeacherTopbar } from "@/components/teacher/Topbar";
import { getTeacherSchoolStatus, getTeacherProfile } from "@/lib/teacher/profile";
import { SuspendedNotice } from "@/components/SuspendedNotice";

export const dynamic = "force-dynamic";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const lang = getLang();

  const [status, profile] = await Promise.all([
    getTeacherSchoolStatus(),
    getTeacherProfile(),
  ]);

  // École suspendue (abonnement E-KLASS impayé) → accès prof bloqué.
  if (status === "suspended") {
    return (
      <LangProvider value={lang}>
        <SuspendedNotice />
      </LangProvider>
    );
  }

  return (
    <LangProvider value={lang}>
      <Shell
        sidebar={<TeacherSidebar name={profile?.name} avatarUrl={profile?.avatarUrl} />}
        topbar={<TeacherTopbar />}
        sidebarWidth={232}
      >
        {children}
      </Shell>
    </LangProvider>
  );
}
