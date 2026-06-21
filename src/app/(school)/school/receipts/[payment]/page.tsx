import { SchoolLetterhead } from "@/components/school/SchoolLetterhead";
import { PrintButton } from "@/components/school/PrintButton";
import { getPaymentForReceipt } from "@/lib/finance-db";

export const dynamic = "force-dynamic";

function fmt(d: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function fmtAmount(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toLocaleString("fr-FR")} ${currency}`;
  }
}

export default async function PaymentReceipt({ params }: { params: { payment: string } }) {
  const p = await getPaymentForReceipt(params.payment);

  if (!p) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>
        Reçu introuvable.
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <div className="report-toolbar" style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <PrintButton />
      </div>

      <div className="report-paper" style={{ background: "white", padding: 40, borderRadius: 12, border: "1px solid var(--border)", color: "#1a1410" }}>
        <SchoolLetterhead
          name={p.school.name}
          subtitle={[p.school.commune, p.school.city].filter(Boolean).join(", ")}
          logoUrl={p.school.logoUrl}
          rightTitle="Reçu de paiement"
          rightValue={fmt(p.paidAt)}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: 16, borderRadius: 10, background: "#F4EFE3", marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-display)" }}>{p.studentName}</div>
            {p.className ? <div style={{ fontSize: 13, color: "#4a3f35" }}>Classe : <strong>{p.className}</strong></div> : null}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#8a7c6e", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Montant</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#1D6650", fontFamily: "var(--font-display)" }}>{fmtAmount(p.amount, p.currency)}</div>
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, marginBottom: 20 }}>
          <tbody>
            <Row label="Objet" value={p.label || "Frais scolaires"} />
            <Row label="Date du paiement" value={fmt(p.paidAt)} />
            {p.comment ? <Row label="Commentaire" value={p.comment} /> : null}
            {p.recordedBy ? <Row label="Encaissé par" value={p.recordedBy} /> : null}
          </tbody>
        </table>

        {/* Signature */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, marginTop: 30, paddingTop: 20, borderTop: "1px solid #ECE3D2" }}>
          <div>
            <div style={{ fontSize: 11, color: "#8a7c6e", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Cachet & signature</div>
            {p.school.signatureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.school.signatureUrl} alt="" style={{ height: 44, objectFit: "contain", display: "block", marginBottom: 4 }} />
            ) : <div style={{ height: 26 }} />}
            <div style={{ borderBottom: "1px solid #1a1410", paddingBottom: 4, fontSize: 11.5, fontWeight: 600 }}>{p.school.directorName || "Signature"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#8a7c6e", textTransform: "uppercase", letterSpacing: "0.05em" }}>Reçu n°</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{p.id.slice(0, 8).toUpperCase()}</div>
          </div>
        </div>

        <div style={{ marginTop: 24, fontSize: 10, color: "#b5a99a", textAlign: "center" }}>
          Reçu généré via E-KELASI · {fmt(new Date().toISOString())}
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr style={{ borderBottom: "1px solid #ECE3D2" }}>
      <td style={{ padding: "8px 8px", color: "#8a7c6e", width: "38%" }}>{label}</td>
      <td style={{ padding: "8px 8px", fontWeight: 600 }}>{value}</td>
    </tr>
  );
}
