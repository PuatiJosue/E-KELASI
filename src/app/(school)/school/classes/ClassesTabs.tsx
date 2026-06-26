"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { KPI } from "@/components/KPI";
import { T } from "@/lib/i18n";
import { CoursesManager } from "../courses/CoursesManager";
import type { ClassDirectoryRow, SchoolTeacherRow, ClassReportMatrix, ClassReportLevel } from "@/lib/school-db";
import type { Assignment, FormOptions } from "@/lib/courses-db";

type Tab = "overview" | "profs" | "cours";

// Couleur du taux de réussite à partir de la moyenne /20 (→ pourcentage).
function rateColor(avg: number | null): string {
  if (avg === null) return "var(--border-strong)";
  const pct = (avg / 20) * 100;
  if (pct >= 75) return "#1D6650"; // Excellent
  if (pct >= 50) return "#3A6DBC"; // Bon
  if (pct >= 25) return "#C28728"; // Moyen
  return "#C03A2B";                // Faible
}

export function ClassesTabs({
  rows, totalStudents, totalTeachers, teachers, assignments, options, matrix,
}: {
  rows: ClassDirectoryRow[];
  totalStudents: number;
  totalTeachers: number;
  teachers: SchoolTeacherRow[];
  assignments: Assignment[];
  options: FormOptions;
  matrix: ClassReportMatrix;
}) {
  const [tab, setTab] = useState<Tab>("overview");

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: "Vue d'ensemble" },
    { key: "profs", label: "Professeurs" },
    { key: "cours", label: "Cours" },
  ];

  return (
    <>
      {/* KPI */}
      <div className="ek-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <KPI label={<T fr="Élèves" en="Students" />} value={String(totalStudents)} />
        <KPI label={<T fr="Enseignants" en="Teachers" />} value={String(totalTeachers)} accent="var(--brand-600)" />
        <KPI label={<T fr="Classes" en="Classes" />} value={String(rows.length)} accent="var(--info)" />
        <KPI label={<T fr="Taux moyen de réussite" en="Average success rate" />} value={matrix.avgRatePct === null ? "— %" : `${matrix.avgRatePct} %`} accent="var(--accent)" />
      </div>

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

      {tab === "overview" && <OverviewTab matrix={matrix} rows={rows} />}
      {tab === "profs" && <ProfsTab teachers={teachers} />}
      {tab === "cours" && <CoursesManager assignments={assignments} options={options} />}
    </>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--ink-2)" }}>
      <span style={{ width: 9, height: 9, borderRadius: "50%", background: color }} />
      {label}
    </span>
  );
}

function OverviewTab({ matrix, rows }: { matrix: ClassReportMatrix; rows: ClassDirectoryRow[] }) {
  const { levels, options, best, worst } = matrix;
  const base = levels.filter((l) => l.group === "base");
  const secondaire = levels.filter((l) => l.group === "secondaire");

  return (
    <>
      <div className="ek-card" style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
              <T fr="Taux de réussite par option et niveau" en="Success rate by option and level" />
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
              <T fr="Du primaire aux humanités. Les options concernent surtout les humanités." en="From primary to secondary. Options mainly apply to secondary." />
            </div>
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <LegendDot color="#1D6650" label="Excellent (≥ 75%)" />
            <LegendDot color="#3A6DBC" label="Bon (50 – 74%)" />
            <LegendDot color="#C28728" label="Moyen (25 – 49%)" />
            <LegendDot color="#C03A2B" label="Faible (< 25%)" />
            <LegendDot color="var(--border-strong)" label="Non disponible" />
          </div>
        </div>

        <div className="ek-tablewrap">
          <div style={{ minWidth: 200 + options.length * 96 + 96 }}>
            {/* En-tête options */}
            <div style={{ display: "grid", gridTemplateColumns: `200px repeat(${options.length}, 1fr) 96px`, background: "var(--surface-2)", borderRadius: 10, padding: "8px 0" }}>
              <div style={{ padding: "6px 14px", fontSize: 10.5, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <T fr="Niveau" en="Level" />
              </div>
              {options.map((o) => (
                <div key={o} style={{ padding: "6px 6px", fontSize: 10.5, fontWeight: 700, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.03em", textAlign: "center" }}>{o}</div>
              ))}
              <div style={{ padding: "6px 8px", fontSize: 10.5, fontWeight: 700, color: "var(--ink-2)", textTransform: "uppercase", textAlign: "center" }}>
                <T fr="Moyenne" en="Average" />
              </div>
            </div>

            <GroupBlock title="Éducation de base" levels={base} options={options} />
            <GroupBlock title="Enseignement secondaire" levels={secondaire} options={options} />
          </div>
        </div>

        {(best || worst) && (
          <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
            {best && (
              <div style={{ flex: 1, minWidth: 220, padding: 14, borderRadius: 12, background: "rgba(29,102,80,0.08)", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(29,102,80,0.16)", color: "#1D6650", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="star" size={17} />
                </span>
                <div>
                  <div style={{ fontSize: 10.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                    <T fr="Meilleure performance" en="Best performance" />
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1D6650", marginTop: 2 }}>{best.label} · {best.value.toFixed(1)}/20</div>
                </div>
              </div>
            )}
            {worst && (
              <div style={{ flex: 1, minWidth: 220, padding: 14, borderRadius: 12, background: "rgba(224,112,30,0.08)", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(224,112,30,0.16)", color: "#E0701E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="activity" size={17} />
                </span>
                <div>
                  <div style={{ fontSize: 10.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                    <T fr="Performance à améliorer" en="Needs improvement" />
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#C03A2B", marginTop: 2 }}>{worst.label} · {worst.value.toFixed(1)}/20</div>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="shield" size={12} />
          <T fr="Les taux sont calculés sur la base des évaluations et examens enregistrés." en="Rates are computed from recorded assessments and exams." />
        </div>
      </div>

      {/* Annuaire des classes (détail) */}
      <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--divider)", fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>
          <T fr="Annuaire des classes" en="Class directory" />
        </div>
        <div className="ek-tablewrap">
          <div style={{ minWidth: 640 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.8fr 0.8fr 2fr", padding: "10px 18px", fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", background: "var(--surface-2)" }}>
              <div><T fr="Classe" en="Class" /></div>
              <div style={{ textAlign: "center" }}><T fr="Élèves" en="Students" /></div>
              <div style={{ textAlign: "center" }}><T fr="Profs" en="Teachers" /></div>
              <div><T fr="Enseignants" en="Teachers" /></div>
            </div>
            {rows.length === 0 ? (
              <div style={{ padding: 36, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
                <T fr="Aucune classe pour le moment." en="No class yet." />
              </div>
            ) : (
              rows.map((r, i) => (
                <div key={r.label} style={{ display: "grid", gridTemplateColumns: "1.4fr 0.8fr 0.8fr 2fr", padding: "12px 18px", alignItems: "center", fontSize: 12.5, borderTop: i > 0 ? "1px solid var(--divider)" : "none" }}>
                  <div style={{ fontWeight: 600, color: "var(--ink)" }}>{r.label}</div>
                  <div style={{ textAlign: "center", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}><Icon name="user" size={13} /> {r.studentCount}</div>
                  <div style={{ textAlign: "center", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}><Icon name="users" size={13} /> {r.teacherCount}</div>
                  <div style={{ color: "var(--ink-3)", fontSize: 11.5 }}>{r.teacherNames.length > 0 ? r.teacherNames.join(", ") : "—"}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function GroupBlock({ title, levels, options }: { title: string; levels: ClassReportLevel[]; options: string[] }) {
  if (levels.length === 0) return null;
  return (
    <>
      <div style={{ padding: "12px 14px 6px", fontSize: 11, fontWeight: 700, color: "var(--brand-600)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {title}
      </div>
      {levels.map((L) => (
        <div key={L.key} style={{ display: "grid", gridTemplateColumns: `200px repeat(${options.length}, 1fr) 96px`, alignItems: "center", borderTop: "1px solid var(--divider)", minHeight: 52 }}>
          <div style={{ padding: "8px 14px", fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>{L.label}</div>
          {options.map((o) => <Cell key={o} value={L.byOption[o]} />)}
          <Cell value={L.overall} strong />
        </div>
      ))}
    </>
  );
}

function Cell({ value, strong }: { value: number | null; strong?: boolean }) {
  const color = rateColor(value);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 4px" }}>
      <span style={{ width: 32, height: 5, borderRadius: 3, background: color, opacity: value === null ? 0.4 : 1 }} />
      <span style={{ fontSize: 11.5, fontWeight: strong ? 800 : 600, color: value === null ? "var(--ink-3)" : "var(--ink-2)", fontFamily: "var(--font-display)" }}>
        {value === null ? "—" : `${value.toFixed(1)}/20`}
      </span>
    </div>
  );
}

function ProfsTab({ teachers }: { teachers: SchoolTeacherRow[] }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Link href="/school/staff" className="ek-btn ek-btn-primary" style={{ height: 32, fontSize: 12 }}>
          <Icon name="plus" size={14} stroke={2.5} />
          <T fr="Ajouter un prof" en="Add teacher" />
        </Link>
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
