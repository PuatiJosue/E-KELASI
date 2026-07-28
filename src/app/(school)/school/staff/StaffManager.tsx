"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { CATEGORY_LABEL, STAFF_CATEGORIES, type StaffMember } from "@/lib/staff-types";
import { AccessCodeControl } from "./AccessCodeControl";
import { StaffForm } from "./StaffForm";
import { linkBtn } from "./staff-ui";
import type { CourseRow } from "./types";

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
                {/* Seuls enseignants et surveillants ont un espace dans l'app. */}
                {(s.category === "enseignant" || s.category === "surveillant") && (
                  <AccessCodeControl
                    staffId={s.id}
                    category={s.category}
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

// Code d'accès généré depuis la fiche (déjà remplie par la direction) d'un
// enseignant ou d'un surveillant.

