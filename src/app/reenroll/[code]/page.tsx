import { SchoolLetterhead } from "@/components/school/SchoolLetterhead";
import { PrintButton } from "@/components/school/PrintButton";
import { getReenrollmentByCode } from "@/lib/enroll-db";

export const dynamic = "force-dynamic";

function fmt(d: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default async function ReenrollConfirmation({ params }: { params: { code: string } }) {
  const d = await getReenrollmentByCode(params.code);

  if (!d) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>
        Confirmation introuvable ou réinscription non validée.
      </div>
    );
  }

  const pd = d.parentData ?? {};
  const extra: { label: string; value: string }[] = Array.isArray(d.extra) ? d.extra : [];

  return (
    <div style={{ padding: 24, maxWidth: 860, margin: "0 auto" }}>
      <div className="report-toolbar" style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <PrintButton />
      </div>

      <div className="report-paper" style={{ background: "white", padding: 40, borderRadius: 12, border: "1px solid var(--border)", color: "#1a1410" }}>
        <SchoolLetterhead
          name={d.schoolName}
          subtitle={[d.schoolCommune, d.schoolCity].filter(Boolean).join(", ")}
          logoUrl={d.schoolLogoUrl}
          rightTitle="Confirmation de réinscription"
          rightValue={d.schoolYear || ""}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: 16, borderRadius: 10, background: "#F4EFE3", marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-display)" }}>{d.studentName}</div>
            <div style={{ fontSize: 13, color: "#4a3f35" }}>
              {d.currentClass ? <>Classe actuelle : <strong>{d.currentClass}</strong></> : null}
              {d.requestedClass ? <> · Classe demandée : <strong>{d.requestedClass}</strong></> : null}
              {d.option ? ` · ${d.option}` : ""}
            </div>
          </div>
        </div>

        <Section title="Parents / Tuteur" rows={[
          ["Père", pd.fatherName],
          ["Mère", pd.motherName],
          ["Tuteur légal", pd.guardianName],
          ["Téléphone", pd.parentPhone],
          ["Adresse", pd.parentAddress],
          ["Profession", pd.parentProfession],
          ["Contact d'urgence", [pd.emergencyContact, pd.emergencyPhone].filter(Boolean).join(" · ")],
        ]} />

        {extra.length > 0 && <Section title="Informations complémentaires" rows={extra.map((e) => [e.label, e.value] as [string, string])} />}

        {/* Signature */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, marginTop: 30, paddingTop: 20, borderTop: "1px solid #ECE3D2" }}>
          <div>
            <div style={{ fontSize: 11, color: "#8a7c6e", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Direction</div>
            {d.signatureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.signatureUrl} alt="" style={{ height: 44, objectFit: "contain", display: "block", marginBottom: 4 }} />
            ) : <div style={{ height: 26 }} />}
            <div style={{ borderBottom: "1px solid #1a1410", paddingBottom: 4, fontSize: 11.5, fontWeight: 600 }}>{d.signedBy || "Signature"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#8a7c6e", textTransform: "uppercase", letterSpacing: "0.05em" }}>Réinscription validée le</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{fmt(d.createdAt)}</div>
            <div style={{ fontSize: 11, color: "#8a7c6e", marginTop: 10 }}>Code : <strong>{d.verifyCode}</strong></div>
          </div>
        </div>

        <div style={{ marginTop: 24, fontSize: 10, color: "#b5a99a", textAlign: "center" }}>
          Document généré via E-KELASI · vérifiable sur e-kelasi.vercel.app/reenroll/{d.verifyCode}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; }
          .report-toolbar { display: none !important; }
          .report-paper { border: none !important; padding: 0 !important; }
          nav, aside, header { display: none !important; }
        }
      ` }} />
    </div>
  );
}

function Section({ title, rows }: { title: string; rows: [string, string | undefined][] }) {
  const shown = rows.filter(([, v]) => v && v.trim?.());
  if (shown.length === 0) return null;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, fontFamily: "var(--font-display)" }}>{title}</div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
        <tbody>
          {shown.map(([l, v], i) => (
            <tr key={i} style={{ borderBottom: "1px solid #ECE3D2" }}>
              <td style={{ padding: "7px 8px", color: "#8a7c6e", width: "38%" }}>{l}</td>
              <td style={{ padding: "7px 8px", fontWeight: 600 }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
