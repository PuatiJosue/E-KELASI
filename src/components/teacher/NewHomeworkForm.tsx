"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/i18n";
import type { TeacherSubject } from "@/lib/teacher/profile";
import { AttachmentPicker } from "@/components/AttachmentPicker";
import { fileToBase64 } from "@/lib/attachments";
import { createHomeworkAction } from "@/app/(teacher)/teacher/homework/actions";

export function NewHomeworkForm({ classes, subjects }: { classes: string[]; subjects: TeacherSubject[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDueAt = tomorrow.toISOString().slice(0, 16);

  const [className, setClassName] = useState(classes[0] ?? "");
  const [subjectName, setSubjectName] = useState(subjects[0]?.name ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState(defaultDueAt);
  const [files, setFiles] = useState<File[]>([]);

  const onSubmit = () => {
    setError(null);
    if (!title.trim() || !className || !subjectName.trim()) {
      setError("Titre, classe et matière sont requis.");
      return;
    }
    startTransition(async () => {
      const attachments = await Promise.all(
        files.map(async (f) => ({ name: f.name, type: f.type, dataBase64: await fileToBase64(f) }))
      );
      const res = await createHomeworkAction({
        className,
        subjectName: subjectName.trim(),
        title: title.trim(),
        description: description.trim() || null,
        dueAt: new Date(dueAt).toISOString(),
        attachments,
      });
      if (res.ok) router.push("/teacher/homework");
      else setError(res.message);
    });
  };

  return (
    <div className="ek-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
      <Row label={<T fr="Classe" en="Class" />}>
        <select value={className} onChange={(e) => setClassName(e.target.value)} style={inputStyle}>
          {classes.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Row>
      <Row label={<T fr="Matière" en="Subject" />}>
        <input
          value={subjectName}
          onChange={(e) => setSubjectName(e.target.value)}
          list="homework-subject-suggestions"
          placeholder="ex. Mathématiques"
          autoComplete="off"
          style={inputStyle}
        />
        <datalist id="homework-subject-suggestions">
          {subjects.map((s) => <option key={s.id} value={s.name} />)}
        </datalist>
      </Row>
      <Row label={<T fr="Titre du devoir" en="Title" />}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Exercices p.142 · 1 à 7" style={inputStyle} />
      </Row>
      <Row label={<T fr="Description (optionnelle)" en="Description (optional)" />}>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} style={{ ...inputStyle, fontFamily: "inherit" }} />
      </Row>
      <Row label={<T fr="Échéance" en="Due date" />}>
        <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} style={inputStyle} />
      </Row>

      {/* Énoncé scanné, feuille d'exercices, photo de la page du manuel… */}
      <AttachmentPicker
        files={files}
        onChange={setFiles}
        onError={setError}
        disabled={pending}
        label={<T fr="Pièces jointes (optionnel)" en="Attachments (optional)" />}
        hint={<T fr="Énoncé, feuille d'exercices ou photo · 10 Mo max" en="Worksheet, exercise sheet or photo · 10 MB max" />}
      />

      {error && (
        <div style={{ padding: 10, borderRadius: 8, background: "rgba(192,58,43,0.08)", color: "var(--danger)", fontSize: 12.5, fontWeight: 600 }}>
          ⚠ {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        <button onClick={() => router.back()} className="ek-btn ek-btn-outline" style={{ flex: 1 }}>
          <T fr="Annuler" en="Cancel" />
        </button>
        <button onClick={onSubmit} disabled={pending} className="ek-btn ek-btn-primary" style={{ flex: 2, opacity: pending ? 0.6 : 1 }}>
          {pending ? "Création…" : "Créer et notifier les parents"}
        </button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--ink)",
  fontSize: 14,
  width: "100%",
};

function Row({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>{label}</span>
      {children}
    </label>
  );
}
