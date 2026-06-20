import { PageHeader } from "@/components/KPI";
import { listTeacherClasses, listStudentsInClass, getStudentAttendanceForDate } from "@/lib/teacher-db";
import { AttendanceForm } from "@/components/teacher/AttendanceForm";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: { class?: string; date?: string };
}) {
  const today = new Date().toISOString().slice(0, 10);
  const date = searchParams.date || today;

  const classes = await listTeacherClasses();
  const initialClass = searchParams.class ?? classes[0]?.className ?? "";
  const students = initialClass ? await listStudentsInClass(initialClass) : [];
  const attendance = await getStudentAttendanceForDate(students.map((s) => s.id), date);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Présence des élèves", en: "Student attendance" }}
        sub={{
          fr: "Choisis la classe et la date, puis pointe chaque élève.",
          en: "Pick the class and date, then mark each student.",
        }}
      />

      <AttendanceForm
        key={`${initialClass}|${date}`}
        classes={classes.map((c) => c.className)}
        initialClassName={initialClass}
        initialDate={date}
        initialStudents={students}
        initialAttendance={attendance}
      />
    </div>
  );
}
