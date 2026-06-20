"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import type { SchoolStudentRow } from "@/lib/school-db";

export function StudentsBrowser({ students }: { students: SchoolStudentRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q) ||
        s.parentNames.some((p) => p.toLowerCase().includes(q))
    );
  }, [students, query]);

  const grouped: Record<string, SchoolStudentRow[]> = {};
  for (const s of filtered) (grouped[s.className] ||= []).push(s);
  const classes = Object.keys(grouped).sort();

  const exportCsv = () => {
    const header = ["Nom", "Classe", "Option", "Moyenne", "Parents"];
    const lines = [header, ...students.map((s) => [s.fullName, s.className, s.option ?? "", s.avg ?? "", s.parentNames.join(" / ")])];
    const csv = lines.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "eleves.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Recherche rapide + export */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)", display: "flex" }}>
            <Icon name="search" size={15} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un élève, une classe, un parent…"
            style={{
              width: "100%",
              padding: "10px 12px 10px 36px",
              borderRadius: 10,
              border: "1px solid var(--border-strong)",
              background: "var(--surface)",
              fontSize: 13.5,
              color: "var(--ink)",
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", display: "flex" }}
            >
              <Icon name="close" size={16} />
            </button>
          )}
        </div>
        <button onClick={exportCsv} disabled={students.length === 0} className="ek-btn ek-btn-outline" style={{ height: 40, fontSize: 12, flexShrink: 0, opacity: students.length === 0 ? 0.5 : 1 }}>
          <Icon name="upload" size={13} /> CSV
        </button>
      </div>

      {query && (
        <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
          {filtered.length} résultat(s)
        </div>
      )}

      {classes.map((c) => (
        <div key={c} className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 28, height: 28, borderRadius: 8, background: "var(--brand-soft)", color: "var(--brand-600)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, fontFamily: "var(--font-display)",
              }}
            >
              {c.split(" ").map((w) => w[0]).join("").slice(0, 2)}
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{c}</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{grouped[c].length} élèves</div>
          </div>
          <div className="ek-tablewrap">
            <div style={{ minWidth: 520 }}>
              {grouped[c].map((s, i) => (
                <div
                  key={s.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1.5fr 0.8fr",
                    padding: "12px 18px",
                    alignItems: "center",
                    fontSize: 12.5,
                    borderTop: i > 0 ? "1px solid var(--divider)" : "none",
                  }}
                >
                  <Link href={`/school/students/${s.id}`} style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <Avatar name={s.fullName} url={s.avatarUrl} size={32} />
                    <span style={{ fontWeight: 600, color: "var(--ink)" }}>{s.fullName}</span>
                  </Link>
                  <div style={{ color: "var(--ink-3)", fontSize: 11.5 }}>
                    {s.parentNames.length > 0 ? s.parentNames.join(", ") : "—"}
                  </div>
                  <div style={{ textAlign: "right", display: "flex", gap: 12, justifyContent: "flex-end" }}>
                    <Link href={`/school/students/${s.id}`} style={{ fontSize: 11.5, color: "var(--brand-600)", fontWeight: 600 }}>
                      <T fr="Dossier" en="Record" /> →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="ek-card" style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>
          {query
            ? <T fr="Aucun élève ne correspond à votre recherche." en="No student matches your search." />
            : <T fr="Aucun élève pour l'instant. Ils apparaîtront ici quand un parent les enregistrera et que vous validerez la demande." en="No students yet. They appear here once a parent registers them and you approve the request." />}
        </div>
      )}
    </>
  );
}
