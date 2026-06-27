import { PageHeader } from "@/components/KPI";
import { getClassDirectory, listSchoolTeachers, getClassReportMatrix } from "@/lib/school-db";
import { listAssignments, listFormOptions } from "@/lib/courses-db";
import { ClassesTabs } from "./ClassesTabs";

export default async function SchoolClasses() {
  const [{ rows, totalStudents, totalTeachers }, teachers, assignments, options, matrix] = await Promise.all([
    getClassDirectory(),
    listSchoolTeachers(),
    listAssignments(),
    listFormOptions(),
    getClassReportMatrix(),
  ]);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Rapport global de l'école", en: "School report" }}
        sub={{
          fr: "Taux de réussite par option et niveau, du primaire aux humanités.",
          en: "Success rate by option and level, from primary to secondary.",
        }}
      />
      <ClassesTabs
        rows={rows}
        totalStudents={totalStudents}
        totalTeachers={totalTeachers}
        teachers={teachers}
        assignments={assignments}
        options={options}
        matrix={matrix}
      />
    </div>
  );
}
