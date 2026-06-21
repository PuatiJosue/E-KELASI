import { PageHeader } from "@/components/KPI";
import { Logo } from "@/components/Logo";
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

      {/* En-tête de l'école : nom + logo (identité sur les annonces) */}
      <div className="ek-card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
        {school?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={school.logoUrl} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: "contain", background: "var(--surface-2)" }} />
        ) : (
          <Logo size={40} />
        )}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)" }}>{school?.name ?? "—"}</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{[school?.commune, school?.city].filter(Boolean).join(", ")}</div>
        </div>
      </div>

      <AnnouncementManager announcements={announcements} />

      {/* Signature électronique (utilisée pour signer bulletins & validations) */}
      <div className="ek-card" style={{ padding: 20 }}>
        <SignatureForm initialName={school?.directorName ?? ""} initialSignatureUrl={school?.signatureUrl ?? null} />
      </div>
    </div>
  );
}
