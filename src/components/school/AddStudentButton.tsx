"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { PROMOTION_LEVELS, PROMOTION_OPTIONS } from "@/lib/promotion";
import { addStudentAction } from "@/app/(school)/school/students/actions";

export function AddStudentButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [sex, setSex] = useState("");
  const [className, setClassName] = useState("");
  const [option, setOption] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await addStudentAction({ lastName, middleName, firstName, sex, className, option });
      if (res.ok) {
        setOpen(false);
        setLastName(""); setMiddleName(""); setFirstName(""); setSex(""); setClassName(""); setOption("");
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="ek-btn ek-btn-primary" style={{ height: 38, fontSize: 13 }}>
        <Icon name="plus" size={15} stroke={2.5} />
        <T fr="Ajouter un élève" en="Add student" />
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(20,16,10,0.45)",
            display: "grid",
            placeItems: "center",
            zIndex: 100,
            padding: 24,
          }}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={onSubmit}
            className="ek-card"
            style={{ width: "100%", maxWidth: 460, padding: 24 }}
          >
            <h2 style={{ fontSize: 18, fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--ink)", marginBottom: 14 }}>
              <T fr="Ajouter un élève" en="Add a student" />
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="ek-stack-md" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label={<T fr="Nom" en="Last name" />}>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="NDOYE" style={inputStyle} />
                </Field>
                <Field label={<T fr="Prénom" en="First name" />}>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="Mamadou" style={inputStyle} />
                </Field>
              </div>
              <div className="ek-stack-md" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label={<T fr="Post-nom (facultatif)" en="Middle name (optional)" />}>
                  <input value={middleName} onChange={(e) => setMiddleName(e.target.value)} placeholder="Amadou" style={inputStyle} />
                </Field>
                <Field label={<T fr="Sexe" en="Sex" />}>
                  <select value={sex} onChange={(e) => setSex(e.target.value)} style={inputStyle}>
                    <option value="">—</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </Field>
              </div>
              <div className="ek-stack-md" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label={<T fr="Classe" en="Class" />}>
                  <input value={className} onChange={(e) => setClassName(e.target.value)} required placeholder="5e année primaire" list="ek-add-classes" style={inputStyle} />
                </Field>
                <Field label={<T fr="Option / filière" en="Option" />}>
                  <input value={option} onChange={(e) => setOption(e.target.value)} placeholder="Sciences… (facultatif)" list="ek-add-options" style={inputStyle} />
                </Field>
              </div>

              <datalist id="ek-add-classes">
                {PROMOTION_LEVELS.map((l) => <option key={l.key} value={l.label} />)}
              </datalist>
              <datalist id="ek-add-options">
                {PROMOTION_OPTIONS.map((o) => <option key={o} value={o} />)}
              </datalist>

              <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.45 }}>
                <T
                  fr="L'élève apparaîtra aussitôt dans l'annuaire et dans les présences."
                  en="The student will immediately appear in the directory and attendance."
                />
              </div>
            </div>

            {error && (
              <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "rgba(192,58,43,0.10)", color: "var(--danger)", fontSize: 12.5, fontWeight: 600 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <button type="button" onClick={() => setOpen(false)} className="ek-btn ek-btn-outline" style={{ flex: 1 }}>
                <T fr="Annuler" en="Cancel" />
              </button>
              <button type="submit" disabled={pending} className="ek-btn ek-btn-primary" style={{ flex: 1, opacity: pending ? 0.6 : 1 }}>
                {pending ? "Ajout…" : "Ajouter"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--ink)",
  fontSize: 13,
  width: "100%",
};

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>{label}</span>
      {children}
    </label>
  );
}
