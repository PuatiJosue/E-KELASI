"use client";

// Rubriques libres définies par l'école (intitulé + valeur).

import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { Group, Field, inputStyle } from "@/components/form/FormLayout";
import type { StudentExtraField } from "@/app/(school)/school/students/actions";

export function ExtraFieldsSection({ extraFields, addExtra, setExtra, removeExtra }: {
  extraFields: StudentExtraField[];
  addExtra: () => void;
  setExtra: (i: number, patch: Partial<StudentExtraField>) => void;
  removeExtra: (i: number) => void;
}) {
  return (
    <Group title={<T fr="Rubriques personnalisées" en="Custom fields" />}>
      <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: -4 }}>
        <T
          fr="Ajoutez vos propres rubriques au dossier (matricule interne, bourse, transport…). Elles apparaîtront dans le dossier de l'élève."
          en="Add your own fields to the record (internal ID, scholarship, transport…). They show up in the student record."
        />
      </div>
      {extraFields.map((f, i) => (
        <div key={i} className="ek-stack-md" style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "end" }}>
          <Field label={<T fr="Intitulé" en="Label" />}>
            <input value={f.label} onChange={(e) => setExtra(i, { label: e.target.value })} placeholder="Groupe sanguin, Bourse…" style={inputStyle} />
          </Field>
          <Field label={<T fr="Valeur" en="Value" />}>
            <input value={f.value} onChange={(e) => setExtra(i, { value: e.target.value })} style={inputStyle} />
          </Field>
          <button
            type="button"
            onClick={() => removeExtra(i)}
            title="Retirer la rubrique"
            style={{ height: 40, padding: "0 10px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--danger)", cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <Icon name="close" size={15} />
          </button>
        </div>
      ))}
      <div>
        <button type="button" onClick={addExtra} className="ek-btn ek-btn-outline" style={{ height: 34, fontSize: 12 }}>
          <Icon name="plus" size={13} stroke={2.5} />
          <T fr="Ajouter une rubrique" en="Add a field" />
        </button>
      </div>
    </Group>
  );
}

