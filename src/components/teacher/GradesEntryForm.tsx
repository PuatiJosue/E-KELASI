"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import type { StudentRow, TeacherSubject } from "@/lib/teacher-db";
import { submitGradesAction, type GradeInput } from "@/app/(teacher)/teacher/grades/actions";

type Props = {
  classes: string[];
  subjects: TeacherSubject[];
  initialClassName: string;
  initialStudents: StudentRow[];
};

export function GradesEntryForm({ classes, subjects, initialClassName, initialStudents }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [className, setClassName] = useState(initialClassName);
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [kind, setKind] = useState("Contrôle");
  const [maxScore, setMaxScore] = useState("20");
  const [coefficient, setCoefficient] = useState("1");
  const [gradedAt, setGradedAt] = useState(new Date().toISOString().slice(0, 10));
  const [scores, setScores] = useState<Record<string, string>>({});
  const [students, setStudents] = useState<StudentRow[]>(initialStudents);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filledCount = Object.values(scores).filter((s) => s.trim() !== "").length;

  const onChangeClass = (c: string) => {
    setClassName(c);
    setScores({});
    // recharge la page avec la nouvelle classe (le server component refetch)
    router.replace(`/teacher/grades?class=${encodeURIComponent(c)}`);
  };

  const onSubmit = () => {
    setError(null);
    setSuccess(null);
    const items: GradeInput[] = Object.entries(scores)
      .filter(([, v]) => v.trim() !== "")
      .map(([studentId, v]) => ({
        studentId,
        score: parseFloat(v.replace(",", ".")),
      }));

    if (items.length === 0) {
      setError("Aucune note saisie.");
      return;
    }
    if (!subjectId) {
      setError("Sélectionne une matière.");
      return;
    }

    startTransition(async () => {
      const res = await submitGradesAction({
        subjectId,
        kind,
        maxScore: parseFloat(maxScore),
        coefficient: parseFloat(coefficient),
        gradedAt,
        items,
      });
      if (res.ok) {
        setSuccess(`${items.length} note${items.length > 1 ? "s" : ""} enregistrée${items.length > 1 ? "s" : ""}.`);
        setScores({});
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  };

  return (
    <>
      <div className="ek-card" style={{ padding: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 0.8fr 0.8fr 1fr", gap: 12 }}>
          <Selector label={<T fr="Classe" en="Class" />} value={className} onChange={onChangeClass} options={classes.map((c) => ({ value: c, label: c }))} />
          <Selector
            label={<T fr="Matière" en="Subject" />}
            value={subjectId}
            onChange={setSubjectId}
            options={subjects.map((s) => ({ value: s.id, label: s.name }))}
          />
          <TextField
            label={<T fr="Type d'évaluation" en="Kind" />}
            value={kind}
            onChange={setKind}
            placeholder="Contrôle · Géométrie"
          />
          <TextField label={<T fr="Sur" en="Out of" />} value={maxScore} onChange={setMaxScore} type="number" />
          <TextField label={<T fr="Coef." en="Coef." />} value={coefficient} onChange={setCoefficient} type="number" step="0.5" />
          <TextField label={<T fr="Date" en="Date" />} value={gradedAt} onChange={setGradedAt} type="date" />
        </div>
      </div>

      <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--divider)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
              <T fr="Notes des élèves" en="Student grades" />
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
              {filledCount}/{students.length} <T fr="notes saisies" en="grades entered" />
            </div>
          </div>
          <button
            onClick={onSubmit}
            disabled={pending || filledCount === 0}
            className="ek-btn ek-btn-primary"
            style={{ height: 36, fontSize: 13, opacity: pending || filledCount === 0 ? 0.5 : 1 }}
          >
            <Icon name="check" size={14} stroke={2.5} />
            {pending ? "Envoi…" : `Enregistrer ${filledCount > 0 ? `(${filledCount})` : ""}`}
          </button>
        </div>

        {success && (
          <div style={{ padding: "10px 18px", background: "var(--accent-50)", color: "var(--accent)", fontSize: 12.5, fontWeight: 600, borderBottom: "1px solid var(--divider)" }}>
            ✓ {success}
          </div>
        )}
        {error && (
          <div style={{ padding: "10px 18px", background: "rgba(192,58,43,0.08)", color: "var(--danger)", fontSize: 12.5, fontWeight: 600, borderBottom: "1px solid var(--divider)" }}>
            ⚠ {error}
          </div>
        )}

        {students.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--ink-3)", fontSize: 12 }}>
            <T fr="Aucun élève dans cette classe." en="No students in this class." />
          </div>
        ) : (
          students.map((s, i) => (
            <div
              key={s.id}
              style={{
                display: "grid",
                gridTemplateColumns: "0.4fr 2fr 1fr 1fr",
                padding: "10px 18px",
                alignItems: "center",
                borderBottom: i < students.length - 1 ? "1px solid var(--divider)" : "none",
                background: scores[s.id] ? "var(--brand-50)" : "transparent",
              }}
            >
              <div style={{ color: "var(--ink-3)", fontSize: 12, fontFamily: "var(--font-display)" }}>{i + 1}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={s.fullName} size={30} />
                <span style={{ fontWeight: 600, color: "var(--ink)", fontSize: 13.5 }}>{s.fullName}</span>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                <T fr="Moyenne actuelle" en="Current avg" /> :{" "}
                <span style={{ color: "var(--ink-2)", fontWeight: 600 }}>
                  {s.avg !== null ? `${s.avg}/20` : "—"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                <input
                  inputMode="decimal"
                  value={scores[s.id] ?? ""}
                  onChange={(e) => setScores((prev) => ({ ...prev, [s.id]: e.target.value }))}
                  placeholder="—"
                  style={{
                    width: 80,
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid var(--border-strong)",
                    background: "var(--surface)",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--ink)",
                    fontFamily: "var(--font-display)",
                    textAlign: "right",
                  }}
                />
                <span style={{ fontSize: 12, color: "var(--ink-3)" }}>/{maxScore}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function Selector({
  label,
  value,
  onChange,
  options,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "9px 10px",
          borderRadius: 8,
          border: "1px solid var(--border-strong)",
          background: "var(--surface)",
          color: "var(--ink)",
          fontSize: 13,
          fontFamily: "inherit",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  ...rest
}: {
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  type?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</span>
      <input
        {...rest}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "9px 10px",
          borderRadius: 8,
          border: "1px solid var(--border-strong)",
          background: "var(--surface)",
          color: "var(--ink)",
          fontSize: 13,
          fontFamily: "inherit",
        }}
      />
    </label>
  );
}
