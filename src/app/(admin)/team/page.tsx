import { PageHeader } from "@/components/KPI";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";
import { TeamManager, type Member } from "@/components/admin/TeamManager";

async function getTeam(): Promise<Member[]> {
  if (!isLiveMode()) {
    return [
      { id: "demo", name: "Super Admin", email: "admin@ekelasi.demo", phone: "", address: "", since: "—", documents: [] },
    ];
  }
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, address, created_at")
    .eq("role", "super_admin")
    .order("created_at", { ascending: true });

  const members = data ?? [];
  const ids = members.map((m) => m.id);
  const { data: docs } = ids.length
    ? await (supabase as any)
        .from("profile_documents")
        .select("id, profile_id, name, url, created_at")
        .in("profile_id", ids)
        .order("created_at", { ascending: false })
    : { data: [] as any[] };

  return members.map((m) => ({
    id: m.id,
    name: m.full_name,
    email: m.email,
    phone: m.phone ?? "",
    address: m.address ?? "",
    since: new Date(m.created_at).toLocaleDateString("fr-FR", { month: "short", year: "numeric" }),
    documents: (docs ?? [])
      .filter((d: any) => d.profile_id === m.id)
      .map((d: any) => ({ id: d.id, name: d.name, url: d.url })),
  }));
}

export default async function TeamPage() {
  const team = await getTeam();
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Équipe E-KELASI", en: "E-KELASI team" }}
        sub={{
          fr: `${team.length} super admin${team.length > 1 ? "s" : ""} · ajoutez des membres, modifiez leurs infos, attachez des documents`,
          en: `${team.length} super admin${team.length > 1 ? "s" : ""} · add members, edit info, attach documents`,
        }}
      />
      <TeamManager team={team} />
    </div>
  );
}
