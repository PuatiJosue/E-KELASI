import { PageHeader } from "@/components/KPI";
import { listTeacherClasses, listStudentsInClass } from "@/lib/teacher/classes";
import { getStudentAttendanceForDate } from "@/lib/teacher/attendance";
import { AttendanceForm } from "@/components/teacher/AttendanceForm";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: { class?: string; option?: string; date?: string };
}) {
  const today = new Date().toISOString().slice(0, 10);
  const date = searchParams.date || today;

  const classes = await listTeacherClasses();
  const initialClassName = searchParams.class ?? classes[0]?.className ?? "";
  const initialOption = searchParams.class ? (searchParams.option ?? "") : (classes[0]?.option ?? "");
  const students = initialClassName ? await listStudentsInClass(initialClassName, initialOption) : [];
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
        key={`${initialClassName}|${initialOption}|${date}`}
        classes={classes.map((c) => ({ key: c.key, label: c.label, className: c.className, option: c.option }))}
        initialClassName={initialClassName}
        initialOption={initialOption}
        initialDate={date}
        initialStudents={students}
        initialAttendance={attendance}
      />
    </div>
  );
}
