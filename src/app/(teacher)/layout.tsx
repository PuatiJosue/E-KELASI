import { LangProvider } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { Shell } from "@/components/Shell";
import { TeacherSidebar } from "@/components/teacher/Sidebar";
import { TeacherTopbar } from "@/components/teacher/Topbar";
import { getTeacherSchoolStatus } from "@/lib/teacher-db";
import { SuspendedNotice } from "@/components/SuspendedNotice";

export const dynamic = "force-dynamic";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const lang = getLang();

  // École suspendue (abonnement E-KELASI impayé) → accès prof bloqué.
  if ((await getTeacherSchoolStatus()) === "suspended") {
    return (
      <LangProvider value={lang}>
        <SuspendedNotice />
      </LangProvider>
    );
  }

  return (
    <LangProvider value={lang}>
      <Shell sidebar={<TeacherSidebar />} topbar={<TeacherTopbar />} sidebarWidth={232}>
        {children}
      </Shell>
    </LangProvider>
  );
}
