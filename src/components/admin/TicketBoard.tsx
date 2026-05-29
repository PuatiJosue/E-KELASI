"use client";

import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import type { Ticket } from "@/lib/mock";

const COLS = [
  { id: "new",      title: { fr: "Nouveau",        en: "New" },         tint: "var(--info)" },
  { id: "pending",  title: { fr: "En cours",       en: "In progress" }, tint: "var(--warning)" },
  { id: "waiting",  title: { fr: "Attente client", en: "Waiting" },     tint: "var(--ink-3)" },
  { id: "resolved", title: { fr: "Résolu",         en: "Resolved" },    tint: "var(--accent)" },
] as const;

const PRI_COLOR: Record<string, string> = {
  P0: "var(--danger)",
  P1: "var(--danger)",
  P2: "var(--warning)",
  P3: "var(--ink-3)",
};

const PRIORITIES = ["all", "P0", "P1", "P2", "P3"] as const;
type Pri = (typeof PRIORITIES)[number];

export function TicketBoard({ tickets }: { tickets: Record<string, Ticket[]> }) {
  const [pri, setPri] = useState<Pri>("all");
  const [query, setQuery] = useState("");

  const filter = (list: Ticket[]) =>
    list
      .filter((t) => (pri === "all" ? true : t.pri === pri))
      .filter((t) =>
        query
          ? (t.title.fr + " " + t.title.en + " " + t.who + " " + t.tag + " " + t.id)
              .toLowerCase()
              .includes(query.toLowerCase())
          : true
      );

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {PRIORITIES.map((p) => {
          const on = pri === p;
          return (
            <button
              key={p}
              onClick={() => setPri(p)}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                background: on ? "var(--ink)" : "var(--surface)",
                color: on ? "var(--surface)" : "var(--ink-2)",
                border: `1px solid ${on ? "var(--ink)" : "var(--border)"}`,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {p === "all" ? <T fr="Toutes priorités" en="All priorities" /> : p}
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            borderRadius: 9,
            background: "var(--surface-2)",
            color: "var(--ink-3)",
            fontSize: 12.5,
            minWidth: 220,
          }}
        >
          <Icon name="search" size={13} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrer ticket…"
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              flex: 1,
              fontSize: 12.5,
              color: "var(--ink)",
              fontFamily: "inherit",
            }}
          />
        </div>
      </div>

      <div
        className="ek-kanban"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          flex: 1,
          minHeight: 0,
        }}
      >
        {COLS.map((col) => {
          const list = filter(tickets[col.id] || []);
          return (
            <div
              key={col.id}
              style={{
                background: "var(--surface-2)",
                borderRadius: 12,
                padding: 10,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                minHeight: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 6px 2px" }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: col.tint }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>
                  <T fr={col.title.fr} en={col.title.en} />
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 11,
                    color: "var(--ink-3)",
                    fontWeight: 600,
                  }}
                >
                  {list.length}
                </span>
              </div>
              <div
                className="ek-scroll"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  overflowY: "auto",
                  flex: 1,
                }}
              >
                {list.map((t, i) => (
                  <div key={i} className="ek-card" style={{ padding: 12, borderRadius: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: PRI_COLOR[t.pri],
                          background: PRI_COLOR[t.pri] + "22",
                          padding: "1px 6px",
                          borderRadius: 5,
                        }}
                      >
                        {t.pri}
                      </span>
                      <span style={{ fontSize: 10, color: "var(--ink-3)", fontWeight: 600 }}>{t.id}</span>
                      <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--ink-3)" }}>
                        {t.tag}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: "var(--ink)",
                        marginTop: 6,
                        lineHeight: 1.35,
                      }}
                    >
                      <T fr={t.title.fr} en={t.title.en} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
                      <Avatar name={t.who} size={22} />
                      <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{t.who}</span>
                      <Icon
                        name="chat"
                        size={11}
                        style={{ marginLeft: "auto", color: "var(--ink-3)" }}
                      />
                      <span style={{ fontSize: 10, color: "var(--ink-3)" }}>
                        {((t.id.charCodeAt(1) * 7) % 8) + 1}
                      </span>
                    </div>
                  </div>
                ))}
                {col.id !== "resolved" && (
                  <button
                    style={{
                      padding: 10,
                      border: "1px dashed var(--border-strong)",
                      borderRadius: 10,
                      color: "var(--ink-3)",
                      fontSize: 12,
                      fontWeight: 600,
                      background: "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      cursor: "pointer",
                    }}
                  >
                    <Icon name="plus" size={13} /> <T fr="Ajouter" en="Add" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
