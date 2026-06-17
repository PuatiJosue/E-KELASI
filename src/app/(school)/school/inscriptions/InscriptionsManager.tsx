"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { validateInscription, rejectInscription } from "./actions";
import type { Inscription } from "@/lib/inscription-db";

const sexLabel = (s?: string) => (s === "M" ? "Masculin" : s === "F" ? "Féminin" : "—");

export function InscriptionsManager({ requests, hasSignature }: { requests: Inscription[]; hasSignature: boolean }) {
  const pendingReqs = requests.filter((r) => r.status === "pending");
  const treated = requests.filter((r) => r.status !== "pending");

  return (
    <>
      {!hasSignature && (
        <div className="ek-card" style={{ padding: 12, fontSize: 12.5, color: "var(--ink-2)", borderLeft: "3px solid var(--brand)" }}>
          💡 Configurez votre <strong>signature numérique</strong> (Annonces ou Paramètres) pour signer les inscriptions.
        </div>
      )}

      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>En attente ({pendingReqs.length})</div>
      {pendingReqs.length === 0 ? (
        <div className="ek-card" style={{ padding: 30, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
          Aucune demande d&apos;inscription en attente. Les parents envoient les dossiers depuis l&apos;application.
        </div>
      ) : (
        pendingReqs.map((r) => <Card key={r.id} r={r} />)
      )}

      {treated.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginTop: 8 }}>Traitées</div>
          {treated.map((r) => {
            const sd = r.studentData ?? {};
            const name = [sd.lastName, sd.middleName, sd.firstName].filter(Boolean).join(" ");
            return (
              <div key={r.id} className="ek-card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                    {r.schoolYear} · {r.requestedClass}{r.option ? ` (${r.option})` : ""}
                    {r.status === "rejected" && r.comment ? ` · Rejet : ${r.comment}` : ""}
                  </div>
                </div>
                {r.status === "validated" && r.verifyCode && (
                  <a href={`/inscription/${r.verifyCode}`} target="_blank" rel="noreferrer" className="ek-btn ek-btn-outline" style={{ height: 30, fontSize: 12 }}>
                    <Icon name="file" size={12} /> Confirmation PDF
                  </a>
                )}
                <span className={`ek-chip ${r.status === "validated" ? "success" : "danger"}`}>
                  {r.status === "validated" ? "Validée" : "Rejetée"}
                </span>
              </div>
            );
          })}
        </>
      )}
    </>
  );
}

function Card({ r }: { r: Inscription }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [extra, setExtra] = useState<{ label: string; value: string }[]>([]);
  const [rejecting, setRejecting] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sd = r.studentData ?? {};
  const pd = r.parentData ?? {};
  const name = [sd.lastName, sd.middleName, sd.firstName].filter(Boolean).join(" ");

  const validate = () => {
    if (!confirm("Valider et signer cette inscription ? (l'élève sera créé)")) return;
    setError(null);
    startTransition(async () => {
      const res = await validateInscription(r.id, extra);
      if (res.ok) router.refresh(); else setError(res.message);
    });
  };
  const reject = () => {
    setError(null);
    startTransition(async () => {
      const res = await rejectInscription(r.id, comment);
      if (res.ok) router.refresh(); else setError(res.message);
    });
  };

  return (
    <div className="ek-card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {r.photoStudentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.photoStudentUrl} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover" }} />
        ) : null}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)" }}>{name || "—"}</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
            {r.schoolYear} · {r.requestedClass}{r.option ? ` (${r.option})` : ""}
          </div>
        </div>
        {r.documentsUrl && (
          <a href={r.documentsUrl} target="_blank" rel="noreferrer" className="ek-btn ek-btn-outline" style={{ height: 30, fontSize: 12 }}>
            <Icon name="file" size={12} /> Documents
          </a>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Box title="Élève">
          <Info l="Nom" v={sd.lastName} />
          <Info l="Post-nom" v={sd.middleName} />
          <Info l="Prénom" v={sd.firstName} />
          <Info l="Sexe" v={sexLabel(sd.sex)} />
          <Info l="Naissance" v={[sd.birthDate, sd.birthPlace].filter(Boolean).join(" à ")} />
          <Info l="Nationalité" v={sd.nationality} />
          <Info l="Tél / Email" v={[sd.studentPhone, sd.studentEmail].filter(Boolean).join(" · ")} />
          <Info l="École précédente" v={[sd.prevSchool, sd.prevClass, sd.prevOption].filter(Boolean).join(" · ")} />
          <Info l="Adresse" v={[sd.addressCommune, sd.addressCity, sd.addressProvince].filter(Boolean).join(", ")} />
        </Box>
        <Box title="Parents / Tuteur / Urgence">
          <Info l="Père" v={pd.fatherName} />
          <Info l="Mère" v={pd.motherName} />
          <Info l="Tuteur légal" v={pd.guardianName} />
          <Info l="Téléphone" v={pd.parentPhone} />
          <Info l="Adresse" v={pd.parentAddress} />
          <Info l="Profession" v={pd.parentProfession} />
          <Info l="Urgence" v={[pd.emergencyContact, pd.emergencyPhone].filter(Boolean).join(" · ")} />
          {r.photoParentUrl ? <a href={r.photoParentUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--brand-600)", fontWeight: 600 }}>Voir photo parent →</a> : null}
        </Box>
      </div>

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
          Champs supplémentaires (école)
        </div>
        {extra.map((f, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <input value={f.label} onChange={(e) => setExtra((p) => p.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder="Libellé" style={{ ...inp, flex: 1 }} />
            <input value={f.value} onChange={(e) => setExtra((p) => p.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} placeholder="Valeur" style={{ ...inp, flex: 1 }} />
            <button onClick={() => setExtra((p) => p.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)" }}><Icon name="close" size={16} /></button>
          </div>
        ))}
        <button onClick={() => setExtra((p) => [...p, { label: "", value: "" }])} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--brand-600)", fontSize: 12, fontWeight: 600, padding: 0 }}>
          + Ajouter un champ
        </button>
      </div>

      {error && <div style={{ color: "var(--danger)", fontSize: 12, fontWeight: 600 }}>{error}</div>}

      {!rejecting ? (
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setRejecting(true)} disabled={pending} className="ek-btn ek-btn-outline" style={{ height: 36, fontSize: 13, color: "var(--danger)" }}>Rejeter</button>
          <button onClick={validate} disabled={pending} className="ek-btn ek-btn-primary" style={{ height: 36, fontSize: 13, marginLeft: "auto" }}>
            <Icon name="check" size={13} /> {pending ? "…" : "Valider et signer"}
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Motif du rejet…" style={{ ...inp, resize: "vertical" }} />
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setRejecting(false)} className="ek-btn ek-btn-outline" style={{ height: 34, fontSize: 12 }}>Annuler</button>
            <button onClick={reject} disabled={pending} className="ek-btn" style={{ height: 34, fontSize: 12, marginLeft: "auto", background: "rgba(192,58,43,0.12)", color: "var(--danger)" }}>Confirmer le rejet</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  );
}
function Info({ l, v }: { l: string; v?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "3px 0", fontSize: 12.5 }}>
      <span style={{ color: "var(--ink-3)" }}>{l}</span>
      <span style={{ color: "var(--ink)", fontWeight: 600, textAlign: "right" }}>{v || "—"}</span>
    </div>
  );
}

const inp: React.CSSProperties = {
  padding: "8px 10px", borderRadius: 9, border: "1px solid var(--border-strong)",
  background: "var(--surface)", fontSize: 13, color: "var(--ink)",
};
