"use client";

// Photo de l'enfant et documents joints (nouveaux + déjà enregistrés).

import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { Group, Row, Field } from "@/components/form/FormLayout";
import type { StudentDocument } from "@/app/(school)/school/students/actions";

export function FilesSection({ photoRef, docsRef, photoPreview, setPhotoPreview, initialAvatarUrl, existingDocs, removeDoc }: {
  photoRef: React.RefObject<HTMLInputElement>;
  docsRef: React.RefObject<HTMLInputElement>;
  photoPreview: string | null;
  setPhotoPreview: (v: string | null) => void;
  initialAvatarUrl: string | null;
  existingDocs: StudentDocument[];
  removeDoc: (i: number) => void;
}) {
  return (
    <Group title={<T fr="Photo & documents" en="Photo & documents" />}>
      <Row>
        <Field label={<T fr="Photo de l'enfant" en="Child's photo" />}>
          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setPhotoPreview(f ? URL.createObjectURL(f) : initialAvatarUrl);
            }}
            style={{ fontSize: 12, color: "var(--ink-2)" }}
          />
          {photoPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="" style={{ marginTop: 8, width: 56, height: 56, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }} />
          )}
        </Field>
        <Field label={<T fr="Documents (PDF / images)" en="Documents (PDF / images)" />}>
          <input ref={docsRef} type="file" accept="image/*,application/pdf" multiple style={{ fontSize: 12, color: "var(--ink-2)" }} />
          <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 4 }}>
            <T fr="Acte de naissance, bulletin précédent, etc." en="Birth certificate, previous report, etc." />
          </div>
        </Field>
      </Row>
      {existingDocs.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {existingDocs.map((doc, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: "var(--surface-2)", fontSize: 11.5, color: "var(--ink-2)" }}>
              <Icon name="file" size={12} /> {doc.name || `Document ${i + 1}`}
              <button
                type="button"
                onClick={() => removeDoc(i)}
                title="Retirer ce document"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", display: "flex", padding: 0 }}
              >
                <Icon name="close" size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </Group>
  );
}

