import { PageHeader } from "@/components/KPI";
import { listStudentsForAttendance, getStudentAttendanceForDate } from "@/lib/attendance-db";
import { getMySchool } from "@/lib/school-db";
import { StudentAttendanceManager } from "@/components/school/StudentAttendanceManager";
import { AddStudentButton } from "@/components/school/AddStudentButton";

export default async function SchoolStudentAttendance({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const today = new Date().toISOString().slice(0, 10);
  const date = searchParams.date || today;

  const [students, attendance, school] = await Promise.all([
    listStudentsForAttendance(),
    getStudentAttendanceForDate(date),
    getMySchool(),
  ]);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Présences des élèves", en: "Student attendance" }}
        sub={{
          fr: "Sélectionnez la classe, pointez chaque élève, puis exportez la liste en Excel ou PDF.",
          en: "Select the class, mark each student, then export the list as Excel or PDF.",
        }}
        right={<AddStudentButton />}
      />
      <StudentAttendanceManager
        key={date}
        students={students}
        date={date}
        attendance={attendance}
        schoolName={school?.name ?? "École"}
      />
    </div>
  );
}
