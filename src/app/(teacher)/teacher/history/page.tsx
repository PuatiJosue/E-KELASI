import { PageHeader } from "@/components/KPI";
import { listTeacherGradeHistory } from "@/lib/teacher-db";
import { GradeHistoryTable } from "@/components/teacher/GradeHistoryTable";

export default async function GradeHistoryPage() {
  const rows = await listTeacherGradeHistory();

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Historique des notes", en: "Grade history" }}
        sub={{
          fr: "Toutes les notes que vous avez saisies sont conservées ici. Filtrez par année scolaire, trimestre ou classe, puis téléchargez en Excel.",
          en: "Every grade you have entered is kept here. Filter by school year, term or class, then download as Excel.",
        }}
      />
      <GradeHistoryTable rows={rows} />
    </div>
  );
}
