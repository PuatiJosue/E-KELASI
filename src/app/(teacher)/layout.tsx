import { LangProvider } from "@/lib/i18n";
import { TeacherSidebar } from "@/components/teacher/Sidebar";
import { TeacherTopbar } from "@/components/teacher/Topbar";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const lang = "fr" as const;

  return (
    <LangProvider value={lang}>
      <div
        className="ek-app"
        style={{
          width: "100vw",
          height: "100vh",
          display: "grid",
          gridTemplateColumns: "232px 1fr",
          overflow: "hidden",
          background: "var(--bg)",
        }}
      >
        <TeacherSidebar />
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          <TeacherTopbar />
          <div className="ek-scroll" style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>
            {children}
          </div>
        </div>
      </div>
    </LangProvider>
  );
}
