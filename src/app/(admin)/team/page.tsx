import { PageHeader } from "@/components/KPI";
import { Avatar } from "@/components/Avatar";
import { T } from "@/lib/i18n";

const TEAM = [
  { name: "Yann Mbaye",        email: "yann@e-kelasi.com",   role: "Super Admin",   lastSeen: "À l'instant" },
  { name: "Awa Diop",          email: "awa@e-kelasi.com",    role: "Support Lead",  lastSeen: "Il y a 14 min" },
  { name: "Marc Dubois",       email: "marc@e-kelasi.com",   role: "Sales",         lastSeen: "Il y a 2 h" },
  { name: "Léa Martin",        email: "lea@e-kelasi.com",    role: "Engineering",   lastSeen: "Il y a 1 h" },
  { name: "Karim Ndiaye",      email: "karim@e-kelasi.com",  role: "Engineering",   lastSeen: "Hier" },
  { name: "Sophie Tremblay",   email: "sophie@e-kelasi.com", role: "Onboarding",    lastSeen: "Il y a 30 min" },
];

export default function TeamPage() {
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Équipe E-KELASI", en: "E-KELASI team" }}
        sub={{
          fr: `${TEAM.length} membres · 1 super admin · 5 collaborateurs`,
          en: `${TEAM.length} members · 1 super admin · 5 collaborators`,
        }}
        right={
          <button className="ek-btn ek-btn-primary" style={{ height: 32, fontSize: 12 }}>
            <T fr="Inviter un membre" en="Invite member" />
          </button>
        }
      />

      <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 2fr 1fr 1fr 0.5fr",
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
          <div><T fr="Rôle" en="Role" /></div>
          <div><T fr="Vu" en="Last seen" /></div>
          <div></div>
        </div>
        {TEAM.map((m, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 2fr 1fr 1fr 0.5fr",
              padding: "14px 18px",
              alignItems: "center",
              fontSize: 12.5,
              borderBottom: i < TEAM.length - 1 ? "1px solid var(--divider)" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar name={m.name} size={32} />
              <span style={{ fontWeight: 600, color: "var(--ink)" }}>{m.name}</span>
            </div>
            <div style={{ color: "var(--ink-2)" }}>{m.email}</div>
            <div>
              <span className={`ek-chip ${m.role === "Super Admin" ? "brand" : ""}`}>{m.role}</span>
            </div>
            <div style={{ color: "var(--ink-3)" }}>{m.lastSeen}</div>
            <div></div>
          </div>
        ))}
      </div>
    </div>
  );
}
