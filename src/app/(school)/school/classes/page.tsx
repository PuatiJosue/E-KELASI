import { PageHeader } from "@/components/KPI";
import { getClassDirectory, listSchoolTeachers } from "@/lib/school-db";
import { listAssignments, listFormOptions } from "@/lib/courses-db";
import { ClassesTabs } from "./ClassesTabs";

export default async function SchoolClasses() {
  const [{ rows, totalStudents, totalTeachers }, teachers, assignments, options] = await Promise.all([
    getClassDirectory(),
    listSchoolTeachers(),
    listAssignments(),
    listFormOptions(),
  ]);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Rapport global des classes", en: "Class report" }}
        sub={{
          fr: `${totalStudents} élèves · ${totalTeachers} enseignants · ${rows.length} classes`,
          en: `${totalStudents} students · ${totalTeachers} teachers · ${rows.length} classes`,
        }}
      />
      <ClassesTabs
        rows={rows}
        totalStudents={totalStudents}
        totalTeachers={totalTeachers}
        teachers={teachers}
        assignments={assignments}
        options={options}
      />
    </div>
  );
}
