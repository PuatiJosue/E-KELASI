import { PageHeader } from "@/components/KPI";
import { listInscriptions } from "@/lib/inscription-db";
import { getMySchool } from "@/lib/school/profile";
import { InscriptionsManager } from "./InscriptionsManager";

export default async function SchoolInscriptions() {
  const [requests, school] = await Promise.all([listInscriptions(), getMySchool()]);
  const pending = requests.filter((r) => r.status === "pending").length;

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 960 }}>
      <PageHeader
        title={{ fr: "Inscription", en: "Admission" }}
        sub={{ fr: `${pending} dossier(s) en attente · nouveaux élèves`, en: `${pending} pending` }}
      />
      <InscriptionsManager requests={requests} hasSignature={!!school?.signatureUrl || !!school?.directorName} />
    </div>
  );
}
