import { PageHeader } from "@/components/KPI";
import { listAssignments, listFormOptions } from "@/lib/courses-db";
import { CoursesManager } from "./CoursesManager";

export default async function SchoolCourses() {
  const [assignments, options] = await Promise.all([listAssignments(), listFormOptions()]);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Attribution des cours", en: "Course assignments" }}
        sub={{
          fr: `${assignments.length} attribution(s)`,
          en: `${assignments.length} assignment(s)`,
        }}
      />
      <CoursesManager assignments={assignments} options={options} />
    </div>
  );
}
