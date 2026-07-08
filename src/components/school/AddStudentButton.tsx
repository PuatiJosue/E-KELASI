"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { PROMOTION_LEVELS, PROMOTION_OPTIONS } from "@/lib/promotion";
import { createClient } from "@/lib/supabase/client";
import { addStudentAction, type StudentDocument } from "@/app/(school)/school/students/actions";

export function AddStudentButton({ classNames = [] }: { classNames?: string[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);

  // Identité
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [sex, setSex] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [birthDate, setBirthDate] = useState("");
  // Scolarité
  const [className, setClassName] = useState("");
  const [option, setOption] = useState("");
  const [enrolledAt, setEnrolledAt] = useState(new Date().toISOString().slice(0, 10));
  // Adresse & origine
  const [address, setAddress] = useState("");
  const [provinceOrigin, setProvinceOrigin] = useState("");
  // Parents / responsable
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianRelation, setGuardianRelation] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [observation, setObservation] = useState("");

  const photoRef = useRef<HTMLInputElement>(null);
  const docsRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const classSuggestions = [...new Set([...classNames, ...PROMOTION_LEVELS.map((l) => l.label)])];

  const reset = () => {
    setLastName(""); setMiddleName(""); setFirstName(""); setSex(""); setBirthPlace(""); setBirthDate("");
    setClassName(""); setOption(""); setEnrolledAt(new Date().toISOString().slice(0, 10));
    setAddress(""); setProvinceOrigin("");
    setFatherName(""); setMotherName(""); setGuardianName(""); setGuardianRelation(""); setGuardianPhone("");
    setObservation(""); setPhotoPreview(null); setError(null);
    if (photoRef.current) photoRef.current.value = "";
    if (docsRef.current) docsRef.current.value = "";
  };

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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!lastName.trim() || !firstName.trim() || !className.trim()) {
      setError("Nom, prénom et classe sont requis.");
      return;
    }

    const folder = `students/${crypto.randomUUID()}`;
    let avatarUrl: string | undefined;
    const documents: StudentDocument[] = [];

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

    startTransition(async () => {
      const res = await addStudentAction({
        lastName, middleName, firstName, sex, birthDate, birthPlace,
        className, option, enrolledAt, address, provinceOrigin,
        fatherName, motherName, guardianName, guardianRelation, guardianPhone,
        observation, avatarUrl, documents,
      });
      if (res.ok) {
        reset();
        setOpen(false);
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  };

  const busy = pending || uploading;

  return (
    <>
      <button onClick={() => setOpen(true)} className="ek-btn ek-btn-primary" style={{ height: 38, fontSize: 13 }}>
        <Icon name="plus" size={15} stroke={2.5} />
        <T fr="Ajouter un élève" en="Add student" />
      </button>

      {open && (
        <div
          onClick={() => !busy && setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(20,16,10,0.45)", display: "grid", placeItems: "center", zIndex: 100, padding: 24 }}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={onSubmit}
            className="ek-card"
            style={{ width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", padding: 24 }}
          >
            <h2 style={{ fontSize: 18, fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>
              <T fr="Fiche de renseignements de l'élève" en="Student information sheet" />
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
                  <input value={className} onChange={(e) => setClassName(e.target.value)} required placeholder="1re A, 5e Humanités…" list="ek-add-classes" style={inputStyle} />
                </Field>
                <Field label={<T fr="Option / filière" en="Option" />}>
                  <input value={option} onChange={(e) => setOption(e.target.value)} placeholder="Sciences… (facultatif)" list="ek-add-options" style={inputStyle} />
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
                      setPhotoPreview(f ? URL.createObjectURL(f) : null);
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
            </Group>

            {/* Observation */}
            <Group title={<T fr="Observation" en="Notes" />}>
              <textarea value={observation} onChange={(e) => setObservation(e.target.value)} rows={2} placeholder="Remarque éventuelle…" style={{ ...inputStyle, resize: "vertical" as const }} />
            </Group>

            <datalist id="ek-add-classes">
              {classSuggestions.map((c) => <option key={c} value={c} />)}
            </datalist>
            <datalist id="ek-add-options">
              {PROMOTION_OPTIONS.map((o) => <option key={o} value={o} />)}
            </datalist>

            <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.45, marginTop: 4 }}>
              <T
                fr="L'élève apparaîtra aussitôt dans l'annuaire et dans les présences."
                en="The student will immediately appear in the directory and attendance."
              />
            </div>

            {error && (
              <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "rgba(192,58,43,0.10)", color: "var(--danger)", fontSize: 12.5, fontWeight: 600 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <button type="button" onClick={() => setOpen(false)} disabled={busy} className="ek-btn ek-btn-outline" style={{ flex: 1 }}>
                <T fr="Annuler" en="Cancel" />
              </button>
              <button type="submit" disabled={busy} className="ek-btn ek-btn-primary" style={{ flex: 1, opacity: busy ? 0.6 : 1 }}>
                {uploading ? "Envoi des fichiers…" : pending ? "Ajout…" : "Ajouter"}
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
