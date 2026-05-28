import { LangProvider } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { SchoolSidebar } from "@/components/school/Sidebar";
import { SchoolTopbar } from "@/components/school/Topbar";
import { getMySchool } from "@/lib/school-db";

export default async function SchoolLayout({ children }: { children: React.ReactNode }) {
  const school = await getMySchool();
  const lang = getLang();

  return (
    <LangProvider value={lang}>
      <div
        className="ek-app"
        style={{
          width: "100vw",
          height: "100vh",
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          overflow: "hidden",
          background: "var(--bg)",
          // Branding : si l'école a une couleur custom, on l'applique
          ...(school?.brandColor ? ({ ["--brand" as any]: school.brandColor } as React.CSSProperties) : {}),
        }}
      >
        <SchoolSidebar school={school} />
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          <SchoolTopbar school={school} />
          <div className="ek-scroll" style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>
            {children}
          </div>
        </div>
      </div>
    </LangProvider>
  );
}
