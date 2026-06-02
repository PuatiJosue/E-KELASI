import { PageHeader } from "@/components/KPI";
import { Avatar } from "@/components/Avatar";
import { T } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";

type Member = { name: string; email: string; since: string };

async function getTeam(): Promise<Member[]> {
  if (!isLiveMode()) {
    return [{ name: "Super Admin", email: "admin@ekelasi.demo", since: "—" }];
  }
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name, email, created_at")
    .eq("role", "super_admin")
    .order("created_at", { ascending: true });
  return (data ?? []).map((m) => ({
    name: m.full_name,
    email: m.email,
    since: new Date(m.created_at).toLocaleDateString("fr-FR", { month: "short", year: "numeric" }),
  }));
}

export default async function TeamPage() {
  const team = await getTeam();

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Équipe E-KELASI", en: "E-KELASI team" }}
        sub={{
          fr: `${team.length} super admin${team.length > 1 ? "s" : ""}`,
          en: `${team.length} super admin${team.length > 1 ? "s" : ""}`,
        }}
      />

      <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="ek-tablewrap">
          <div style={{ minWidth: 560 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 2fr 1fr",
                padding: "12px 18px",
                fontSize: 11,
                fontWeight: 700,
                color: "var(--ink-3)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                background: "var(--surface-2)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div><T fr="Membre" en="Member" /></div>
              <div><T fr="Email" en="Email" /></div>
              <div><T fr="Depuis" en="Since" /></div>
            </div>
            {team.length === 0 ? (
              <div style={{ padding: "24px 18px", textAlign: "center", fontSize: 12.5, color: "var(--ink-3)" }}>
                <T fr="Aucun membre." en="No member." />
              </div>
            ) : (
              team.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 2fr 1fr",
                    padding: "14px 18px",
                    alignItems: "center",
                    fontSize: 12.5,
                    borderBottom: i < team.length - 1 ? "1px solid var(--divider)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={m.name} size={32} />
                    <span style={{ fontWeight: 600, color: "var(--ink)" }}>{m.name}</span>
                  </div>
                  <div style={{ color: "var(--ink-2)" }}>{m.email}</div>
                  <div style={{ color: "var(--ink-3)" }}>{m.since}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
