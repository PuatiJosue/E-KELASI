"use client";

// Sections purement présentationnelles de la fiche élève : elles ne lisent que
// `f` et n'écrivent que par `set`.

import { T } from "@/lib/i18n";
import { Group, Row, Field, inputStyle } from "@/components/form/FormLayout";
import type { StudentFields, StudentTextField } from "./useStudentForm";

type SectionProps = { f: StudentFields; set: (k: StudentTextField, v: string) => void };

// Identité
export function IdentitySection({ f, set }: SectionProps) {
  return (
    <Group title={<T fr="Identité" en="Identity" />}>
      <Row>
        <Field label={<T fr="Nom" en="Last name" />}>
          <input value={f.lastName} onChange={(e) => set("lastName", e.target.value)} required placeholder="KABONGO" style={inputStyle} />
        </Field>
        <Field label={<T fr="Post-nom" en="Middle name" />}>
          <input value={f.middleName} onChange={(e) => set("middleName", e.target.value)} placeholder="Mwamba" style={inputStyle} />
        </Field>
      </Row>
      <Row>
        <Field label={<T fr="Prénom" en="First name" />}>
          <input value={f.firstName} onChange={(e) => set("firstName", e.target.value)} required placeholder="Amina" style={inputStyle} />
        </Field>
        <Field label={<T fr="Sexe" en="Sex" />}>
          <select value={f.sex} onChange={(e) => set("sex", e.target.value)} style={inputStyle}>
            <option value="">—</option>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </select>
        </Field>
      </Row>
      <Row>
        <Field label={<T fr="Lieu de naissance" en="Place of birth" />}>
          <input value={f.birthPlace} onChange={(e) => set("birthPlace", e.target.value)} placeholder="Kinshasa" style={inputStyle} />
        </Field>
        <Field label={<T fr="Date de naissance" en="Date of birth" />}>
          <input type="date" value={f.birthDate} onChange={(e) => set("birthDate", e.target.value)} style={inputStyle} />
        </Field>
      </Row>
    </Group>
  );
}

// Scolarité
export function EnrollmentSection({ f, set }: SectionProps) {
  return (
    <Group title={<T fr="Scolarité" en="Enrollment" />}>
      <Row>
        <Field label={<T fr="Inscrit(e) en (classe)" en="Enrolled in (class)" />}>
          <input value={f.className} onChange={(e) => set("className", e.target.value)} required placeholder="1re A, 5e Humanités…" list="ek-student-classes" style={inputStyle} />
        </Field>
        <Field label={<T fr="Option / filière" en="Option" />}>
          <input value={f.option} onChange={(e) => set("option", e.target.value)} placeholder="Sciences… (facultatif)" list="ek-student-options" style={inputStyle} />
        </Field>
      </Row>
      <Row>
        <Field label={<T fr="Date d'inscription à l'école" en="Enrollment date" />}>
          <input type="date" value={f.enrolledAt} onChange={(e) => set("enrolledAt", e.target.value)} style={inputStyle} />
        </Field>
        <Field label={<T fr="Province d'origine" en="Province of origin" />}>
          <input value={f.provinceOrigin} onChange={(e) => set("provinceOrigin", e.target.value)} placeholder="Kongo-Central…" style={inputStyle} />
        </Field>
      </Row>
      <Field label={<T fr="Adresse de résidence" en="Home address" />}>
        <input value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="Commune, quartier, avenue, n°…" style={inputStyle} />
      </Field>
    </Group>
  );
}

// Parents / responsable
export function ParentsSection({ f, set }: SectionProps) {
  return (
    <Group title={<T fr="Parents / Responsable" en="Parents / Guardian" />}>
      <Row>
        <Field label={<T fr="Nom du père" en="Father's name" />}>
          <input value={f.fatherName} onChange={(e) => set("fatherName", e.target.value)} style={inputStyle} />
        </Field>
        <Field label={<T fr="Nom de la mère" en="Mother's name" />}>
          <input value={f.motherName} onChange={(e) => set("motherName", e.target.value)} style={inputStyle} />
        </Field>
      </Row>
      <Row>
        <Field label={<T fr="Nom du responsable" en="Guardian's name" />}>
          <input value={f.guardianName} onChange={(e) => set("guardianName", e.target.value)} style={inputStyle} />
        </Field>
        <Field label={<T fr="Degré de parenté" en="Relationship" />}>
          <input value={f.guardianRelation} onChange={(e) => set("guardianRelation", e.target.value)} placeholder="Père, Mère, Tuteur…" style={inputStyle} />
        </Field>
      </Row>
      <Field label={<T fr="Téléphone du responsable" en="Guardian's phone" />}>
        <input value={f.guardianPhone} onChange={(e) => set("guardianPhone", e.target.value)} inputMode="tel" placeholder="+243…" style={inputStyle} />
      </Field>
    </Group>
  );
}

// Santé & urgence
export function HealthSection({ f, set }: SectionProps) {
  return (
    <Group title={<T fr="Santé & urgence" en="Health & emergency" />}>
      <Row>
        <Field label={<T fr="Groupe sanguin" en="Blood type" />}>
          <input value={f.bloodGroup} onChange={(e) => set("bloodGroup", e.target.value)} placeholder="O+, A−…" style={inputStyle} />
        </Field>
        <Field label={<T fr="Allergies connues" en="Known allergies" />}>
          <input value={f.allergies} onChange={(e) => set("allergies", e.target.value)} placeholder="Arachides, pénicilline…" style={inputStyle} />
        </Field>
      </Row>
      <Row>
        <Field label={<T fr="Personne à prévenir" en="Emergency contact" />}>
          <input value={f.emergencyContactName} onChange={(e) => set("emergencyContactName", e.target.value)} style={inputStyle} />
        </Field>
        <Field label={<T fr="Téléphone d'urgence" en="Emergency phone" />}>
          <input value={f.emergencyContactPhone} onChange={(e) => set("emergencyContactPhone", e.target.value)} inputMode="tel" placeholder="+243…" style={inputStyle} />
        </Field>
      </Row>
      <Field label={<T fr="Maladie chronique / traitement" en="Chronic condition / treatment" />}>
        <textarea value={f.medicalNotes} onChange={(e) => set("medicalNotes", e.target.value)} rows={2} placeholder="Asthme, drépanocytose, traitement en cours…" style={{ ...inputStyle, resize: "vertical" as const }} />
      </Field>
    </Group>
  );
}

// Scolarité antérieure
export function PreviousSchoolSection({ f, set }: SectionProps) {
  return (
    <Group title={<T fr="Scolarité antérieure" en="Previous schooling" />}>
      <Row>
        <Field label={<T fr="École fréquentée avant" en="Previous school" />}>
          <input value={f.previousSchool} onChange={(e) => set("previousSchool", e.target.value)} style={inputStyle} />
        </Field>
        <Field label={<T fr="Dernière classe suivie" en="Last class attended" />}>
          <input value={f.previousClass} onChange={(e) => set("previousClass", e.target.value)} placeholder="6e primaire…" style={inputStyle} />
        </Field>
      </Row>
    </Group>
  );
}

// Observation
export function ObservationSection({ f, set }: SectionProps) {
  return (
    <Group title={<T fr="Observation" en="Notes" />}>
      <textarea value={f.observation} onChange={(e) => set("observation", e.target.value)} rows={2} placeholder="Remarque éventuelle…" style={{ ...inputStyle, resize: "vertical" as const }} />
    </Group>
  );
}

