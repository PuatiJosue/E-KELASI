"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { createAssignment, deleteAssignment } from "./actions";
import type { Assignment, FormOptions } from "@/lib/courses-db";

export function CoursesManager({ assignments, options }: { assignments: Assignment[]; options: FormOptions }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [staffId, setStaffId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [className, setClassName] = useState("");
  const [hours, setHours] = useState("");

  const grouped = useMemo(() => {
    const m = new Map<string, { name: string; items: Assignment[]; total: number }>();
    for (const a of assignments) {
      if (!m.has(a.staffId)) m.set(a.staffId, { name: a.staffName, items: [], total: 0 });
      const e = m.get(a.staffId)!;
      e.items.push(a);
      e.total += a.weeklyHours;
    }
    return [...m.values()].sort((x, y) => x.name.localeCompare(y.name));
  }, [assignments]);

  const add = () => {
    setError(null);
    if (!staffId || !subjectId || !className.trim()) { setError("Enseignant, matière et classe requis."); return; }
    startTransition(async () => {
      const r = await createAssignment({ staffId, subjectId, className, weeklyHours: parseFloat(hours.replace(",", ".")) || 0 });
      if (r.ok) { setSubjectId(""); setClassName(""); setHours(""); router.refresh(); }
      else setError(r.message);
    });
  };

  const remove = (id: string) => {
    startTransition(async () => {
      const r = await deleteAssignment(id);
      if (r.ok) router.refresh();
      else alert(r.message);
    });
  };

  const noData = options.teachers.length === 0 || options.subjects.length === 0;

  return (
    <>
      {/* Formulaire d'ajout */}
      <div className="ek-card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>Nouvelle attribution</div>

        {noData ? (
          <div style={{ fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.5 }}>
            {options.teachers.length === 0 && <>Ajoutez d&apos;abord des enseignants dans <strong>Personnel</strong>. </>}
            {options.subjects.length === 0 && <>Aucune matière trouvée — les matières apparaissent quand un professeur en crée (notes/devoirs).</>}
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
              <Field label="Enseignant">
                <select value={staffId} onChange={(e) => setStaffId(e.target.value)} style={inp}>
                  <option value="">— Choisir —</option>
                  {options.teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </Field>
              <Field label="Matière">
                <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} style={inp}>
                  <option value="">— Choisir —</option>
                  {options.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
              <Field label="Classe">
                <input list="class-list" value={className} onChange={(e) => setClassName(e.target.value)} placeholder="ex. 6e année primaire" style={inp} />
                <datalist id="class-list">
                  {options.classes.map((c) => <option key={c} value={c} />)}
                </datalist>
              </Field>
              <Field label="Heures / semaine">
                <input value={hours} onChange={(e) => setHours(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="ex. 4" inputMode="decimal" style={inp} />
              </Field>
            </div>
            {error && <div style={{ color: "var(--danger)", fontSize: 12, fontWeight: 600 }}>{error}</div>}
            <button onClick={add} disabled={pending} className="ek-btn ek-btn-primary" style={{ height: 36, fontSize: 13, alignSelf: "flex-start", opacity: pending ? 0.6 : 1 }}>
              <Icon name="plus" size={13} /> Attribuer
            </button>
          </>
        )}
      </div>

      {/* Liste par enseignant */}
      {grouped.length === 0 ? (
        <div className="ek-card" style={{ padding: 40, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
          Aucune attribution pour le moment.
        </div>
      ) : (
        grouped.map((g) => (
          <div key={g.name} className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{g.name}</div>
              <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--brand-600)", fontWeight: 700 }}>
                {g.total} h/sem
              </div>
            </div>
            {g.items.map((a, i) => (
              <div key={a.id} style={{ display: "grid", gridTemplateColumns: "1.4fr 1.4fr 0.7fr 0.4fr", padding: "10px 18px", alignItems: "center", fontSize: 12.5, borderTop: i > 0 ? "1px solid var(--divider)" : "none" }}>
                <div style={{ fontWeight: 600, color: "var(--ink)" }}>{a.subjectName}</div>
                <div style={{ color: "var(--ink-2)" }}>{a.className}</div>
                <div style={{ color: "var(--ink-3)" }}>{a.weeklyHours} h/sem</div>
                <div style={{ textAlign: "right" }}>
                  <button onClick={() => remove(a.id)} disabled={pending} title="Retirer" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", display: "flex", marginLeft: "auto", padding: 4 }}>
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-2)", marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

const inp: React.CSSProperties = {
  width: "100%", padding: "9px 10px", borderRadius: 9, border: "1px solid var(--border-strong)",
  background: "var(--surface)", fontSize: 13, color: "var(--ink)",
};
