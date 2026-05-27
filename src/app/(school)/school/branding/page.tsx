import { PageHeader } from "@/components/KPI";
import { T } from "@/lib/i18n";
import { getMySchool } from "@/lib/school-db";
import { BrandingForm } from "@/components/school/BrandingForm";

export default async function SchoolBranding() {
  const school = await getMySchool();

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 760 }}>
      <PageHeader
        title={{ fr: "Branding école", en: "School branding" }}
        sub={{
          fr: "Personnalise les couleurs et le nom affichés aux parents et profs.",
          en: "Customize colors and name shown to parents and teachers.",
        }}
      />

      {school ? (
        <BrandingForm school={school} />
      ) : (
        <div className="ek-card" style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>
          <T fr="École introuvable." en="School not found." />
        </div>
      )}
    </div>
  );
}
