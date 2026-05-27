import { PageHeader } from "@/components/KPI";
import { T } from "@/lib/i18n";
import { listTeacherClasses, listTeacherSubjects, listStudentsInClass } from "@/lib/teacher-db";
import { GradesEntryForm } from "@/components/teacher/GradesEntryForm";

export default async function GradesPage({
  searchParams,
}: {
  searchParams: { class?: string };
}) {
  const [classes, subjects] = await Promise.all([
    listTeacherClasses(),
    listTeacherSubjects(),
  ]);

  const initialClass = searchParams.class ?? classes[0]?.className ?? "";
  const students = initialClass ? await listStudentsInClass(initialClass) : [];

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Saisir des notes", en: "Enter grades" }}
        sub={{
          fr: "Choisis la classe, la matière, le type d'évaluation, puis saisis les notes en bloc.",
          en: "Pick class, subject, kind, then enter grades in bulk.",
        }}
      />

      <GradesEntryForm
        classes={classes.map((c) => c.className)}
        subjects={subjects}
        initialClassName={initialClass}
        initialStudents={students}
      />
    </div>
  );
}
