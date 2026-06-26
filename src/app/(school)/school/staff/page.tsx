import { PageHeader } from "@/components/KPI";
import { listStaff } from "@/lib/staff-db";
import { listAssignments, listFormOptions } from "@/lib/courses-db";
import { StaffManager } from "./StaffManager";

export default async function SchoolStaff() {
  const [staff, assignments, formOptions] = await Promise.all([
    listStaff(),
    listAssignments(),
    listFormOptions(),
  ]);
  const active = staff.filter((s) => s.status === "active").length;

  // Cours regroupés par membre, pour pré-remplir la fiche en édition.
  const coursesByStaff: Record<string, { subjectName: string; className: string; option: string; weeklyHours: number }[]> = {};
  for (const a of assignments) {
    (coursesByStaff[a.staffId] ||= []).push({
      subjectName: a.subjectName,
      className: a.className,
      option: a.option ?? "",
      weeklyHours: a.weeklyHours,
    });
  }

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Personnel", en: "Staff" }}
        sub={{
          fr: `${staff.length} membre(s) · ${active} actif(s)`,
          en: `${staff.length} member(s) · ${active} active`,
        }}
      />
      <StaffManager
        staff={staff}
        coursesByStaff={coursesByStaff}
        subjectOptions={formOptions.subjects.map((s) => s.name)}
        classOptions={formOptions.classes}
        optionOptions={formOptions.options}
      />
    </div>
  );
}
