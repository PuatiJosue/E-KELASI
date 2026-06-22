"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { CoverPicker } from "@/components/teacher/CoverPicker";
import { createPlatformBook } from "@/app/(admin)/library/actions";

const LEVELS = ["", "Maternelle", "Primaire", "6e", "5e", "4e", "3e", "2nd", "1ère", "Tle", "Humanités", "Université"];

export function AdminBookForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [gradeLevel, setGradeLevel] = useState("");
  const [price, setPrice] = useState("");

  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileFormat, setFileFormat] = useState<"pdf" | "epub" | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setTitle(""); setAuthor(""); setDescription(""); setCoverUrl(null);
    setGradeLevel(""); setPrice(""); setFilePath(null); setFileFormat(null);
    setFileName(""); setError(null);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (ext !== "pdf" && ext !== "epub") {
      setError("Format non supporté. Choisis un fichier PDF ou EPUB.");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError("Fichier trop gros (100 MB max).");
      return;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const path = `platform/${crypto.randomUUID()}.${ext}`;
      const contentType = ext === "pdf" ? "application/pdf" : "application/epub+zip";
      const { error: upErr } = await supabase.storage
        .from("library-files")
        .upload(path, file, { upsert: false, contentType });
      if (upErr) {
        if (upErr.message.toLowerCase().includes("bucket") || upErr.message.toLowerCase().includes("not found")) {
          setError("Storage indisponible en local. Déploie sur Supabase Cloud pour uploader.");
        } else {
          setError(upErr.message);
        }
        return;
      }
      setFilePath(path);
      setFileFormat(ext as "pdf" | "epub");
      setFileName(file.name);
    } catch (e: any) {
      setError(e?.message ?? "Erreur upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!filePath || !fileFormat) {
      setError("Ajoute le fichier PDF ou EPUB du livre.");
      return;
    }
    const priceNum = parseFloat(price.replace(",", ".") || "0");
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setError("Prix invalide.");
      return;
    }
    startTransition(async () => {
      const res = await createPlatformBook({
        title: title.trim(),
        author: author.trim(),
        description: description.trim() || null,
        coverUrl,
        gradeLevel: gradeLevel || null,
        filePath,
        fileFormat,
        priceCents: Math.round(priceNum * 100),
        currency: "USD",
      });
      if (res.ok) {
        setOpen(false);
        reset();
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
          style={{ position: "fixed", inset: 0, background: "rgba(20,16,10,0.45)", display: "grid", placeItems: "center", zIndex: 100, padding: 24 }}
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
                <Field label={<T fr="Niveau (optionnel)" en="Level (optional)" />}>
                  <select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} style={inputStyle}>
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>{l || "— Tous —"}</option>
                    ))}
                  </select>
                </Field>
                <Field label={<T fr="Prix (USD) — 0 = gratuit" en="Price (USD) — 0 = free" />}>
                  <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="ex. 2.50" style={inputStyle} />
                </Field>
              </div>
              <Field label={<T fr="Description (optionnelle)" en="Description (optional)" />}>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Quelques lignes sur le livre…" style={{ ...inputStyle, fontFamily: "inherit" }} />
              </Field>

              <Field label={<T fr="Fichier du livre (PDF ou EPUB)" en="Book file (PDF or EPUB)" />}>
                <input ref={fileRef} type="file" accept=".pdf,.epub,application/pdf,application/epub+zip" onChange={onFile} style={{ display: "none" }} />
                {filePath ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, borderRadius: 10, background: "var(--surface-2)" }}>
                    <Icon name="file" size={16} />
                    <span style={{ flex: 1, fontSize: 12.5, color: "var(--ink-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {fileName} ({fileFormat?.toUpperCase()})
                    </span>
                    <button type="button" onClick={() => { setFilePath(null); setFileFormat(null); setFileName(""); }} style={{ color: "var(--ink-3)", padding: 4 }}>
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    style={{ padding: 14, borderRadius: 10, border: "1.5px dashed var(--border-strong)", background: "var(--surface)", color: "var(--ink-2)", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: uploading ? 0.6 : 1 }}
                  >
                    <Icon name="upload" size={16} />
                    {uploading ? "Upload en cours…" : "Choisir un PDF ou EPUB (100 MB max)"}
                  </button>
                )}
              </Field>

              <Field label={<T fr="Couverture (optionnelle)" en="Cover (optional)" />}>
                <CoverPicker value={coverUrl} onChange={setCoverUrl} />
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
              <button type="submit" disabled={pending || uploading} className="ek-btn ek-btn-primary" style={{ flex: 2, opacity: pending || uploading ? 0.6 : 1 }}>
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
  padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border-strong)",
  background: "var(--surface)", color: "var(--ink)", fontSize: 13, width: "100%",
};

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>{label}</span>
      {children}
    </label>
  );
}
