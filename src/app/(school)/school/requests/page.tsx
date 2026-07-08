import { PageHeader } from "@/components/KPI";
import { T } from "@/lib/i18n";
import { getPendingStudents } from "./actions";
import { PendingRequestsList } from "./PendingRequestsList";

export default async function SchoolRequests() {
  const pending = await getPendingStudents();

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Demande d'inscription", en: "Registration request" }}
        sub={{ fr: `${pending.length} demande(s) en attente`, en: `${pending.length} pending request(s)` }}
      />

      <div style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.5 }}>
        <T
          fr="Les parents enregistrent leurs enfants. Ouvrez « Détails » pour voir toutes les informations saisies par le parent, puis validez (ou refusez)."
          en="Parents register their children. Open “Details” to review all the information entered by the parent, then approve (or reject)."
        />
      </div>

      <PendingRequestsList pending={pending} />
    </div>
  );
}
