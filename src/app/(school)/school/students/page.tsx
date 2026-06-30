import { PageHeader } from "@/components/KPI";
import { listSchoolStudents } from "@/lib/school-db";
import { StudentsBrowser } from "./StudentsBrowser";
import { AddStudentButton } from "@/components/school/AddStudentButton";

export default async function SchoolStudents() {
  const students = await listSchoolStudents();
  const classes = new Set(students.map((s) => s.className)).size;

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Annuaire des classes", en: "Class directory" }}
        sub={{
          fr: `${students.length} élèves dans ${classes} classes`,
          en: `${students.length} students in ${classes} classes`,
        }}
        right={<AddStudentButton />}
      />

      <div style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.5 }}>
        Ajoutez vos élèves à la main avec <strong>Ajouter un élève</strong>, ou laissez-les arriver automatiquement quand un parent les enregistre depuis l&apos;application et que vous validez la demande (menu <strong>Demandes</strong>). Dans les deux cas ils apparaissent aussi dans <strong>Présences élèves</strong>.
      </div>

      <StudentsBrowser students={students} />
    </div>
  );
}
