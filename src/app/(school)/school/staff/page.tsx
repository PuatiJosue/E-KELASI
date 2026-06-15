import { PageHeader } from "@/components/KPI";
import { listStaff } from "@/lib/staff-db";
import { StaffManager } from "./StaffManager";

export default async function SchoolStaff() {
  const staff = await listStaff();
  const active = staff.filter((s) => s.status === "active").length;

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Personnel", en: "Staff" }}
        sub={{
          fr: `${staff.length} membre(s) · ${active} actif(s)`,
          en: `${staff.length} member(s) · ${active} active`,
        }}
      />
      <StaffManager staff={staff} />
    </div>
  );
}
