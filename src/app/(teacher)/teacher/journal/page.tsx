import { PageHeader } from "@/components/KPI";
import { listJournalEntries } from "./actions";
import { JournalManager } from "@/components/teacher/JournalManager";

export default async function TeacherJournalPage() {
  const entries = await listJournalEntries();

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Journal de bord", en: "Class logbook" }}
        sub={{
          fr: "Notez chaque jour la matière enseignée, la leçon donnée et un court résumé. Enregistrez et téléchargez en PDF.",
          en: "Record each day the subject taught, the lesson and a short summary. Save and export as PDF.",
        }}
      />
      <JournalManager entries={entries} />
    </div>
  );
}
