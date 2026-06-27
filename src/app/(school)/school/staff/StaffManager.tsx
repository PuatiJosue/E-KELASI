"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { createClient } from "@/lib/supabase/client";
import { createStaff, updateStaff, deleteStaff, type StaffInput, type CourseInput } from "./actions";
import { generateCodeForStaffAction, revokeStaffCodeAction } from "@/app/(school)/school/teachers/actions";
import { STAFF_CATEGORIES, CATEGORY_LABEL, composeFullName, splitFullName, type StaffMember } from "@/lib/staff-types";

const EMPTY: StaffInput = { fullName: "", lastName: "", middleName: "", firstName: "", category: "enseignant", status: "active" };

type CourseRow = { subjectName: string; className: string; option: string; weeklyHours: number };

export function StaffManager({
  staff, coursesByStaff = {}, pendingCodeStaffIds = [], subjectOptions = [], classOptions = [], optionOptions = [],
}: {
  staff: StaffMember[];
  coursesByStaff?: Record<string, CourseRow[]>;
  pendingCodeStaffIds?: string[];
  subjectOptions?: string[];
  classOptions?: string[];
  optionOptions?: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pendingSet = useMemo(() => new Set(pendingCodeStaffIds), [pendingCodeStaffIds]);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [editing, setEditing] = useState<StaffMember | null>(null);
  // Ouvre directement le formulaire « Ajouter » si on arrive avec ?add=1
  // (depuis les boutons « Ajouter un prof » d'autres pages).
  const [adding, setAdding] = useState(searchParams.get("add") === "1");

  // Referme le formulaire et nettoie le paramètre ?add de l'URL.
  const closeForm = () => {
    setAdding(false);
    setEditing(null);
    if (searchParams.get("add")) router.replace("/school/staff");
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return staff.filter((s) => {
      if (cat !== "all" && s.category !== cat) return false;
      if (!q) return true;
      return s.fullName.toLowerCase().includes(q) || (s.phone ?? "").includes(q) || (s.email ?? "").toLowerCase().includes(q);
    });
  }, [staff, query, cat]);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of staff) m[s.category] = (m[s.category] ?? 0) + 1;
    return m;
  }, [staff]);

  return (
    <>
      {/* Barre d'outils */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)", display: "flex" }}>
            <Icon name="search" size={15} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher (nom, téléphone, email)…"
            style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface)", fontSize: 13.5, color: "var(--ink)" }}
          />
        </div>
        <button onClick={() => setAdding(true)} className="ek-btn ek-btn-primary" style={{ height: 38, fontSize: 13 }}>
          <Icon name="plus" size={14} /> Ajouter
        </button>
      </div>

      {/* Filtres catégorie */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Pill on={cat === "all"} onClick={() => setCat("all")} label={`Tous (${staff.length})`} />
        {STAFF_CATEGORIES.map((c) => (
          <Pill key={c} on={cat === c} onClick={() => setCat(c)} label={`${CATEGORY_LABEL[c]} (${counts[c] ?? 0})`} />
        ))}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="ek-card" style={{ padding: 40, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
          {staff.length === 0 ? "Aucun membre du personnel. Cliquez sur « Ajouter »." : "Aucun résultat."}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {filtered.map((s) => (
            <div key={s.id} className="ek-card" style={{ padding: 14, display: "flex", gap: 12, alignItems: "flex-start" }}>
              <Avatar name={s.fullName} url={s.photoUrl} size={46} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{s.fullName}</span>
                  {s.status === "inactive" && <span style={{ fontSize: 10, color: "var(--ink-3)" }}>(inactif)</span>}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--brand-600)", fontWeight: 600 }}>{CATEGORY_LABEL[s.category] ?? s.category}</div>
                {(s.phone || s.email) && (
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 3 }}>{s.phone || s.email}</div>
                )}
                {s.qualifications && (
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 3 }}>🎓 {s.qualifications}</div>
                )}
                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                  <button onClick={() => setEditing(s)} style={linkBtn}>Modifier</button>
                </div>
                {s.category === "enseignant" && (
                  <AccessCodeControl
                    staffId={s.id}
                    linked={!!s.linkedUserId}
                    pending={pendingSet.has(s.id)}
                    onChanged={() => router.refresh()}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {(adding || editing) && (
        <StaffForm
          initial={editing ?? undefined}
          initialCourses={editing ? coursesByStaff[editing.id] ?? [] : []}
          subjectOptions={subjectOptions}
          classOptions={classOptions}
          optionOptions={optionOptions}
          onClose={closeForm}
          onSaved={() => { closeForm(); router.refresh(); }}
        />
      )}
    </>
  );
}

function Pill({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
        background: on ? "var(--ink)" : "var(--surface)", color: on ? "var(--surface)" : "var(--ink-2)",
        border: `1px solid ${on ? "var(--ink)" : "var(--border)"}`,
      }}
    >
      {label}
    </button>
  );
}

// Code d'accès généré depuis la fiche enseignant (déjà remplie par la direction).
function AccessCodeControl({
  staffId, linked, pending, onChanged,
}: {
  staffId: string;
  linked: boolean;
  pending: boolean;
  onChanged: () => void;
}) {
  const [busy, startTransition] = useTransition();
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (linked) {
    return (
      <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--accent)", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
        <Icon name="check" size={13} /> Compte actif
      </div>
    );
  }

  const generate = () => {
    setError(null);
    startTransition(async () => {
      const r = await generateCodeForStaffAction(staffId);
      if (r.ok) { setCode(r.code); onChanged(); }
      else setError(r.message);
    });
  };
  const revoke = () => {
    setError(null);
    startTransition(async () => {
      const r = await revokeStaffCodeAction(staffId);
      if (r.ok) { setCode(null); onChanged(); }
      else setError(r.message);
    });
  };
  const copy = async () => {
    if (!code) return;
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };

  return (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
      {code ? (
        <div style={{ padding: "8px 10px", borderRadius: 9, background: "var(--brand-soft)", border: "1px dashed var(--brand-600)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <code style={{ fontFamily: "var(--font-mono)", fontSize: 15, letterSpacing: 1.5, color: "var(--brand-600)", fontWeight: 700 }}>{code}</code>
          <button type="button" onClick={copy} style={linkBtn}>{copied ? "✓ Copié" : "Copier"}</button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button type="button" onClick={generate} disabled={busy} style={linkBtn}>
            {busy ? "…" : pending ? "Régénérer le code" : "Générer un code d'accès"}
          </button>
          {pending && (
            <button type="button" onClick={revoke} disabled={busy} style={{ ...linkBtn, color: "var(--danger)" }}>Révoquer</button>
          )}
        </div>
      )}
      {pending && !code && (
        <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}>Un code est en attente (affiché une seule fois à la génération).</div>
      )}
      {code && (
        <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}>À remettre au prof. Affiché une seule fois.</div>
      )}
      {error && <div style={{ fontSize: 11, color: "var(--danger)", fontWeight: 600 }}>{error}</div>}
    </div>
  );
}

function StaffForm({
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
const linkBtn: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer", color: "var(--brand-600)", fontSize: 12, fontWeight: 600, padding: 0,
};
