"use client";

// Sélecteur de pièces jointes : un bouton « Fichier » (PDF, doc, image) et un
// bouton « Photo » (qui ouvre directement l'appareil photo sur mobile).
// Utilisé par la saisie des notes et la création d'un devoir côté professeur.

import { useRef } from "react";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { ATTACHMENT_ACCEPT, PHOTO_ACCEPT, MAX_ATTACHMENTS, MAX_ATTACHMENT_BYTES, isImageType } from "@/lib/attachments";

export function AttachmentPicker({
  files,
  onChange,
  onError,
  disabled,
  label,
  hint,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  onError?: (message: string | null) => void;
  disabled?: boolean;
  label?: React.ReactNode;
  hint?: React.ReactNode;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const add = (picked: FileList | null) => {
    onError?.(null);
    const next = [...files];
    for (const f of Array.from(picked ?? [])) {
      if (f.size > MAX_ATTACHMENT_BYTES) { onError?.(`« ${f.name} » dépasse 10 Mo.`); continue; }
      if (next.length >= MAX_ATTACHMENTS) { onError?.(`Maximum ${MAX_ATTACHMENTS} pièces jointes.`); break; }
      if (next.some((x) => x.name === f.name && x.size === f.size)) continue;
      next.push(f);
    }
    onChange(next);
    if (fileRef.current) fileRef.current.value = "";
    if (photoRef.current) photoRef.current.value = "";
  };

  const remove = (idx: number) => { onError?.(null); onChange(files.filter((_, i) => i !== idx)); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>
        {label ?? <T fr="Pièces jointes (optionnel)" en="Attachments (optional)" />}
      </span>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          className="ek-btn ek-btn-outline"
          style={{ height: 34, fontSize: 12.5, opacity: disabled ? 0.6 : 1 }}
        >
          <Icon name="paperclip" size={14} /> <T fr="Joindre un fichier" en="Attach a file" />
        </button>
        <button
          type="button"
          onClick={() => photoRef.current?.click()}
          disabled={disabled}
          className="ek-btn ek-btn-outline"
          style={{ height: 34, fontSize: 12.5, opacity: disabled ? 0.6 : 1 }}
        >
          <Icon name="camera" size={14} /> <T fr="Joindre une photo" en="Attach a photo" />
        </button>
        <span style={{ fontSize: 11, color: "var(--ink-3)" }}>
          {hint ?? <T fr="PDF, Word, Excel ou image · 10 Mo max" en="PDF, Word, Excel or image · 10 MB max" />}
        </span>
      </div>

      <input ref={fileRef} type="file" multiple accept={ATTACHMENT_ACCEPT} onChange={(e) => add(e.target.files)} style={{ display: "none" }} />
      <input ref={photoRef} type="file" accept={PHOTO_ACCEPT} capture="environment" onChange={(e) => add(e.target.files)} style={{ display: "none" }} />

      {files.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {files.map((f, i) => (
            <div key={`${f.name}-${i}`} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ink-2)" }}>
              <Icon name={isImageType(f.type) ? "camera" : "file"} size={13} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 260 }}>{f.name}</span>
              <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{(f.size / 1024).toFixed(0)} Ko</span>
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={disabled}
                style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: 11 }}
              >
                <T fr="retirer" en="remove" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
