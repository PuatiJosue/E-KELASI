import { PageHeader } from "@/components/KPI";
import { listSchoolStudents } from "@/lib/school-db";
import { StudentsBrowser } from "./StudentsBrowser";

export default async function SchoolStudents() {
  const students = await listSchoolStudents();
  const classes = new Set(students.map((s) => s.className)).size;

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Classe", en: "Class" }}
        sub={{
          fr: `${students.length} élèves dans ${classes} classes`,
          en: `${students.length} students in ${classes} classes`,
        }}
      />

      <div style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.5 }}>
        Les élèves apparaissent ici automatiquement lorsqu&apos;un parent les enregistre depuis l&apos;application et que vous validez la demande (menu <strong>Demandes</strong>).
      </div>

      <StudentsBrowser students={students} />
    </div>
  );
}
