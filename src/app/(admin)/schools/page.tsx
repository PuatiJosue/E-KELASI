import { PageHeader } from "@/components/KPI";
import { getSchoolsAdminOverview } from "@/lib/admin/schools";
import { SchoolsDashboard } from "@/components/admin/SchoolsDashboard";

export default async function SchoolsPage() {
  const data = await getSchoolsAdminOverview();

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Écoles partenaires", en: "Partner schools" }}
        sub={{
          fr: "Vue d'ensemble de toutes les écoles et de leur activité sur la plateforme.",
          en: "Overview of all schools and their activity on the platform.",
        }}
      />
      <SchoolsDashboard data={data} />
    </div>
  );
}
