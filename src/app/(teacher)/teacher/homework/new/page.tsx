import { PageHeader } from "@/components/KPI";
import { T } from "@/lib/i18n";
import { listTeacherClasses } from "@/lib/teacher/classes";
import { listTeacherSubjects } from "@/lib/teacher/profile";
import { NewHomeworkForm } from "@/components/teacher/NewHomeworkForm";

export default async function NewHomeworkPage() {
  const [classes, subjects] = await Promise.all([listTeacherClasses(), listTeacherSubjects()]);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 760 }}>
      <PageHeader
        title={{ fr: "Nouveau devoir", en: "New homework" }}
        sub={{ fr: "Les parents seront notifiés à la création.", en: "Parents will be notified on creation." }}
      />
      <NewHomeworkForm classes={[...new Set(classes.map((c) => c.className))]} subjects={subjects} />
    </div>
  );
}
