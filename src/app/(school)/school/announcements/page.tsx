import { PageHeader } from "@/components/KPI";
import { listSchoolAnnouncements } from "@/lib/announce-db";
import { getMySchool } from "@/lib/school-db";
import { AnnouncementManager } from "./AnnouncementManager";
import { SignatureForm } from "../settings/SignatureForm";

export default async function SchoolAnnouncements() {
  const [announcements, school] = await Promise.all([listSchoolAnnouncements(), getMySchool()]);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Annonces", en: "Announcements" }}
        sub={{
          fr: `${announcements.length} annonce(s) publiée(s)`,
          en: `${announcements.length} published`,
        }}
      />
      <AnnouncementManager announcements={announcements} />

      {/* Signature électronique (utilisée pour signer bulletins & validations) */}
      <div className="ek-card" style={{ padding: 20 }}>
        <SignatureForm initialName={school?.directorName ?? ""} initialSignatureUrl={school?.signatureUrl ?? null} />
      </div>
    </div>
  );
}
