"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { setSchoolYearAction, validateReenrollment, rejectReenrollment } from "./actions";
import type { Reenrollment } from "@/lib/enroll-db";

const sexLabel = (s?: string) => (s === "M" ? "Masculin" : s === "F" ? "Féminin" : "—");

export function ReenrollmentsManager({
  requests, currentYear, hasSignature,
}: {
  requests: Reenrollment[];
  currentYear: string;
  hasSignature: boolean;
}) {
  const router = useRouter();
  const [year, setYear] = useState(currentYear);
  const [pending, startTransition] = useTransition();

  const pendingReqs = requests.filter((r) => r.status === "pending");
  const treated = requests.filter((r) => r.status !== "pending");

  const saveYear = () => {
    startTransition(async () => {
      const r = await setSchoolYearAction(year);
      if (r.ok) router.refresh(); else alert(r.message);
    });
  };

  return (
    <>
      {/* Année scolaire */}
      <div className="ek-card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Année scolaire en cours</div>
        <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="ex. 2026-2027" style={{ ...inp, width: 160, marginLeft: "auto" }} />
        <button onClick={saveYear} disabled={pending} className="ek-btn ek-btn-outline" style={{ height: 34, fontSize: 12 }}>Enregistrer</button>
      </div>

      {!hasSignature && (
        <div className="ek-card" style={{ padding: 12, fontSize: 12.5, color: "var(--ink-2)", borderLeft: "3px solid var(--brand)" }}>
          💡 Configurez votre <strong>signature numérique</strong> dans <strong>Paramètres</strong> pour signer les validations.
        </div>
      )}

      {/* Demandes en attente */}
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
        En attente ({pendingReqs.length})
      </div>
      {pendingReqs.length === 0 ? (
        <div className="ek-card" style={{ padding: 30, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
          Aucune demande de réinscription en attente.
        </div>
      ) : (
        pendingReqs.map((r) => <RequestCard key={r.id} r={r} sexLabel={sexLabel} />)
      )}

      {/* Traitées */}
      {treated.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginTop: 8 }}>Traitées</div>
          {treated.map((r) => (
            <div key={r.id} className="ek-card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{r.studentName}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                  {r.schoolYear} · {r.requestedClass} · {r.mode === "redoublant" ? "Redoublant" : "Passage"}
                  {r.status === "rejected" && r.comment ? ` · Rejet : ${r.comment}` : ""}
                  {r.status === "validated" && r.verifyCode ? ` · Signé (code ${r.verifyCode})` : ""}
                </div>
              </div>
              <span className={`ek-chip ${r.status === "validated" ? "success" : "danger"}`}>
                {r.status === "validated" ? "Validée" : "Rejetée"}
              </span>
            </div>
          ))}
        </>
      )}
    </>
  );
}

function RequestCard({ r, sexLabel }: { r: Reenrollment; sexLabel: (s?: string) => string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [extra, setExtra] = useState<{ label: string; value: string }[]>([]);
  const [rejecting, setRejecting] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sd = r.studentData ?? {};
  const pd = r.parentData ?? {};

  const validate = () => {
    if (!confirm("Valider et signer cette réinscription ?")) return;
    setError(null);
    startTransition(async () => {
      const res = await validateReenrollment(r.id, extra);
      if (res.ok) router.refresh(); else setError(res.message);
    });
  };
  const reject = () => {
    setError(null);
    startTransition(async () => {
      const res = await rejectReenrollment(r.id, comment);
      if (res.ok) router.refresh(); else setError(res.message);
    });
  };

  return (
    <div className="ek-card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)" }}>{r.studentName}</div>
        <span className="ek-chip" style={{ background: r.mode === "redoublant" ? "rgba(194,135,40,0.12)" : "rgba(29,102,80,0.12)", color: r.mode === "redoublant" ? "#C28728" : "#1D6650" }}>
          {r.mode === "redoublant" ? "Redoublant" : "Passage en classe supérieure"}
        </span>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--ink-3)" }}>
          {r.schoolYear} · {r.currentClass || "?"} → <strong style={{ color: "var(--ink)" }}>{r.requestedClass || "?"}</strong>
          {r.option ? ` (${r.option})` : ""}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Box title="Infos élève (proposées)">
          <Info label="Nom" value={sd.lastName} />
          <Info label="Post-nom" value={sd.middleName} />
          <Info label="Prénom" value={sd.firstName} />
          <Info label="Sexe" value={sexLabel(sd.sex)} />
          <Info label="Naissance" value={sd.birthDate} />
          <Info label="Adresse" value={sd.address} />
        </Box>
        <Box title="Infos parent/tuteur (proposées)">
          <Info label="Nom" value={pd.fullName} />
          <Info label="Téléphone" value={pd.phone} />
          <Info label="Email" value={pd.email} />
          <Info label="Adresse" value={pd.address} />
        </Box>
      </div>

      {/* Champs personnalisés (école) */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
          Champs supplémentaires (école)
        </div>
        {extra.map((f, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <input value={f.label} onChange={(e) => setExtra((p) => p.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder="Libellé (ex. Frais payés)" style={{ ...inp, flex: 1 }} />
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
            <button onClick={reject} disabled={pending} className="ek-btn" style={{ height: 34, fontSize: 12, marginLeft: "auto", background: "rgba(192,58,43,0.12)", color: "var(--danger)" }}>
              Confirmer le rejet
            </button>
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
function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "3px 0", fontSize: 12.5 }}>
      <span style={{ color: "var(--ink-3)" }}>{label}</span>
      <span style={{ color: "var(--ink)", fontWeight: 600, textAlign: "right" }}>{value || "—"}</span>
    </div>
  );
}

const inp: React.CSSProperties = {
  padding: "8px 10px", borderRadius: 9, border: "1px solid var(--border-strong)",
  background: "var(--surface)", fontSize: 13, color: "var(--ink)",
};
