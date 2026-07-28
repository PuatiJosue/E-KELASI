import { PageHeader } from "@/components/KPI";
import { listStudentsForAttendanceOf, getStudentAttendanceForDateOf } from "@/lib/attendance-db";
import { getSurveillantContext } from "@/lib/surveillant-db";
import { StudentAttendanceManager } from "@/components/school/StudentAttendanceManager";
import { setStudentAttendanceBySurveillant } from "./actions";

export default async function SurveillantPresences({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const today = new Date().toISOString().slice(0, 10);
  const date = searchParams.date || today;

  const ctx = await getSurveillantContext();
  const [students, attendance] = await Promise.all([
    listStudentsForAttendanceOf(ctx?.schoolId ?? ""),
    getStudentAttendanceForDateOf(ctx?.schoolId ?? "", date),
  ]);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Présences des élèves", en: "Student attendance" }}
        sub={{
          fr: "Sélectionnez la classe, pointez chaque élève, puis exportez la liste en Excel ou PDF.",
          en: "Select the class, mark each student, then export the list as Excel or PDF.",
        }}
      />
      <StudentAttendanceManager
        key={date}
        students={students}
        date={date}
        attendance={attendance}
        schoolName={ctx?.schoolName ?? "École"}
        basePath="/surveillant/presences"
        saveAction={setStudentAttendanceBySurveillant}
      />
    </div>
  );
}
