"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { SexBadge } from "@/components/SexBadge";
import { T } from "@/lib/i18n";
import { Selector, ComboField, TextField } from "./grades-form/fields";
import { AttachmentPicker } from "@/components/AttachmentPicker";
import { fileToBase64 } from "@/lib/attachments";
import type { StudentRow } from "@/lib/teacher/classes";
import type { TeacherSubject } from "@/lib/teacher/profile";
import { submitGradesAction, type GradeInput } from "@/app/(teacher)/teacher/grades/actions";
import { TRIMESTERS, currentTrimester, trimesterOf, representativeDateForTrimester } from "@/lib/trimester";

type ClassOption = { key: string; label: string; className: string; option: string | null };

type Props = {
  classes: ClassOption[];
  subjects: TeacherSubject[];
  initialClassName: string;
  initialOption: string;
  initialStudents: StudentRow[];
};

export function GradesEntryForm({ classes, subjects, initialClassName, initialOption, initialStudents }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [classSel, setClassSel] = useState(() => {
    const c = classes.find((c) => c.className === initialClassName && (c.option ?? "") === (initialOption ?? ""));
    return c?.key ?? classes[0]?.key ?? "";
  });
  const [subjectName, setSubjectName] = useState(subjects[0]?.name ?? "");
  const [kind, setKind] = useState("Contrôle");
  const [maxScore, setMaxScore] = useState("20");
  const [coefficient, setCoefficient] = useState("1");
  const [gradedAt, setGradedAt] = useState(new Date().toISOString().slice(0, 10));
  const [trimester, setTrimester] = useState<number>(currentTrimester());
  const [scores, setScores] = useState<Record<string, string>>({});
  const [students, setStudents] = useState<StudentRow[]>(initialStudents);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sendPdf, setSendPdf] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const filledCount = Object.values(scores).filter((s) => s.trim() !== "").length;

  // Le trimestre et la date restent synchronisés : choisir un trimestre cale la
  // date dans ce trimestre ; changer la date met à jour le trimestre affiché.
  const onChangeTrimester = (v: string) => {
    const t = Number(v);
    setTrimester(t);
    setGradedAt(representativeDateForTrimester(t));
  };
  const onChangeDate = (v: string) => {
    setGradedAt(v);
    if (v) setTrimester(trimesterOf(v));
  };

  const onChangeClass = (key: string) => {
    setClassSel(key);
    setScores({});
    const c = classes.find((c) => c.key === key);
    // recharge la page avec la nouvelle classe (le server component refetch)
    router.replace(
      `/teacher/grades?class=${encodeURIComponent(c?.className ?? "")}&option=${encodeURIComponent(c?.option ?? "")}`
    );
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
    if (!subjectName.trim()) {
      setError("Indique une matière.");
      return;
    }

    startTransition(async () => {
      const attachments = await Promise.all(
        files.map(async (f) => ({ name: f.name, type: f.type, dataBase64: await fileToBase64(f) }))
      );
      const res = await submitGradesAction({
        subjectName: subjectName.trim(),
        kind,
        maxScore: parseFloat(maxScore),
        coefficient: parseFloat(coefficient),
        gradedAt,
        items,
        sendPdf,
        attachments,
      });
      if (res.ok) {
        const base = `${items.length} note${items.length > 1 ? "s" : ""} enregistrée${items.length > 1 ? "s" : ""}.`;
        const pdfPart = sendPdf && res.pdfsSent ? ` ${res.pdfsSent} note${res.pdfsSent > 1 ? "s" : ""} PDF envoyée${res.pdfsSent > 1 ? "s" : ""}.` : "";
        const filePart = files.length > 0 ? ` ${files.length} pièce${files.length > 1 ? "s" : ""} jointe${files.length > 1 ? "s" : ""} envoyée${files.length > 1 ? "s" : ""}.` : "";
        setSuccess(base + pdfPart + filePart);
        setScores({});
        setSendPdf(false);
        setFiles([]);
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  };

  return (
    <>
      <div className="ek-card" style={{ padding: 18 }}>
        <div className="ek-kpi-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 0.8fr 0.7fr 0.8fr 1fr", gap: 12 }}>
          <Selector label={<T fr="Classe" en="Class" />} value={classSel} onChange={onChangeClass} options={classes.map((c) => ({ value: c.key, label: c.label }))} />
          <ComboField
            label={<T fr="Matière" en="Subject" />}
            value={subjectName}
            onChange={setSubjectName}
            listId="grade-subject-suggestions"
            suggestions={subjects.map((s) => s.name)}
            placeholder="ex. Mathématiques"
          />
          <TextField
            label={<T fr="Type d'évaluation" en="Kind" />}
            value={kind}
            onChange={setKind}
            placeholder="Contrôle · Géométrie"
          />
          <TextField label={<T fr="Sur" en="Out of" />} value={maxScore} onChange={setMaxScore} type="number" />
          <TextField label={<T fr="Coef." en="Coef." />} value={coefficient} onChange={setCoefficient} type="number" step="0.5" />
          <Selector
            label={<T fr="Trimestre" en="Term" />}
            value={String(trimester)}
            onChange={onChangeTrimester}
            options={TRIMESTERS.map((m) => ({ value: String(m.index), label: m.short }))}
          />
          <TextField label={<T fr="Date" en="Date" />} value={gradedAt} onChange={onChangeDate} type="date" />
        </div>

        {/* Sujet, corrigé ou photo de l'évaluation — joints à toutes les notes saisies. */}
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--divider)" }}>
          <AttachmentPicker
            files={files}
            onChange={setFiles}
            onError={setError}
            disabled={pending}
            label={<T fr="Pièces jointes de l'évaluation (optionnel)" en="Assessment attachments (optional)" />}
            hint={<T fr="Sujet, corrigé ou photo de la copie · envoyé aux parents · 10 Mo max" en="Paper, answer key or photo · sent to parents · 10 MB max" />}
          />
        </div>
      </div>

      <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--divider)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
              <T fr="Notes des élèves" en="Student grades" />
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
              {filledCount}/{students.length} <T fr="notes saisies" en="grades entered" />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--ink-2)", cursor: "pointer", userSelect: "none" }}>
              <input
                type="checkbox"
                checked={sendPdf}
                onChange={(e) => setSendPdf(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "var(--brand)" }}
              />
              <T fr="Envoyer la note en PDF aux parents" en="Send the grade as PDF to parents" />
            </label>
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

        <div className="ek-tablewrap">
        <div style={{ minWidth: 480 }}>
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
                <SexBadge sex={s.sex} size={16} />
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
        </div>
      </div>
    </>
  );
}

