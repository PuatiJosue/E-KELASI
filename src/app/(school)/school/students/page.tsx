import { PageHeader } from "@/components/KPI";
import { listSchoolStudents } from "@/lib/school-db";
import { AddStudentButton } from "@/components/school/AddStudentButton";
import { StudentsBrowser } from "./StudentsBrowser";

export default async function SchoolStudents() {
  const students = await listSchoolStudents();
  const classes = new Set(students.map((s) => s.className)).size;

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Élèves", en: "Students" }}
        sub={{
          fr: `${students.length} élèves dans ${classes} classes`,
          en: `${students.length} students in ${classes} classes`,
        }}
        right={<AddStudentButton />}
      />

      <StudentsBrowser students={students} />
    </div>
  );
}
