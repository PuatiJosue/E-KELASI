"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import type { TeacherSubject } from "@/lib/teacher-db";
import { addBookAction } from "@/app/(teacher)/teacher/library/actions";

const LEVELS = ["", "6e", "5e", "4e", "3e", "2nd", "1ère", "Tle"];

export function AddBookButton({ subjects }: { subjects: TeacherSubject[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await addBookAction({
        title: title.trim(),
        author: author.trim(),
        description: description.trim() || null,
        coverUrl: coverUrl.trim() || null,
        subjectId: subjectId || null,
        gradeLevel: gradeLevel || null,
      });
      if (res.ok) {
        setOpen(false);
        setTitle("");
        setAuthor("");
        setDescription("");
        setCoverUrl("");
        setSubjectId("");
        setGradeLevel("");
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="ek-btn ek-btn-primary" style={{ height: 32, fontSize: 12 }}>
        <Icon name="plus" size={14} stroke={2.5} />
        <T fr="Ajouter un livre" en="Add a book" />
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
            style={{ width: "100%", maxWidth: 540, padding: 24, maxHeight: "90vh", overflowY: "auto" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h2 style={{ fontSize: 18, fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--ink)" }}>
                <T fr="Ajouter un livre" en="Add a book" />
              </h2>
              <button type="button" onClick={() => setOpen(false)} style={{ padding: 4, color: "var(--ink-3)" }}>
                <Icon name="close" size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label={<T fr="Titre" en="Title" />}>
                <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Le Petit Prince" style={inputStyle} />
              </Field>
              <Field label={<T fr="Auteur" en="Author" />}>
                <input value={author} onChange={(e) => setAuthor(e.target.value)} required placeholder="Antoine de Saint-Exupéry" style={inputStyle} />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label={<T fr="Matière (optionnel)" en="Subject (optional)" />}>
                  <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} style={inputStyle}>
                    <option value="">— Aucune —</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={<T fr="Niveau (optionnel)" en="Level (optional)" />}>
                  <select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} style={inputStyle}>
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l || "— Tous —"}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label={<T fr="Description (optionnelle)" en="Description (optional)" />}>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Quelques lignes sur le livre…"
                  style={{ ...inputStyle, fontFamily: "inherit" }}
                />
              </Field>
              <Field label={<T fr="URL de couverture (optionnelle)" en="Cover URL (optional)" />}>
                <input
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="https://…/cover.jpg"
                  style={inputStyle}
                />
              </Field>
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
              <button type="submit" disabled={pending} className="ek-btn ek-btn-primary" style={{ flex: 2, opacity: pending ? 0.6 : 1 }}>
                {pending ? "Ajout…" : "Ajouter à la bibliothèque"}
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
