import { PageHeader } from "@/components/KPI";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { listSchools } from "@/lib/db";
import { SchoolsTable } from "@/components/admin/SchoolsTable";
import { InviteSchoolButton } from "@/components/admin/InviteSchoolModal";

export default async function SchoolsPage() {
  const rows = await listSchools();
  const counts = {
    all: rows.length,
    active: rows.filter((r) => r.status === "active").length,
    onboarding: rows.filter((r) => r.status === "onboarding").length,
    trial: rows.filter((r) => r.status === "trial").length,
    suspended: rows.filter((r) => r.status === "suspended").length,
  };

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Écoles partenaires", en: "Partner schools" }}
        sub={{
          fr: `${counts.active} écoles actives · ${counts.onboarding} en onboarding · ${counts.trial} en essai`,
          en: `${counts.active} active · ${counts.onboarding} onboarding · ${counts.trial} trial`,
        }}
        right={
          <>
            <button className="ek-btn ek-btn-outline" style={{ height: 32, fontSize: 12 }}>
              <Icon name="download" size={13} /> CSV
            </button>
            <InviteSchoolButton />
          </>
        }
      />

      <SchoolsTable rows={rows} counts={counts} />
    </div>
  );
}
