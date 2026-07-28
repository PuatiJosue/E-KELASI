"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { createClient } from "@/lib/supabase/client";
import { createStaff, updateStaff, deleteStaff, type StaffInput, type CourseInput } from "./actions";
import { STAFF_CATEGORIES, CATEGORY_LABEL, composeFullName, splitFullName, type StaffMember } from "@/lib/staff-types";
import { linkBtn } from "./staff-ui";
import type { CourseRow } from "./types";

const EMPTY: StaffInput = { fullName: "", lastName: "", middleName: "", firstName: "", category: "enseignant", status: "active" };

export function StaffForm({
  initial, initialCourses = [], subjectOptions, classOptions, optionOptions, onClose, onSaved,
}: {
  initial?: StaffMember;
  initialCourses?: CourseRow[];
  subjectOptions: string[];
  classOptions: string[];
  optionOptions: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [f, setF] = useState<StaffInput>(() => {
    if (!initial) return { ...EMPTY };
    // Fiches existantes (full_name seul) : on pré-remplit par découpage heuristique.
    const parts = initial.lastName || initial.middleName || initial.firstName
      ? { lastName: initial.lastName ?? "", middleName: initial.middleName ?? "", firstName: initial.firstName ?? "" }
      : splitFullName(initial.fullName);
    return {
      fullName: initial.fullName, ...parts, category: initial.category, phone: initial.phone ?? "",
      email: initial.email ?? "", qualifications: initial.qualifications ?? "",
      hireDate: initial.hireDate ?? "", status: initial.status, address: initial.address ?? "",
      notes: initial.notes ?? "", photoUrl: initial.photoUrl ?? "",
    };
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(initial?.photoUrl ?? null);
  const [courses, setCourses] = useState<CourseRow[]>(initialCourses);

  const set = (k: keyof StaffInput, v: string) => setF((p) => ({ ...p, [k]: v }));
  const isTeacher = f.category === "enseignant";

  const addCourse = () => setCourses((p) => [...p, { subjectName: "", className: "", option: "", weeklyHours: 0 }]);
  const setCourse = (i: number, k: keyof CourseRow, v: string) =>
    setCourses((p) => p.map((c, j) => (j === i ? { ...c, [k]: k === "weeklyHours" ? (parseFloat(v.replace(",", ".")) || 0) : v } : c)));
  const removeCourse = (i: number) => setCourses((p) => p.filter((_, j) => j !== i));

  const save = async () => {
    setError(null);
    if (!f.lastName?.trim()) { setError("Le nom est requis."); return; }
    const fullName = composeFullName(f.lastName, f.middleName, f.firstName);

    let photoUrl = f.photoUrl;
    const file = fileRef.current?.files?.[0];
    if (file) {
      setUploading(true);
      try {
        const supabase = createClient();
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("staff-photos").upload(path, file, { upsert: false });
        if (upErr) { setUploading(false); setError("Échec de l'envoi de la photo."); return; }
        photoUrl = supabase.storage.from("staff-photos").getPublicUrl(path).data.publicUrl;
      } catch { setUploading(false); setError("Échec de l'envoi de la photo."); return; }
      setUploading(false);
    }

    const coursePayload: CourseInput[] = isTeacher
      ? courses.filter((c) => c.subjectName.trim() && c.className.trim())
      : [];

    startTransition(async () => {
      const payload = { ...f, fullName, photoUrl };
      const r = initial
        ? await updateStaff(initial.id, payload, isTeacher ? coursePayload : undefined)
        : await createStaff(payload, isTeacher ? coursePayload : undefined);
      if (r.ok) onSaved();
      else setError(r.message);
    });
  };

  const remove = () => {
    if (!initial) return;
    if (!confirm("Supprimer cette fiche ?")) return;
    startTransition(async () => {
      const r = await deleteStaff(initial.id);
      if (r.ok) onSaved();
      else setError(r.message);
    });
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 100 }}>
      <div onClick={(e) => e.stopPropagation()} className="ek-card" style={{ padding: 20, width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ flex: 1, fontSize: 16, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)" }}>
            {initial ? "Modifier la fiche" : "Nouveau membre"}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", display: "flex" }}><Icon name="close" size={20} /></button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar name={f.fullName || "?"} url={photoPreview} size={52} />
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => { const file = e.target.files?.[0]; if (file) setPhotoPreview(URL.createObjectURL(file)); }}
              style={{ fontSize: 12, color: "var(--ink-2)" }}
            />
            <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 2 }}>Photo (optionnel)</div>
          </div>
        </div>

        <Field label="Nom *"><input value={f.lastName ?? ""} onChange={(e) => set("lastName", e.target.value)} placeholder="Nom de famille" style={inp} /></Field>
        <div style={{ display: "flex", gap: 10 }}>
          <Field label="Post-nom" flex><input value={f.middleName ?? ""} onChange={(e) => set("middleName", e.target.value)} style={inp} /></Field>
          <Field label="Prénom" flex><input value={f.firstName ?? ""} onChange={(e) => set("firstName", e.target.value)} style={inp} /></Field>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Field label="Catégorie" flex>
            <select value={f.category} onChange={(e) => set("category", e.target.value)} style={inp}>
              {STAFF_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
            </select>
          </Field>
          <Field label="Statut" flex>
            <select value={f.status} onChange={(e) => set("status", e.target.value)} style={inp}>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </Field>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Field label="Téléphone" flex><input value={f.phone} onChange={(e) => set("phone", e.target.value)} style={inp} /></Field>
          <Field label="Date d'embauche" flex><input type="date" value={f.hireDate} onChange={(e) => set("hireDate", e.target.value)} style={inp} /></Field>
        </div>
        <Field label="Email"><input value={f.email} onChange={(e) => set("email", e.target.value)} style={inp} /></Field>
        <Field label="Qualifications"><input value={f.qualifications} onChange={(e) => set("qualifications", e.target.value)} placeholder="ex. Licence en pédagogie" style={inp} /></Field>
        <Field label="Adresse"><input value={f.address} onChange={(e) => set("address", e.target.value)} style={inp} /></Field>
        <Field label="Notes"><textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={2} style={{ ...inp, resize: "vertical" }} /></Field>

        {/* Cours / Classes / Options — uniquement pour les enseignants */}
        {isTeacher && (
          <div style={{ borderTop: "1px solid var(--divider)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)" }}>Cours, classes & options</div>
              <button type="button" onClick={addCourse} style={linkBtn}>+ Ajouter un cours</button>
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
              Plusieurs classes possibles. Classe et option : choisis dans la liste (synchronisée avec les élèves) ou tape une nouvelle valeur.
            </div>

            <datalist id="dl-subjects">{subjectOptions.map((o) => <option key={o} value={o} />)}</datalist>
            <datalist id="dl-classes">{classOptions.map((o) => <option key={o} value={o} />)}</datalist>
            <datalist id="dl-options">{optionOptions.map((o) => <option key={o} value={o} />)}</datalist>

            {courses.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Aucun cours. Cliquez sur « + Ajouter un cours ».</div>
            ) : (
              courses.map((c, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6, padding: 10, borderRadius: 10, background: "var(--surface-2)" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input list="dl-subjects" value={c.subjectName} onChange={(e) => setCourse(i, "subjectName", e.target.value)} placeholder="Cours / matière" style={{ ...inp, flex: 2 }} />
                    <input value={c.weeklyHours ? String(c.weeklyHours) : ""} onChange={(e) => setCourse(i, "weeklyHours", e.target.value)} inputMode="decimal" placeholder="h/sem" style={{ ...inp, width: 72 }} />
                    <button type="button" onClick={() => removeCourse(i)} title="Retirer" style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 4px" }}>×</button>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input list="dl-classes" value={c.className} onChange={(e) => setCourse(i, "className", e.target.value)} placeholder="Classe" style={{ ...inp, flex: 1 }} />
                    <input list="dl-options" value={c.option} onChange={(e) => setCourse(i, "option", e.target.value)} placeholder="Section / option" style={{ ...inp, flex: 1 }} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {error && <div style={{ color: "var(--danger)", fontSize: 12, fontWeight: 600 }}>{error}</div>}

        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          {initial && (
            <button onClick={remove} disabled={pending} className="ek-btn ek-btn-outline" style={{ height: 38, fontSize: 13, color: "var(--danger)" }}>
              <Icon name="trash" size={13} /> Supprimer
            </button>
          )}
          <button onClick={save} disabled={pending || uploading} className="ek-btn ek-btn-primary" style={{ height: 38, fontSize: 13, marginLeft: "auto", opacity: pending || uploading ? 0.6 : 1 }}>
            {uploading ? "Envoi photo…" : pending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, flex }: { label: string; children: React.ReactNode; flex?: boolean }) {
  return (
    <div style={flex ? { flex: 1 } : undefined}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-2)", marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

const inp: React.CSSProperties = {
  width: "100%", padding: "9px 10px", borderRadius: 9, border: "1px solid var(--border-strong)",
  background: "var(--surface)", fontSize: 13, color: "var(--ink)",
};

