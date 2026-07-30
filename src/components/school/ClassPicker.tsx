"use client";

import { useMemo, useState } from "react";
import { pluralFr, pluralEn } from "@/lib/plural";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { cycleOf } from "@/lib/promotion";

export type ClassItem = { name: string; count: number };

const norm = (s: string) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const CYCLES: { key: string; fr: string; en: string }[] = [
  { key: "maternelle", fr: "Maternelle", en: "Kindergarten" },
  { key: "primaire", fr: "Primaire", en: "Primary" },
  { key: "secondaire", fr: "Secondaire", en: "Secondary" },
  { key: "autre", fr: "Autres classes", en: "Other classes" },
];

export function ClassPicker({
  classes,
  selected,
  onSelect,
}: {
  classes: ClassItem[];
  selected: string;
  onSelect: (name: string) => void;
}) {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = norm(query.trim());
    const byCycle = new Map<string, ClassItem[]>();
    for (const c of classes) {
      if (q && !norm(c.name).includes(q)) continue;
      const k = cycleOf(c.name);
      if (!byCycle.has(k)) byCycle.set(k, []);
      byCycle.get(k)!.push(c);
    }
    for (const list of byCycle.values()) list.sort((a, b) => a.name.localeCompare(b.name, "fr", { numeric: true }));
    return CYCLES.filter((cy) => byCycle.has(cy.key)).map((cy) => ({ ...cy, items: byCycle.get(cy.key)! }));
  }, [classes, query]);

  const totalShown = groups.reduce((a, g) => a + g.items.length, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Recherche */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <label className="ek-search" style={{ flex: 1, minWidth: 220, maxWidth: 520 }}>
          <Icon name="search" size={16} color="var(--ink-3)" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une classe, section ou option…"
            aria-label="Rechercher une classe"
          />
        </label>
        <span style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 600 }}>
          {totalShown} <T fr={totalShown > 1 ? "classes" : "classe"} en={totalShown > 1 ? "classes" : "class"} />
        </span>
      </div>

      {totalShown === 0 ? (
        <div style={{ padding: "28px 0", textAlign: "center", color: "var(--ink-3)", fontSize: 12.5 }}>
          <T fr="Aucune classe ne correspond à la recherche." en="No class matches your search." />
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.key}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
                <T fr={g.fr} en={g.en} />
              </span>
              <span
                style={{
                  minWidth: 20, height: 20, padding: "0 6px", borderRadius: 999,
                  background: "var(--brand-soft)", color: "var(--brand-600)",
                  fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {g.items.length}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 10 }}>
              {g.items.map((c) => {
                const on = c.name === selected;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => onSelect(c.name)}
                    title={`${c.name} · ${c.count} élève(s)`}
                    style={{
                      display: "flex", alignItems: "center", gap: 11,
                      padding: "11px 13px", borderRadius: 11, cursor: "pointer", textAlign: "left",
                      border: `1.5px solid ${on ? "var(--brand)" : "var(--border)"}`,
                      background: on ? "var(--brand)" : "var(--surface)",
                      boxShadow: on ? "0 4px 12px rgba(79,102,232,0.25)" : "none",
                      transition: "border-color .12s, background .12s",
                    }}
                  >
                    <span
                      style={{
                        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: on ? "none" : "1.5px solid var(--border-strong)",
                        background: on ? "rgba(255,255,255,0.22)" : "transparent",
                        color: "#fff",
                      }}
                    >
                      {on && <Icon name="check" size={13} stroke={3} />}
                    </span>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: on ? "#fff" : "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.name}
                      </span>
                      <span style={{ fontSize: 11, color: on ? "rgba(255,255,255,0.85)" : "var(--ink-3)" }}>
                        <T fr={pluralFr(c.count, "élève")} en={pluralEn(c.count, "student")} />
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
