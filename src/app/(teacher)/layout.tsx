import { LangProvider } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { Shell } from "@/components/Shell";
import { TeacherSidebar } from "@/components/teacher/Sidebar";
import { TeacherTopbar } from "@/components/teacher/Topbar";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const lang = getLang();

  return (
    <LangProvider value={lang}>
      <Shell sidebar={<TeacherSidebar />} topbar={<TeacherTopbar />} sidebarWidth={232}>
        {children}
      </Shell>
    </LangProvider>
  );
}
