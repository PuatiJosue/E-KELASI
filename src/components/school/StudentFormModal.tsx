"use client";

// Fiche de renseignements de l'élève — même formulaire pour l'ajout et la
// modification. Les rubriques fixes (identité, scolarité, parents, santé,
// scolarité antérieure) sont complétées par des rubriques libres que l'école
// définit elle-même (label + valeur).
//
// L'état et la soumission vivent dans useStudentForm ; ce composant ne fait
// qu'assembler les sections.

import { T } from "@/lib/i18n";
import { PROMOTION_LEVELS, PROMOTION_OPTIONS } from "@/lib/promotion";
import { useStudentForm } from "./student-form/useStudentForm";
import {
  IdentitySection, EnrollmentSection, ParentsSection,
  HealthSection, PreviousSchoolSection, ObservationSection,
} from "./student-form/sections";
import { ExtraFieldsSection } from "./student-form/ExtraFieldsSection";
import { FilesSection } from "./student-form/FilesSection";
import type { StudentFormInitial } from "./student-form/types";

export type { StudentFormInitial };

export function StudentFormModal({
  studentId,
  initial,
  classNames = [],
  onClose,
}: {
  /** Absent → création. Présent → modification de cet élève. */
  studentId?: string;
  initial?: StudentFormInitial;
  classNames?: string[];
  onClose: () => void;
}) {
  const s = useStudentForm({ studentId, initial, onClose });
  const classSuggestions = [...new Set([...classNames, ...PROMOTION_LEVELS.map((l) => l.label)])];

  return (
    <div
      onClick={() => !s.busy && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(20,16,10,0.45)", display: "grid", placeItems: "center", zIndex: 100, padding: 24 }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={s.onSubmit}
        className="ek-card"
        style={{ width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", padding: 24 }}
      >
        <h2 style={{ fontSize: 18, fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>
          {s.editing
            ? <T fr="Modifier la fiche de l'élève" en="Edit student record" />
            : <T fr="Fiche de renseignements de l'élève" en="Student information sheet" />}
        </h2>
        <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginBottom: 16 }}>
          <T fr="Ordre : Nom, Post-nom, Prénom." en="Order: Last name, Middle name, First name." />
        </div>

        <IdentitySection f={s.fields} set={s.set} />
        <EnrollmentSection f={s.fields} set={s.set} />
        <ParentsSection f={s.fields} set={s.set} />
        <HealthSection f={s.fields} set={s.set} />
        <PreviousSchoolSection f={s.fields} set={s.set} />

        <ExtraFieldsSection
          extraFields={s.extraFields}
          addExtra={s.addExtra}
          setExtra={s.setExtra}
          removeExtra={s.removeExtra}
        />

        <FilesSection
          photoRef={s.photoRef}
          docsRef={s.docsRef}
          photoPreview={s.photoPreview}
          setPhotoPreview={s.setPhotoPreview}
          initialAvatarUrl={initial?.avatarUrl ?? null}
          existingDocs={s.existingDocs}
          removeDoc={s.removeDoc}
        />

        <ObservationSection f={s.fields} set={s.set} />

        <datalist id="ek-student-classes">
          {classSuggestions.map((c) => <option key={c} value={c} />)}
        </datalist>
        <datalist id="ek-student-options">
          {PROMOTION_OPTIONS.map((o) => <option key={o} value={o} />)}
        </datalist>

        {!s.editing && (
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.45, marginTop: 4 }}>
            <T
              fr="L'élève apparaîtra aussitôt dans l'annuaire et dans les présences."
              en="The student will immediately appear in the directory and attendance."
            />
          </div>
        )}

        {s.error && (
          <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "rgba(192,58,43,0.10)", color: "var(--danger)", fontSize: 12.5, fontWeight: 600 }}>
            {s.error}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button type="button" onClick={onClose} disabled={s.busy} className="ek-btn ek-btn-outline" style={{ flex: 1 }}>
            <T fr="Annuler" en="Cancel" />
          </button>
          <button type="submit" disabled={s.busy} className="ek-btn ek-btn-primary" style={{ flex: 1, opacity: s.busy ? 0.6 : 1 }}>
            {s.uploading ? "Envoi des fichiers…" : s.pending ? "Enregistrement…" : s.editing ? "Enregistrer" : "Ajouter"}
          </button>
        </div>
      </form>
    </div>
  );
}
