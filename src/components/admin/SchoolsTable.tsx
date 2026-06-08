"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import type { SchoolRow } from "@/lib/db";
import { markSchoolPaid, setSchoolSuspended } from "@/app/(admin)/schools/billing-actions";

type Filter = "all" | "active" | "onboarding" | "trial" | "suspended";

function SchoolActions({ id, status, paid }: { id: string; status: string; paid: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) =>
    startTransition(async () => {
      const r = await fn();
      if (r.ok) router.refresh();
      else alert(r.message ?? "Erreur");
    });

  const suspended = status === "suspended";
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
      {!paid && (
        <button
          onClick={() => run(() => markSchoolPaid(id))}
          disabled={pending}
          className="ek-btn ek-btn-outline"
          style={{ height: 28, fontSize: 11 }}
        >
          {pending ? "…" : <T fr="Marquer payé" en="Mark paid" />}
        </button>
      )}
      <button
        onClick={() => run(() => setSchoolSuspended(id, !suspended))}
        disabled={pending}
        className="ek-btn ek-btn-outline"
        style={{ height: 28, fontSize: 11, color: suspended ? "var(--accent)" : "var(--danger)", borderColor: suspended ? "var(--accent)" : "var(--danger)" }}
      >
        {suspended ? <T fr="Réactiver" en="Reactivate" /> : <T fr="Suspendre" en="Suspend" />}
      </button>
    </div>
  );
}

function statusChip(s: string) {
  if (s === "active")
    return (
      <span className="ek-chip success">
        <span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--accent)" }} />{" "}
        <T fr="Active" en="Active" />
      </span>
    );
  if (s === "trial")
    return (
      <span className="ek-chip warn">
        <T fr="Essai" en="Trial" />
      </span>
    );
  if (s === "onboarding")
    return (
      <span className="ek-chip info">
        <T fr="Onboarding" en="Onboarding" />
      </span>
    );
  if (s === "suspended")
    return (
      <span className="ek-chip danger">
        <T fr="Suspendue" en="Suspended" />
      </span>
    );
  return <span className="ek-chip">{s}</span>;
}

export function SchoolsTable({
  rows,
  counts,
}: {
  rows: SchoolRow[];
  counts: Record<string, number>;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = rows
    .filter((r) => (filter === "all" ? true : r.status === filter))
    .filter((r) => (query ? (r.name + " " + r.city).toLowerCase().includes(query.toLowerCase()) : true));

  const chips: Array<{ key: Filter; label: string }> = [
    { key: "all",        label: `Toutes (${counts.all})` },
    { key: "active",     label: `Actives (${counts.active})` },
    { key: "onboarding", label: `Onboarding (${counts.onboarding})` },
    { key: "trial",      label: `Essai (${counts.trial})` },
    { key: "suspended",  label: `Suspendues (${counts.suspended})` },
  ];

  return (
    <>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {chips.map((c) => {
          const on = filter === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
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
              {c.label}
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
            placeholder="Filtrer école…"
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

      <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="ek-tablewrap">
        <div style={{ minWidth: 900 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2.2fr 0.7fr 1fr 1.1fr 1fr 0.8fr 1.8fr",
            padding: "12px 16px",
            fontSize: 11,
            fontWeight: 700,
            color: "var(--ink-3)",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            background: "var(--surface-2)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div><T fr="École" en="School" /></div>
          <div><T fr="Plan" en="Plan" /></div>
          <div><T fr="Parents · profs" en="Parents · teachers" /></div>
          <div><T fr="Cotisation 90$" en="Fee $90" /></div>
          <div><T fr="Statut" en="Status" /></div>
          <div><T fr="Depuis" en="Since" /></div>
          <div style={{ textAlign: "right" }}><T fr="Actions" en="Actions" /></div>
        </div>
        {filtered.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: "var(--ink-3)", fontSize: 12 }}>
            <T fr="Aucune école pour ce filtre." en="No schools for this filter." />
          </div>
        )}
        {filtered.map((r, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "2.2fr 0.7fr 1fr 1.1fr 1fr 0.8fr 1.8fr",
              padding: "12px 16px",
              alignItems: "center",
              fontSize: 12.5,
              borderBottom: i < filtered.length - 1 ? "1px solid var(--divider)" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 7,
                  background: "var(--surface-2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: "var(--ink-2)",
                  fontFamily: "var(--font-display)",
                }}
              >
                {r.name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("")}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: "var(--ink)" }}>{r.name}</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{r.city}</div>
              </div>
            </div>
            <div>
              <span className={`ek-chip ${r.plan === "Pro" ? "brand" : ""}`}>{r.plan}</span>
            </div>
            <div style={{ color: "var(--ink-2)", fontVariantNumeric: "tabular-nums" }}>
              {r.parents} · {r.teachers}
            </div>
            <div>
              {r.paidThisMonth ? (
                <span className="ek-chip success"><T fr="Payée" en="Paid" /></span>
              ) : (
                <span className="ek-chip warn"><T fr="Impayée" en="Unpaid" /></span>
              )}
            </div>
            <div>{statusChip(r.status)}</div>
            <div style={{ color: "var(--ink-3)" }}>{r.since}</div>
            <SchoolActions id={r.id} status={r.status} paid={r.paidThisMonth} />
          </div>
        ))}
        </div>
        </div>
      </div>
    </>
  );
}
