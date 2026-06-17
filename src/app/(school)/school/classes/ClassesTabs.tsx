"use client";

import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { InviteTeacherButton } from "@/components/school/InviteTeacherButton";
import { CoursesManager } from "../courses/CoursesManager";
import type { ClassDirectoryRow, SchoolTeacherRow } from "@/lib/school-db";
import type { Assignment, FormOptions } from "@/lib/courses-db";

function tone(avg: number): string {
  return avg >= 14 ? "#1D6650" : avg >= 10 ? "#C28728" : "#C03A2B";
}

type Tab = "classes" | "profs" | "cours";

export function ClassesTabs({
  rows, totalStudents, totalTeachers, teachers, assignments, options,
}: {
  rows: ClassDirectoryRow[];
  totalStudents: number;
  totalTeachers: number;
  teachers: SchoolTeacherRow[];
  assignments: Assignment[];
  options: FormOptions;
}) {
  const [tab, setTab] = useState<Tab>("classes");

  const TABS: { key: Tab; label: string }[] = [
    { key: "classes", label: "Classes" },
    { key: "profs", label: "Professeurs" },
    { key: "cours", label: "Cours" },
  ];

  return (
    <>
      {/* Onglets */}
      <div style={{ display: "flex", gap: 6, background: "var(--surface-2)", padding: 4, borderRadius: 12, alignSelf: "flex-start", flexWrap: "wrap" }}>
        {TABS.map((t) => {
          const on = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "8px 16px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none",
                background: on ? "var(--surface)" : "transparent",
                color: on ? "var(--ink)" : "var(--ink-3)",
                boxShadow: on ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "classes" && <ClassesTab rows={rows} />}
      {tab === "profs" && <ProfsTab teachers={teachers} />}
      {tab === "cours" && <CoursesManager assignments={assignments} options={options} />}
    </>
  );
}

function ClassesTab({ rows }: { rows: ClassDirectoryRow[] }) {
  const withAvg = rows.filter((r) => r.avg !== null) as (ClassDirectoryRow & { avg: number })[];
  const best = withAvg.length ? withAvg.reduce((a, b) => (b.avg > a.avg ? b : a)) : null;
  const worst = withAvg.length ? withAvg.reduce((a, b) => (b.avg < a.avg ? b : a)) : null;

  if (rows.length === 0) {
    return <div className="ek-card" style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>Aucune classe pour le moment.</div>;
  }

  return (
    <>
      <div className="ek-card" style={{ padding: 20 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>Taux de réussite par classe</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginBottom: 16 }}>
          Moyenne générale de chaque classe — repérez les classes à soutenir avant les examens.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rows.map((r) => {
            const a = r.avg ?? 0;
            return (
              <div key={r.className} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 150, fontSize: 12.5, color: "var(--ink-2)", fontWeight: 600, flexShrink: 0 }}>{r.className}</div>
                <div style={{ flex: 1, height: 18, borderRadius: 6, background: "var(--surface-2)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, (a / 20) * 100)}%`, background: r.avg === null ? "var(--border-strong)" : tone(a), borderRadius: 6 }} />
                </div>
                <div style={{ width: 54, textAlign: "right", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-display)", color: r.avg === null ? "var(--ink-3)" : tone(a) }}>
                  {r.avg === null ? "—" : `${r.avg}/20`}
                </div>
              </div>
            );
          })}
        </div>
        {(best || worst) && (
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            {best && (
              <div style={{ flex: 1, minWidth: 180, padding: 12, borderRadius: 10, background: "rgba(29,102,80,0.08)" }}>
                <div style={{ fontSize: 10.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Meilleure classe</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1D6650", marginTop: 2 }}>{best.className} · {best.avg}/20</div>
              </div>
            )}
            {worst && best && worst.className !== best.className && (
              <div style={{ flex: 1, minWidth: 180, padding: 12, borderRadius: 10, background: "rgba(192,58,43,0.08)" }}>
                <div style={{ fontSize: 10.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Classe à soutenir</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#C03A2B", marginTop: 2 }}>{worst.className} · {worst.avg}/20</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--divider)", fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>Annuaire des classes</div>
        <div className="ek-tablewrap">
          <div style={{ minWidth: 640 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.8fr 0.8fr 2fr", padding: "10px 18px", fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", background: "var(--surface-2)" }}>
              <div>Classe</div>
              <div style={{ textAlign: "center" }}>Élèves</div>
              <div style={{ textAlign: "center" }}>Profs</div>
              <div>Enseignants</div>
            </div>
            {rows.map((r, i) => (
              <div key={r.className} style={{ display: "grid", gridTemplateColumns: "1.4fr 0.8fr 0.8fr 2fr", padding: "12px 18px", alignItems: "center", fontSize: 12.5, borderTop: i > 0 ? "1px solid var(--divider)" : "none" }}>
                <div style={{ fontWeight: 600, color: "var(--ink)" }}>{r.className}</div>
                <div style={{ textAlign: "center", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}><Icon name="user" size={13} /> {r.studentCount}</div>
                <div style={{ textAlign: "center", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}><Icon name="users" size={13} /> {r.teacherCount}</div>
                <div style={{ color: "var(--ink-3)", fontSize: 11.5 }}>{r.teacherNames.length > 0 ? r.teacherNames.join(", ") : "—"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function ProfsTab({ teachers }: { teachers: SchoolTeacherRow[] }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <InviteTeacherButton />
      </div>
      <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="ek-tablewrap">
          <div style={{ minWidth: 620 }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr", padding: "12px 18px", fontSize: 11, fontWeight: 700, color: "var(--ink-3)", letterSpacing: "0.05em", textTransform: "uppercase", background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
              <div><T fr="Nom" en="Name" /></div>
              <div><T fr="Email" en="Email" /></div>
              <div><T fr="Rôle" en="Role" /></div>
              <div><T fr="Depuis" en="Since" /></div>
            </div>
            {teachers.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--ink-3)", fontSize: 12 }}>
                <T fr="Aucun professeur. Utilisez « Ajouter un prof »." en="No teacher yet." />
              </div>
            ) : (
              teachers.map((t, i) => (
                <div key={t.id || i} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr", padding: "14px 18px", alignItems: "center", fontSize: 12.5, borderBottom: i < teachers.length - 1 ? "1px solid var(--divider)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={t.fullName} size={32} />
                    <span style={{ fontWeight: 600, color: "var(--ink)" }}>{t.fullName}</span>
                  </div>
                  <div style={{ color: "var(--ink-2)" }}>{t.email}</div>
                  <div><span className={`ek-chip ${t.role === "school_admin" ? "brand" : ""}`}>{t.role === "school_admin" ? "Direction" : "Professeur"}</span></div>
                  <div style={{ color: "var(--ink-3)" }}>{t.joinedAt}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
