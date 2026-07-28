import { PageHeader } from "@/components/KPI";
import { Logo } from "@/components/Logo";
import { listSchoolAnnouncements } from "@/lib/announce-db";
import { getMySchool } from "@/lib/school/profile";
import { listSchoolStudents } from "@/lib/school/people";
import { classLabel, normOption, classKey } from "@/lib/classes";
import { AnnouncementManager, type AnnounceClass } from "./AnnouncementManager";
import { SignatureForm } from "../settings/SignatureForm";

export default async function SchoolAnnouncements() {
  const [announcements, school, students] = await Promise.all([
    listSchoolAnnouncements(),
    getMySchool(),
    listSchoolStudents(),
  ]);

  // Classes distinctes (class_name + option) pour cibler une annonce.
  const seen = new Map<string, AnnounceClass>();
  for (const s of students) {
    if (!s.className || s.className === "—") continue;
    const key = classKey(s.className, s.option);
    if (!seen.has(key)) seen.set(key, { className: s.className, option: normOption(s.option), display: classLabel(s.className, s.option) });
  }
  const classes = [...seen.values()].sort((a, b) => a.display.localeCompare(b.display, "fr", { numeric: true }));

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

      <AnnouncementManager announcements={announcements} classes={classes} />

      {/* Signature électronique (utilisée pour signer bulletins & validations) */}
      <div className="ek-card" style={{ padding: 20 }}>
        <SignatureForm initialName={school?.directorName ?? ""} initialSignatureUrl={school?.signatureUrl ?? null} />
      </div>
    </div>
  );
}
