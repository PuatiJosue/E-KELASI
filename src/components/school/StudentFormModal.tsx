"use client";

// Fiche de renseignements de l'élève — même formulaire pour l'ajout et la
// modification. Les rubriques fixes (identité, scolarité, parents, santé,
// scolarité antérieure) sont complétées par des rubriques libres que l'école
// définit elle-même (label + valeur).

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { PROMOTION_LEVELS, PROMOTION_OPTIONS } from "@/lib/promotion";
import { createClient } from "@/lib/supabase/client";
import {
  addStudentAction,
  updateStudentAction,
  type StudentDocument,
  type StudentExtraField,
  type StudentFormValues,
} from "@/app/(school)/school/students/actions";

// `avatarUrl` peut être null côté dossier : on l'exclut pour le retyper.
export type StudentFormInitial = Partial<Omit<StudentFormValues, "avatarUrl">> & {
  avatarUrl?: string | null;
};

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
  const router = useRouter();
  const editing = Boolean(studentId);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);

  const v = <K extends keyof StudentFormValues>(k: K): string => (initial?.[k] as string) ?? "";

  // Identité
  const [lastName, setLastName] = useState(v("lastName"));
  const [middleName, setMiddleName] = useState(v("middleName"));
  const [firstName, setFirstName] = useState(v("firstName"));
  const [sex, setSex] = useState(v("sex"));
  const [birthPlace, setBirthPlace] = useState(v("birthPlace"));
  const [birthDate, setBirthDate] = useState(v("birthDate"));
  // Scolarité
  const [className, setClassName] = useState(v("className"));
  const [option, setOption] = useState(v("option"));
  const [enrolledAt, setEnrolledAt] = useState(
    initial?.enrolledAt ?? (editing ? "" : new Date().toISOString().slice(0, 10))
  );
  // Adresse & origine
  const [address, setAddress] = useState(v("address"));
  const [provinceOrigin, setProvinceOrigin] = useState(v("provinceOrigin"));
  // Parents / responsable
  const [fatherName, setFatherName] = useState(v("fatherName"));
  const [motherName, setMotherName] = useState(v("motherName"));
  const [guardianName, setGuardianName] = useState(v("guardianName"));
  const [guardianRelation, setGuardianRelation] = useState(v("guardianRelation"));
  const [guardianPhone, setGuardianPhone] = useState(v("guardianPhone"));
  // Santé & urgence
  const [bloodGroup, setBloodGroup] = useState(v("bloodGroup"));
  const [allergies, setAllergies] = useState(v("allergies"));
  const [medicalNotes, setMedicalNotes] = useState(v("medicalNotes"));
  const [emergencyContactName, setEmergencyContactName] = useState(v("emergencyContactName"));
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(v("emergencyContactPhone"));
  // Scolarité antérieure
  const [previousSchool, setPreviousSchool] = useState(v("previousSchool"));
  const [previousClass, setPreviousClass] = useState(v("previousClass"));
  // Observation
  const [observation, setObservation] = useState(v("observation"));
  // Rubriques libres
  const [extraFields, setExtraFields] = useState<StudentExtraField[]>(initial?.extraFields ?? []);

  // Documents déjà joints (modification) : conservés sauf suppression explicite.
  const [existingDocs, setExistingDocs] = useState<StudentDocument[]>(initial?.documents ?? []);

  const photoRef = useRef<HTMLInputElement>(null);
  const docsRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initial?.avatarUrl ?? null);

  const [error, setError] = useState<string | null>(null);

  const classSuggestions = [...new Set([...classNames, ...PROMOTION_LEVELS.map((l) => l.label)])];

  // Upload d'un fichier vers le bucket privé student-files → URL signée 1 an.
  const uploadFile = async (file: File, prefix: string): Promise<string | null> => {
    const supabase = createClient();
    const ext = (file.name.split(".").pop() || "bin").toLowerCase();
    const path = `${prefix}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("student-files").upload(path, file, { upsert: false });
    if (upErr) return null;
    const { data: signed } = await supabase.storage.from("student-files").createSignedUrl(path, 60 * 60 * 24 * 365);
    return signed?.signedUrl ?? null;
  };

  const addExtra = () => setExtraFields((prev) => [...prev, { label: "", value: "" }]);
  const setExtra = (i: number, patch: Partial<StudentExtraField>) =>
    setExtraFields((prev) => prev.map((f, k) => (k === i ? { ...f, ...patch } : f)));
  const removeExtra = (i: number) => setExtraFields((prev) => prev.filter((_, k) => k !== i));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!lastName.trim() || !firstName.trim() || !className.trim()) {
      setError("Nom, prénom et classe sont requis.");
      return;
    }

    const folder = `students/${studentId ?? crypto.randomUUID()}`;
    // Non défini = photo inchangée (en modification) / pas de photo (en création).
    let avatarUrl: string | undefined;
    const documents: StudentDocument[] = [...existingDocs];

    const photoFile = photoRef.current?.files?.[0];
    const docFiles = Array.from(docsRef.current?.files ?? []);

    if (photoFile || docFiles.length > 0) {
      setUploading(true);
      try {
        if (photoFile) {
          const url = await uploadFile(photoFile, `${folder}/photo`);
          if (!url) { setUploading(false); setError("Échec de l'envoi de la photo."); return; }
          avatarUrl = url;
        }
        for (const f of docFiles) {
          const url = await uploadFile(f, `${folder}/docs`);
          if (!url) { setUploading(false); setError(`Échec de l'envoi du document « ${f.name} ».`); return; }
          documents.push({ name: f.name, url });
        }
      } catch {
        setUploading(false); setError("Échec de l'envoi des fichiers."); return;
      }
      setUploading(false);
    }

    const values: StudentFormValues = {
      lastName, middleName, firstName, sex, birthDate, birthPlace,
      className, option, enrolledAt, address, provinceOrigin,
      fatherName, motherName, guardianName, guardianRelation, guardianPhone,
      bloodGroup, allergies, medicalNotes, emergencyContactName, emergencyContactPhone,
      previousSchool, previousClass,
      observation, avatarUrl, documents,
      extraFields: extraFields.filter((f) => f.label.trim()),
    };

    startTransition(async () => {
      const res = studentId
        ? await updateStudentAction({ studentId, ...values })
        : await addStudentAction(values);
      if (res.ok) {
        onClose();
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  };

  const busy = pending || uploading;

  return (
    <div
      onClick={() => !busy && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(20,16,10,0.45)", display: "grid", placeItems: "center", zIndex: 100, padding: 24 }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
        className="ek-card"
        style={{ width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", padding: 24 }}
      >
        <h2 style={{ fontSize: 18, fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>
          {editing
            ? <T fr="Modifier la fiche de l'élève" en="Edit student record" />
            : <T fr="Fiche de renseignements de l'élève" en="Student information sheet" />}
        </h2>
        <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginBottom: 16 }}>
          <T fr="Ordre : Nom, Post-nom, Prénom." en="Order: Last name, Middle name, First name." />
        </div>

        {/* Identité */}
        <Group title={<T fr="Identité" en="Identity" />}>
          <Row>
            <Field label={<T fr="Nom" en="Last name" />}>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="KABONGO" style={inputStyle} />
            </Field>
            <Field label={<T fr="Post-nom" en="Middle name" />}>
              <input value={middleName} onChange={(e) => setMiddleName(e.target.value)} placeholder="Mwamba" style={inputStyle} />
            </Field>
          </Row>
          <Row>
            <Field label={<T fr="Prénom" en="First name" />}>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="Amina" style={inputStyle} />
            </Field>
            <Field label={<T fr="Sexe" en="Sex" />}>
              <select value={sex} onChange={(e) => setSex(e.target.value)} style={inputStyle}>
                <option value="">—</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </Field>
          </Row>
          <Row>
            <Field label={<T fr="Lieu de naissance" en="Place of birth" />}>
              <input value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)} placeholder="Kinshasa" style={inputStyle} />
            </Field>
            <Field label={<T fr="Date de naissance" en="Date of birth" />}>
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} style={inputStyle} />
            </Field>
          </Row>
        </Group>

        {/* Scolarité */}
        <Group title={<T fr="Scolarité" en="Enrollment" />}>
          <Row>
            <Field label={<T fr="Inscrit(e) en (classe)" en="Enrolled in (class)" />}>
              <input value={className} onChange={(e) => setClassName(e.target.value)} required placeholder="1re A, 5e Humanités…" list="ek-student-classes" style={inputStyle} />
            </Field>
            <Field label={<T fr="Option / filière" en="Option" />}>
              <input value={option} onChange={(e) => setOption(e.target.value)} placeholder="Sciences… (facultatif)" list="ek-student-options" style={inputStyle} />
            </Field>
          </Row>
          <Row>
            <Field label={<T fr="Date d'inscription à l'école" en="Enrollment date" />}>
              <input type="date" value={enrolledAt} onChange={(e) => setEnrolledAt(e.target.value)} style={inputStyle} />
            </Field>
            <Field label={<T fr="Province d'origine" en="Province of origin" />}>
              <input value={provinceOrigin} onChange={(e) => setProvinceOrigin(e.target.value)} placeholder="Kongo-Central…" style={inputStyle} />
            </Field>
          </Row>
          <Field label={<T fr="Adresse de résidence" en="Home address" />}>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Commune, quartier, avenue, n°…" style={inputStyle} />
          </Field>
        </Group>

        {/* Parents / responsable */}
        <Group title={<T fr="Parents / Responsable" en="Parents / Guardian" />}>
          <Row>
            <Field label={<T fr="Nom du père" en="Father's name" />}>
              <input value={fatherName} onChange={(e) => setFatherName(e.target.value)} style={inputStyle} />
            </Field>
            <Field label={<T fr="Nom de la mère" en="Mother's name" />}>
              <input value={motherName} onChange={(e) => setMotherName(e.target.value)} style={inputStyle} />
            </Field>
          </Row>
          <Row>
            <Field label={<T fr="Nom du responsable" en="Guardian's name" />}>
              <input value={guardianName} onChange={(e) => setGuardianName(e.target.value)} style={inputStyle} />
            </Field>
            <Field label={<T fr="Degré de parenté" en="Relationship" />}>
              <input value={guardianRelation} onChange={(e) => setGuardianRelation(e.target.value)} placeholder="Père, Mère, Tuteur…" style={inputStyle} />
            </Field>
          </Row>
          <Field label={<T fr="Téléphone du responsable" en="Guardian's phone" />}>
            <input value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} inputMode="tel" placeholder="+243…" style={inputStyle} />
          </Field>
        </Group>

        {/* Santé & urgence */}
        <Group title={<T fr="Santé & urgence" en="Health & emergency" />}>
          <Row>
            <Field label={<T fr="Groupe sanguin" en="Blood type" />}>
              <input value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} placeholder="O+, A−…" style={inputStyle} />
            </Field>
            <Field label={<T fr="Allergies connues" en="Known allergies" />}>
              <input value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="Arachides, pénicilline…" style={inputStyle} />
            </Field>
          </Row>
          <Row>
            <Field label={<T fr="Personne à prévenir" en="Emergency contact" />}>
              <input value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} style={inputStyle} />
            </Field>
            <Field label={<T fr="Téléphone d'urgence" en="Emergency phone" />}>
              <input value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} inputMode="tel" placeholder="+243…" style={inputStyle} />
            </Field>
          </Row>
          <Field label={<T fr="Maladie chronique / traitement" en="Chronic condition / treatment" />}>
            <textarea value={medicalNotes} onChange={(e) => setMedicalNotes(e.target.value)} rows={2} placeholder="Asthme, drépanocytose, traitement en cours…" style={{ ...inputStyle, resize: "vertical" as const }} />
          </Field>
        </Group>

        {/* Scolarité antérieure */}
        <Group title={<T fr="Scolarité antérieure" en="Previous schooling" />}>
          <Row>
            <Field label={<T fr="École fréquentée avant" en="Previous school" />}>
              <input value={previousSchool} onChange={(e) => setPreviousSchool(e.target.value)} style={inputStyle} />
            </Field>
            <Field label={<T fr="Dernière classe suivie" en="Last class attended" />}>
              <input value={previousClass} onChange={(e) => setPreviousClass(e.target.value)} placeholder="6e primaire…" style={inputStyle} />
            </Field>
          </Row>
        </Group>

        {/* Rubriques libres */}
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

        {/* Photo & documents */}
        <Group title={<T fr="Photo & documents" en="Photo & documents" />}>
          <Row>
            <Field label={<T fr="Photo de l'enfant" en="Child's photo" />}>
              <input
                ref={photoRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setPhotoPreview(f ? URL.createObjectURL(f) : initial?.avatarUrl ?? null);
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
                    onClick={() => setExistingDocs((prev) => prev.filter((_, k) => k !== i))}
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

        {/* Observation */}
        <Group title={<T fr="Observation" en="Notes" />}>
          <textarea value={observation} onChange={(e) => setObservation(e.target.value)} rows={2} placeholder="Remarque éventuelle…" style={{ ...inputStyle, resize: "vertical" as const }} />
        </Group>

        <datalist id="ek-student-classes">
          {classSuggestions.map((c) => <option key={c} value={c} />)}
        </datalist>
        <datalist id="ek-student-options">
          {PROMOTION_OPTIONS.map((o) => <option key={o} value={o} />)}
        </datalist>

        {!editing && (
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.45, marginTop: 4 }}>
            <T
              fr="L'élève apparaîtra aussitôt dans l'annuaire et dans les présences."
              en="The student will immediately appear in the directory and attendance."
            />
          </div>
        )}

        {error && (
          <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "rgba(192,58,43,0.10)", color: "var(--danger)", fontSize: 12.5, fontWeight: 600 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button type="button" onClick={onClose} disabled={busy} className="ek-btn ek-btn-outline" style={{ flex: 1 }}>
            <T fr="Annuler" en="Cancel" />
          </button>
          <button type="submit" disabled={busy} className="ek-btn ek-btn-primary" style={{ flex: 1, opacity: busy ? 0.6 : 1 }}>
            {uploading ? "Envoi des fichiers…" : pending ? "Enregistrement…" : editing ? "Enregistrer" : "Ajouter"}
          </button>
        </div>
      </form>
    </div>
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

function Group({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="ek-stack-md" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>{children}</div>;
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>{label}</span>
      {children}
    </label>
  );
}
