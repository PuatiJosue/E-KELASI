import { PageHeader } from "@/components/KPI";
import { listReenrollments } from "@/lib/enroll-db";
import { getMySchool } from "@/lib/school/profile";
import { ReenrollmentsManager } from "./ReenrollmentsManager";

export default async function SchoolReenrollments() {
  const [requests, school] = await Promise.all([listReenrollments(), getMySchool()]);
  const pending = requests.filter((r) => r.status === "pending").length;

  // Année scolaire par défaut suggérée (bascule en août).
  const now = new Date();
  const y = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 920 }}>
      <PageHeader
        title={{ fr: "Réinscription", en: "Enrollment" }}
        sub={{ fr: `${pending} demande(s) en attente`, en: `${pending} pending` }}
      />
      <ReenrollmentsManager
        requests={requests}
        currentYear={school?.currentYear || `${y}-${y + 1}`}
        hasSignature={!!school?.signatureUrl || !!school?.directorName}
      />
    </div>
  );
}
