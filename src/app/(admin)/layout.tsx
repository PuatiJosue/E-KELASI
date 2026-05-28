import { LangProvider } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { AdminSidebar } from "@/components/admin/Sidebar";
import { AdminTopbar } from "@/components/admin/Topbar";
import { TweaksPanel } from "@/components/admin/TweaksPanel";
import { CommandPalette } from "@/components/admin/CommandPalette";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const lang = getLang();

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
        <AdminSidebar />
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          <AdminTopbar />
          <div
            className="ek-scroll"
            style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}
          >
            {children}
          </div>
        </div>
      </div>
      <TweaksPanel />
      <CommandPalette />
    </LangProvider>
  );
}
