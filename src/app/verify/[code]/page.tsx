import { Logo } from "@/components/Logo";
import { getDocumentByCode } from "@/lib/documents-db";

export const dynamic = "force-dynamic";

function fmt(d: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default async function VerifyDocument({ params }: { params: { code: string } }) {
  const doc = await getDocumentByCode(params.code);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--bg)", padding: 24 }}>
      <div className="ek-card" style={{ width: "100%", maxWidth: 460, padding: 32 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <Logo size={32} withWord />
        </div>

        {!doc ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>❌</div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)" }}>Document introuvable</h1>
            <p style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 6 }}>
              Aucun document officiel ne correspond au code <strong>{params.code}</strong>.
            </p>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: "#1D6650", fontFamily: "var(--font-display)" }}>Document authentique</h1>
              <p style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 4 }}>Émis officiellement via E-KELASI.</p>
            </div>

            <Row label="Type" value={doc.title} />
            {doc.period && <Row label="Période" value={doc.period} />}
            <Row label="Élève" value={doc.studentName} />
            <Row label="École" value={`${doc.schoolName}${doc.schoolCity ? `, ${doc.schoolCity}` : ""}`} />
            {doc.signedBy && <Row label="Signé par" value={doc.signedBy} />}
            <Row label="Émis le" value={fmt(doc.issuedAt)} />
            {doc.data?.overallAvg != null && <Row label="Moyenne générale" value={`${doc.data.overallAvg}/20`} last />}

            <div style={{ marginTop: 18, fontSize: 11, color: "var(--ink-3)", textAlign: "center" }}>
              Code de vérification : <strong>{params.code}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: last ? "none" : "1px solid var(--divider)", fontSize: 13.5 }}>
      <span style={{ color: "var(--ink-3)" }}>{label}</span>
      <span style={{ color: "var(--ink)", fontWeight: 600, textAlign: "right" }}>{value}</span>
    </div>
  );
}
