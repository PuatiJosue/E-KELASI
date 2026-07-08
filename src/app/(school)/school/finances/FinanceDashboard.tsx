"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/Avatar";
import { SexBadge } from "@/components/SexBadge";
import { ClassPicker } from "@/components/school/ClassPicker";
import {
  createFeeCategory, updateFeeCategory, deleteFeeCategory, applyCategoryToStudents,
  upsertStudentFee, deleteStudentFee, setStudentFinanceStatus, recordStudentPayment, loadStudentFinance,
  addAdvance, deleteAdvance, addInstallment, toggleInstallmentPaid, deleteInstallment,
  createInvoice, addCashEntry, deleteCashEntry, type InvoiceType,
  addInstallmentTemplate, updateInstallmentTemplate, deleteInstallmentTemplate, applyInstallmentToClass,
} from "./actions";
import type {
  FinanceOverview, FeeCategory, FinanceStudentRow, StudentFinanceDetail,
  StudentAdvance, StudentInstallment, PaymentStatus, FinanceStatus,
  CashEntry, CashSummary, InstallmentTemplate,
} from "@/lib/finance-db";

export type SchoolBranding = {
  name: string;
  city: string | null;
  commune: string | null;
  logoUrl: string | null;
  signatureUrl: string | null;
  directorName: string | null;
};

const cur = (c: string) => (c === "CDF" ? "FC" : c === "USD" ? "USD" : c);
const money = (n: number, c = "CDF") => `${Math.round(n).toLocaleString("fr-FR")} ${cur(c)}`;

const PAY: Record<PaymentStatus, { label: string; bg: string; fg: string }> = {
  paye:     { label: "Payé",     bg: "rgba(22,163,74,0.12)",  fg: "#16A34A" },
  partiel:  { label: "Partiel",  bg: "rgba(217,119,6,0.12)",  fg: "#B45309" },
  non_paye: { label: "Non payé", bg: "rgba(225,29,72,0.12)",  fg: "#E11D48" },
};
const STA: Record<FinanceStatus, { label: string; bg: string; fg: string }> = {
  en_ordre:   { label: "En ordre",   bg: "rgba(22,163,74,0.12)",  fg: "#16A34A" },
  non_paye:   { label: "Non payé",   bg: "rgba(225,29,72,0.12)",  fg: "#E11D48" },
  avance:     { label: "Avance",     bg: "rgba(79,102,232,0.12)", fg: "#4F66E8" },
  insolvable: { label: "Insolvable", bg: "rgba(120,53,15,0.12)",  fg: "#92400E" },
};

const STATUS_OPTIONS: { v: FinanceStatus; l: string }[] = [
  { v: "en_ordre", l: "En ordre" },
  { v: "non_paye", l: "Non payé" },
  { v: "avance", l: "Avance" },
  { v: "insolvable", l: "Insolvable" },
];

const TABS = [
  { key: "overview", label: "Vue d'ensemble" },
  { key: "rubriques", label: "Rubriques des frais" },
  { key: "avances", label: "Avances & Acomptes" },
  { key: "echeances", label: "Tranches & Échéances" },
  { key: "eleves", label: "Élèves" },
  { key: "insolvabilite", label: "Insolvabilité" },
  { key: "caisse", label: "Caisse" },
  { key: "rapports", label: "Rapports" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export function FinanceDashboard({
  overview, categories, advances, installments, templates, year, classNames,
  cashEntries, cashSummary, school,
}: {
  overview: FinanceOverview;
  categories: FeeCategory[];
  advances: StudentAdvance[];
  installments: StudentInstallment[];
  templates: InstallmentTemplate[];
  year: string;
  classNames: string[];
  cashEntries: CashEntry[];
  cashSummary: CashSummary;
  school: SchoolBranding;
}) {
  const [tab, setTab] = useState<TabKey>("eleves");
  const [invoiceModal, setInvoiceModal] = useState(false);
  const c = overview.currency;
  const k = overview.kpis;

  const pct = (v: number) => (k.totalDue > 0 ? `${((v / k.totalDue) * 100).toFixed(1)}%` : "—");

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* En-tête */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)" }}>Finance</h1>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}>
            Gérez les frais, paiements et la situation financière des élèves
          </div>
        </div>
        <select defaultValue={year} style={selStyle}>
          <option>{`Année scolaire ${year}`}</option>
        </select>
        <button onClick={() => setInvoiceModal(true)} className="ek-btn ek-btn-primary" style={{ height: 40 }}>
          <Icon name="file" size={15} stroke={2.5} /> Créer une facture
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
        <Kpi icon="creditcard" tint="#4F66E8" label="Total à encaisser" value={money(k.totalDue, c)} sub="Montant total dû" />
        <Kpi icon="check" tint="#16A34A" label="Total encaissé" value={money(k.totalPaid, c)} sub={`${pct(k.totalPaid)} du total`} />
        <Kpi icon="clock" tint="#D97706" label="En attente" value={money(k.pending, c)} sub={`${pct(k.pending)} du total`} />
        <Kpi icon="flag" tint="#E11D48" label="En retard" value={money(k.late, c)} sub={`${pct(k.late)} du total`} />
      </div>

      {/* Onglets */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
        {TABS.map((t) => {
          const on = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "10px 14px", fontSize: 13, fontWeight: on ? 700 : 500, whiteSpace: "nowrap",
                color: on ? "var(--brand-600)" : "var(--ink-2)", background: "none", border: "none", cursor: "pointer",
                borderBottom: `2px solid ${on ? "var(--brand-600)" : "transparent"}`, marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "eleves" && <ElevesTab overview={overview} categories={categories} />}
      {tab === "rubriques" && <RubriquesTab categories={categories} classNames={classNames} />}
      {tab === "overview" && <OverviewTab overview={overview} />}
      {tab === "insolvabilite" && <InsolvabiliteTab overview={overview} />}
      {tab === "caisse" && <CaisseTab entries={cashEntries} summary={cashSummary} school={school} />}
      {tab === "rapports" && <RapportsTab overview={overview} />}
      {tab === "avances" && <AdvancesTab advances={advances} currency={c} />}
      {tab === "echeances" && <InstallmentsTab installments={installments} templates={templates} students={overview.students} currency={c} />}

      {invoiceModal && <InvoiceModal students={overview.students} categories={categories} school={school} onClose={() => setInvoiceModal(false)} />}
    </div>
  );
}

// ── KPI ──────────────────────────────────────────────────────────────
function Kpi({ icon, tint, label, value, sub }: { icon: string; tint: string; label: string; value: string; sub: string }) {
  return (
    <div className="ek-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>{label}</span>
        <span style={{ width: 30, height: 30, borderRadius: 8, background: `${tint}1a`, color: tint, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={16} stroke={2} />
        </span>
      </div>
      <div style={{ fontSize: 19, fontWeight: 800, color: "var(--ink)", fontFamily: "var(--font-display)" }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{sub}</div>
    </div>
  );
}

// ── Onglet Élèves (tuiles de classes) ────────────────────────────────
function ElevesTab({ overview, categories }: { overview: FinanceOverview; categories: FeeCategory[] }) {
  const c = overview.currency;
  const [query, setQuery] = useState("");
  const [activeClass, setActiveClass] = useState("");
  const [payF, setPayF] = useState<"" | PaymentStatus>("");
  const [statF, setStatF] = useState<"" | FinanceStatus>("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<string | null>(null);

  // Classes (avec effectif) pour les tuiles.
  const classList = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of overview.students) counts.set(s.className, (counts.get(s.className) ?? 0) + 1);
    return [...counts.entries()].map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, "fr", { numeric: true }));
  }, [overview.students]);

  const q = query.trim().toLowerCase();
  const cls = activeClass && classList.some((x) => x.name === activeClass) ? activeClass : classList[0]?.name ?? "";

  const filtered = useMemo(() => {
    return overview.students.filter((s) => {
      if (q) {
        if (!s.fullName.toLowerCase().includes(q) && !s.matricule.toLowerCase().includes(q) && !s.className.toLowerCase().includes(q)) return false;
      } else if (s.className !== cls) return false;
      if (payF && s.paymentStatus !== payF) return false;
      if (statF && s.financeStatus !== statF) return false;
      return true;
    });
  }, [overview.students, q, cls, payF, statF]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const cur = Math.min(page, pages - 1);
  const pageRows = filtered.slice(cur * pageSize, cur * pageSize + pageSize);

  const exportCsv = () => exportStudentsCsv(filtered, c);
  const exportPdf = () => exportStudentsPdf(filtered, c);

  return (
    <>
      {/* Tuiles de classes (masquées pendant une recherche) */}
      {!q && classList.length > 0 && (
        <div className="ek-card" style={{ padding: 16 }}>
          <ClassPicker classes={classList} selected={cls} onSelect={(n) => { setActiveClass(n); setPage(0); }} />
        </div>
      )}

      {/* Barre d'outils */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)", display: "flex" }}>
            <Icon name="search" size={15} />
          </span>
          <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Rechercher un élève (nom, code, classe…)"
            style={{ width: "100%", padding: "9px 12px 9px 34px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)", fontSize: 13, color: "var(--ink)" }} />
        </div>
        <Select label="Statut de paiement" value={payF} onChange={(v) => { setPayF(v as any); setPage(0); }}
          options={[{ v: "", l: "Tous" }, { v: "paye", l: "Payé" }, { v: "partiel", l: "Partiel" }, { v: "non_paye", l: "Non payé" }]} />
        <Select label="Statut" value={statF} onChange={(v) => { setStatF(v as any); setPage(0); }}
          options={[{ v: "", l: "Tous" }, ...STATUS_OPTIONS.map((o) => ({ v: o.v, l: o.l }))]} />
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={exportPdf} className="ek-btn ek-btn-outline" style={{ height: 38, fontSize: 12.5 }}>
            <Icon name="file" size={14} /> PDF
          </button>
          <button onClick={exportCsv} className="ek-btn ek-btn-outline" style={{ height: 38, fontSize: 12.5 }}>
            <Icon name="download" size={14} /> Exporter
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 16, alignItems: "start" }} className="ek-fin-grid">
        {/* Tableau des élèves */}
        <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--divider)", fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>
            Liste des élèves ({filtered.length})
          </div>
          <div className="ek-tablewrap">
            <div style={{ minWidth: 820 }}>
              <div style={{ display: "grid", gridTemplateColumns: GRID, padding: "9px 16px", fontSize: 10.5, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.04em", background: "var(--surface-2)" }}>
                <div>Élève</div><div>Classe</div><div>Parent / Tuteur</div>
                <div style={{ textAlign: "right" }}>Total dû</div><div style={{ textAlign: "right" }}>Payé</div><div style={{ textAlign: "right" }}>Reste à payer</div>
                <div>Statut de paiement</div><div>Statut</div><div style={{ textAlign: "center" }}>Actions</div>
              </div>
              {pageRows.map((s, i) => (
                <div key={s.id} onClick={() => setSelected(s.id)}
                  style={{ display: "grid", gridTemplateColumns: GRID, padding: "10px 16px", alignItems: "center", fontSize: 12, cursor: "pointer",
                    borderTop: i > 0 ? "1px solid var(--divider)" : "none", background: selected === s.id ? "var(--brand-soft)" : "transparent" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <Avatar name={s.fullName} url={s.avatarUrl} size={28} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.fullName}</span>
                        <SexBadge sex={s.sex} size={14} />
                      </div>
                      <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}>{s.matricule}</div>
                    </div>
                  </div>
                  <div style={{ color: "var(--ink-2)" }}>{s.className}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: "var(--ink-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.parentName}</div>
                    {s.parentPhone && <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}>{s.parentPhone}</div>}
                  </div>
                  <div style={{ textAlign: "right", color: "var(--ink)", fontWeight: 600 }}>{money(s.totalDue, c)}</div>
                  <div style={{ textAlign: "right", color: "#16A34A", fontWeight: 600 }}>{money(s.paid, c)}</div>
                  <div style={{ textAlign: "right", color: s.remaining > 0 ? "#E11D48" : "var(--ink-3)", fontWeight: 600 }}>{money(s.remaining, c)}</div>
                  <div><Chip meta={PAY[s.paymentStatus]} /></div>
                  <div><Chip meta={STA[s.financeStatus]} /></div>
                  <div style={{ textAlign: "center", color: "var(--ink-3)" }} onClick={(e) => { e.stopPropagation(); setSelected(s.id); }}>⋯</div>
                </div>
              ))}
              {pageRows.length === 0 && (
                <div style={{ padding: 30, textAlign: "center", color: "var(--ink-3)", fontSize: 12.5 }}>Aucun élève.</div>
              )}
            </div>
          </div>
          {/* Pagination */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderTop: "1px solid var(--divider)", fontSize: 12, color: "var(--ink-3)", flexWrap: "wrap" }}>
            <span>Afficher</span>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }} style={{ ...selStyle, height: 30, padding: "0 8px" }}>
              {[10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>{filtered.length === 0 ? "0" : `${cur * pageSize + 1} – ${Math.min(filtered.length, (cur + 1) * pageSize)}`} sur {filtered.length}</span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
              <PgBtn disabled={cur === 0} onClick={() => setPage(cur - 1)}>‹</PgBtn>
              {Array.from({ length: pages }).slice(0, 5).map((_, i) => (
                <PgBtn key={i} active={i === cur} onClick={() => setPage(i)}>{i + 1}</PgBtn>
              ))}
              {pages > 5 && <span style={{ padding: "0 4px" }}>…</span>}
              <PgBtn disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>›</PgBtn>
            </div>
          </div>
        </div>

        {/* Colonne droite */}
        <RightPanel overview={overview} selected={selected} />
      </div>

      {/* Panneau détail */}
      {selected && <DetailPanel studentId={selected} currency={c} categories={categories} />}

      <style>{`@media (max-width: 980px){ .ek-fin-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </>
  );
}

const GRID = "1.7fr 0.8fr 1.3fr 1fr 0.9fr 1fr 1.1fr 0.9fr 0.5fr";

function Chip({ meta }: { meta: { label: string; bg: string; fg: string } }) {
  return (
    <span style={{ display: "inline-block", padding: "3px 9px", borderRadius: 999, background: meta.bg, color: meta.fg, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
      {meta.label}
    </span>
  );
}

function PgBtn({ children, active, disabled, onClick }: { children: React.ReactNode; active?: boolean; disabled?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ minWidth: 26, height: 26, borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: disabled ? "default" : "pointer",
        border: `1px solid ${active ? "var(--brand-600)" : "var(--border)"}`, background: active ? "var(--brand-600)" : "var(--surface)",
        color: active ? "#fff" : "var(--ink-2)", opacity: disabled ? 0.4 : 1 }}>
      {children}
    </button>
  );
}

// ── Colonne droite (camembert + situation + actions) ─────────────────
function RightPanel({ overview, selected }: { overview: FinanceOverview; selected: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const d = overview.distribution;
  const total = Math.max(1, overview.total);
  const segs = [
    { label: "Payés", value: d.paid, color: "#16A34A" },
    { label: "Partiels", value: d.partial, color: "#D97706" },
    { label: "Non payés", value: d.unpaid, color: "#E11D48" },
  ];
  const s = overview.situation;
  const sit = [
    { label: "En ordre", value: s.enOrdre, color: "#16A34A" },
    { label: "Non payés", value: s.nonPaye, color: "#E11D48" },
    { label: "Avance", value: s.avance, color: "#4F66E8" },
    { label: "Insolvables", value: s.insolvable, color: "#92400E" },
  ];

  const act = (status: FinanceStatus) => {
    if (!selected) { alert("Sélectionnez d'abord un élève dans la liste."); return; }
    start(async () => {
      const r = await setStudentFinanceStatus(selected, status);
      if (r.ok) router.refresh(); else alert(r.message);
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="ek-card" style={{ padding: 16 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", marginBottom: 12 }}>Répartition par statut de paiement</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Donut segments={segs} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
            {segs.map((sg) => (
              <div key={sg.label} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5 }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: sg.color }} />
                <span style={{ color: "var(--ink-2)", flex: 1 }}>{sg.label}</span>
                <span style={{ color: "var(--ink)", fontWeight: 700 }}>{sg.value}</span>
                <span style={{ color: "var(--ink-3)" }}>({((sg.value / total) * 100).toFixed(1)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ek-card" style={{ padding: 16 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", marginBottom: 12 }}>Situation des élèves</div>
        {sit.map((row) => (
          <div key={row.label} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 4 }}>
              <span style={{ color: "var(--ink-2)" }}>{row.label}</span>
              <span style={{ color: "var(--ink-3)" }}>{((row.value / total) * 100).toFixed(1)}% · {row.value} élèves</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: "var(--surface-2)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(row.value / total) * 100}%`, background: row.color }} />
            </div>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--divider)", fontSize: 12.5 }}>
          <span style={{ color: "var(--ink-2)", fontWeight: 600 }}>Total élèves</span>
          <span style={{ color: "var(--ink)", fontWeight: 800 }}>{overview.total}</span>
        </div>
      </div>

      <div className="ek-card" style={{ padding: 16 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", marginBottom: 10 }}>Actions rapides</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <QuickAction icon="check" label="Marquer « En ordre »" onClick={() => act("en_ordre")} disabled={pending} />
          <QuickAction icon="clock" label="Marquer « Non payé »" onClick={() => act("non_paye")} disabled={pending} />
          <QuickAction icon="creditcard" label="Marquer « Avance »" onClick={() => act("avance")} disabled={pending} />
          <QuickAction icon="flag" label="Marquer en insolvabilité" onClick={() => act("insolvable")} disabled={pending} />
          <QuickAction icon="bell" label="Envoyer un rappel de paiement" onClick={() => router.push("/school/messages?compose=reminder")} disabled={pending} />
        </div>
        {!selected && <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 8 }}>Sélectionnez un élève pour changer son statut. Le rappel ouvre la messagerie.</div>}
      </div>
    </div>
  );
}

function QuickAction({ icon, label, onClick, disabled }: { icon: string; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontSize: 12, color: "var(--ink-2)", textAlign: "left", opacity: disabled ? 0.6 : 1 }}>
      <Icon name={icon} size={14} /> <span style={{ flex: 1 }}>{label}</span>
    </button>
  );
}

function Donut({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const R = 30, C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <svg width={80} height={80} viewBox="0 0 80 80" style={{ flexShrink: 0 }}>
      <circle cx={40} cy={40} r={R} fill="none" stroke="var(--surface-2)" strokeWidth={12} />
      {segments.map((s, i) => {
        const len = (s.value / total) * C;
        const el = (
          <circle key={i} cx={40} cy={40} r={R} fill="none" stroke={s.color} strokeWidth={12}
            strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} transform="rotate(-90 40 40)" />
        );
        offset += len;
        return el;
      })}
      <text x={40} y={44} textAnchor="middle" fontSize={15} fontWeight={800} fill="var(--ink)">{total}</text>
    </svg>
  );
}

// ── Panneau détail (bas) ─────────────────────────────────────────────
function DetailPanel({ studentId, currency, categories }: { studentId: string; currency: string; categories: FeeCategory[] }) {
  const router = useRouter();
  const [detail, setDetail] = useState<StudentFinanceDetail | null>(null);
  const [subtab, setSubtab] = useState<"frais" | "echeances" | "paiements" | "avances" | "historique">("frais");
  const [loading, setLoading] = useState(true);
  const [feeForm, setFeeForm] = useState(false);
  const [payForm, setPayForm] = useState(false);
  const [advForm, setAdvForm] = useState(false);
  const [instForm, setInstForm] = useState(false);

  const reload = () => {
    setLoading(true);
    loadStudentFinance(studentId).then((d) => { setDetail(d); setLoading(false); });
  };
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [studentId]);

  if (loading && !detail) return <div className="ek-card" style={{ padding: 20, color: "var(--ink-3)", fontSize: 13 }}>Chargement du détail…</div>;
  if (!detail) return null;
  const s = detail.student;

  return (
    <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
      {/* En-tête élève */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Avatar name={s.fullName} url={s.avatarUrl} size={40} />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{s.fullName}</span>
            <SexBadge sex={s.sex} size={15} />
            <span style={{ fontSize: 11, color: "var(--ink-3)" }}>({s.matricule})</span>
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>Classe : {s.className} · Parent : {s.parentName}{s.parentPhone ? ` · ${s.parentPhone}` : ""}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <StatusSelect studentId={studentId} value={s.financeStatus} onChanged={() => { reload(); router.refresh(); }} />
        </div>
      </div>

      {/* Résumé chiffres */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 1, background: "var(--border)" }}>
        <MiniStat label="Total dû" value={money(s.totalDue, currency)} color="var(--ink)" />
        <MiniStat label="Payé" value={money(s.paid, currency)} color="#16A34A" />
        <MiniStat label="Reste à payer" value={money(s.remaining, currency)} color="#E11D48" />
        <MiniStat label="Statut de paiement" value={PAY[s.paymentStatus].label} color={PAY[s.paymentStatus].fg} />
      </div>

      {/* Sous-onglets */}
      <div style={{ display: "flex", gap: 4, padding: "8px 12px", borderBottom: "1px solid var(--divider)", flexWrap: "wrap" }}>
        {([["frais", "Détail des frais"], ["echeances", "Échéances"], ["paiements", "Paiements"], ["avances", "Avances & Acomptes"], ["historique", "Historique"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setSubtab(k)}
            style={{ padding: "6px 11px", fontSize: 12, fontWeight: subtab === k ? 700 : 500, borderRadius: 8, border: "none", cursor: "pointer",
              background: subtab === k ? "var(--brand-soft)" : "transparent", color: subtab === k ? "var(--brand-600)" : "var(--ink-2)" }}>
            {l}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button onClick={() => setFeeForm(true)} className="ek-btn ek-btn-outline" style={{ height: 30, fontSize: 11.5 }}><Icon name="plus" size={12} /> Frais</button>
          <button onClick={() => setPayForm(true)} className="ek-btn ek-btn-primary" style={{ height: 30, fontSize: 11.5 }}><Icon name="plus" size={12} /> Paiement</button>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {subtab === "frais" && (
          <div className="ek-tablewrap">
            <div style={{ minWidth: 680 }}>
              <div style={{ display: "grid", gridTemplateColumns: FEE_GRID, padding: "8px 4px", fontSize: 10, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.03em", borderBottom: "1px solid var(--divider)" }}>
                <div>Rubrique</div><div style={{ textAlign: "right" }}>Total dû</div><div style={{ textAlign: "right" }}>Avances & Acomptes</div><div style={{ textAlign: "center" }}>Échéances (Payé / Total)</div><div style={{ textAlign: "right" }}>Reste à payer</div><div />
              </div>
              {detail.fees.length === 0 ? (
                <div style={{ padding: 16, color: "var(--ink-3)", fontSize: 12.5 }}>Aucune rubrique. Cliquez sur « + Frais » pour en ajouter.</div>
              ) : detail.fees.map((f) => (
                <div key={f.id} style={{ display: "grid", gridTemplateColumns: FEE_GRID, padding: "9px 4px", alignItems: "center", fontSize: 12, borderBottom: "1px solid var(--divider)" }}>
                  <div style={{ color: "var(--ink)", fontWeight: 600 }}>{f.label}</div>
                  <div style={{ textAlign: "right" }}>{money(f.amountDue, f.currency)}</div>
                  <div style={{ textAlign: "right", color: f.advances > 0 ? "#4F66E8" : "var(--ink-3)" }}>{money(f.advances, f.currency)}</div>
                  <div style={{ textAlign: "center", color: "var(--ink-2)" }}>
                    {f.echTotalCount > 0 ? `${f.echPaidCount}/${f.echTotalCount} (${money(f.echPaidAmount, f.currency)} / ${money(f.echTotalAmount, f.currency)})` : "—"}
                  </div>
                  <div style={{ textAlign: "right", color: f.remaining > 0 ? "#E11D48" : "#16A34A", fontWeight: 600 }}>{money(f.remaining, f.currency)}</div>
                  <DeleteFee id={f.id} onDone={reload} />
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: FEE_GRID, padding: "10px 4px", fontSize: 12, fontWeight: 800 }}>
                <div>Total</div>
                <div style={{ textAlign: "right" }}>{money(s.totalDue, currency)}</div>
                <div style={{ textAlign: "right", color: "#4F66E8" }}>{money(detail.advances.reduce((a, x) => a + x.amount, 0), currency)}</div>
                <div />
                <div style={{ textAlign: "right", color: "#E11D48" }}>{money(s.remaining, currency)}</div>
                <div />
              </div>
            </div>
          </div>
        )}

        {subtab === "avances" && (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
              <button onClick={() => setAdvForm(true)} className="ek-btn ek-btn-outline" style={{ height: 30, fontSize: 11.5 }}><Icon name="plus" size={12} /> Avance / acompte</button>
            </div>
            {detail.advances.length === 0 ? (
              <div style={{ color: "var(--ink-3)", fontSize: 12.5 }}>Aucune avance ni acompte enregistré.</div>
            ) : detail.advances.map((a) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, borderBottom: "1px solid var(--divider)", padding: "8px 0" }}>
                <span style={{ fontWeight: 700, color: "#4F66E8" }}>{money(a.amount, a.currency)}</span>
                <span style={{ color: "var(--ink-2)", flex: 1 }}>{a.categoryLabel ?? "Général"}{a.note ? ` · ${a.note}` : ""}</span>
                <span style={{ color: "var(--ink-3)", fontSize: 11 }}>{new Date(a.createdAt).toLocaleDateString("fr-FR")}</span>
                <RowDelete onDelete={async () => { await deleteAdvance(a.id); reload(); router.refresh(); }} />
              </div>
            ))}
          </div>
        )}

        {subtab === "echeances" && (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
              <button onClick={() => setInstForm(true)} className="ek-btn ek-btn-outline" style={{ height: 30, fontSize: 11.5 }}><Icon name="plus" size={12} /> Tranche / échéance</button>
            </div>
            {detail.installments.length === 0 ? (
              <div style={{ color: "var(--ink-3)", fontSize: 12.5 }}>Aucune tranche définie. Découpez une rubrique en versements datés.</div>
            ) : detail.installments.map((it) => {
              const overdue = !it.paidAt && it.dueDate && new Date(it.dueDate) < new Date();
              return (
                <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, borderBottom: "1px solid var(--divider)", padding: "8px 0" }}>
                  <input type="checkbox" checked={!!it.paidAt} onChange={(e) => { toggleInstallmentPaid(it.id, e.target.checked).then(() => { reload(); router.refresh(); }); }} />
                  <span style={{ fontWeight: 700, color: "var(--ink)" }}>{money(it.amount, it.currency)}</span>
                  <span style={{ color: "var(--ink-2)", flex: 1 }}>{it.label}{it.categoryLabel ? ` · ${it.categoryLabel}` : ""}</span>
                  <span style={{ fontSize: 11, color: it.paidAt ? "#16A34A" : overdue ? "#E11D48" : "var(--ink-3)", fontWeight: 600 }}>
                    {it.paidAt ? "Payée" : overdue ? "En retard" : "À venir"}{it.dueDate ? ` · ${new Date(it.dueDate).toLocaleDateString("fr-FR")}` : ""}
                  </span>
                  <RowDelete onDelete={async () => { await deleteInstallment(it.id); reload(); router.refresh(); }} />
                </div>
              );
            })}
          </div>
        )}

        {subtab === "paiements" && (
          detail.payments.length === 0
            ? <div style={{ color: "var(--ink-3)", fontSize: 12.5 }}>Aucun paiement enregistré.</div>
            : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {detail.payments.map((p) => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, borderBottom: "1px solid var(--divider)", paddingBottom: 6 }}>
                    <span style={{ color: "var(--ink)" }}>{money(p.amount, p.currency)}{p.label ? ` · ${p.label}` : ""}</span>
                    <span style={{ color: "var(--ink-3)" }}>{new Date(p.paidAt).toLocaleDateString("fr-FR")}</span>
                  </div>
                ))}
              </div>
        )}

        {subtab === "historique" && (
          <HistoryList detail={detail} />
        )}
      </div>

      {feeForm && <FeeModal studentId={studentId} onClose={() => setFeeForm(false)} onDone={() => { setFeeForm(false); reload(); }} />}
      {payForm && <PaymentModal studentId={studentId} onClose={() => setPayForm(false)} onDone={() => { setPayForm(false); reload(); router.refresh(); }} />}
      {advForm && <AdvanceModal studentId={studentId} categories={categories} onClose={() => setAdvForm(false)} onDone={() => { setAdvForm(false); reload(); router.refresh(); }} />}
      {instForm && <InstallmentModal studentId={studentId} categories={categories} onClose={() => setInstForm(false)} onDone={() => { setInstForm(false); reload(); router.refresh(); }} />}
    </div>
  );
}

// Sélecteur de statut financier de l'élève (En ordre / Non payé / Avance / Insolvable).
function StatusSelect({ studentId, value, onChanged }: { studentId: string; value: FinanceStatus; onChanged: () => void }) {
  const [pending, start] = useTransition();
  const meta = STA[value];
  return (
    <select
      value={value}
      disabled={pending}
      onChange={(e) => { const v = e.target.value as FinanceStatus; start(async () => { const r = await setStudentFinanceStatus(studentId, v); if (r.ok) onChanged(); else alert(r.message); }); }}
      style={{ height: 30, padding: "0 8px", borderRadius: 999, border: `1px solid ${meta.fg}`, background: meta.bg, color: meta.fg, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
    >
      {STATUS_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ padding: "12px 14px", background: "var(--surface)" }}>
      <div style={{ fontSize: 10.5, color: "var(--ink-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color, marginTop: 3, fontFamily: "var(--font-display)" }}>{value}</div>
    </div>
  );
}

const FEE_GRID = "1.7fr 1fr 1.1fr 1.6fr 1fr auto";

function DeleteFee({ id, onDone }: { id: string; onDone: () => void }) {
  const [pending, start] = useTransition();
  return (
    <button onClick={() => { if (confirm("Supprimer cette rubrique de frais ?")) start(async () => { await deleteStudentFee(id); onDone(); }); }}
      disabled={pending} title="Supprimer" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", padding: 4 }}>
      <Icon name="trash" size={14} />
    </button>
  );
}

function RowDelete({ onDelete }: { onDelete: () => Promise<void> }) {
  const [pending, start] = useTransition();
  return (
    <button onClick={() => { if (confirm("Supprimer ?")) start(() => onDelete()); }} disabled={pending} title="Supprimer"
      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", padding: 4, display: "flex" }}>
      <Icon name="trash" size={13} />
    </button>
  );
}

function HistoryList({ detail }: { detail: StudentFinanceDetail }) {
  const items = [
    ...detail.payments.map((p) => ({ date: p.paidAt, label: `Paiement${p.label ? ` · ${p.label}` : ""}`, amount: p.amount, currency: p.currency, color: "#16A34A" })),
    ...detail.advances.map((a) => ({ date: a.createdAt.slice(0, 10), label: `Avance / acompte${a.categoryLabel ? ` · ${a.categoryLabel}` : ""}`, amount: a.amount, currency: a.currency, color: "#4F66E8" })),
    ...detail.installments.filter((i) => i.paidAt).map((i) => ({ date: i.paidAt!, label: `Tranche payée · ${i.label}`, amount: i.amount, currency: i.currency, color: "#16A34A" })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));
  if (items.length === 0) return <div style={{ color: "var(--ink-3)", fontSize: 12.5 }}>Aucune opération enregistrée.</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, borderBottom: "1px solid var(--divider)", paddingBottom: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: it.color }} />
          <span style={{ flex: 1, color: "var(--ink-2)" }}>{it.label}</span>
          <span style={{ fontWeight: 700, color: "var(--ink)" }}>{money(it.amount, it.currency)}</span>
          <span style={{ color: "var(--ink-3)", fontSize: 11 }}>{new Date(it.date).toLocaleDateString("fr-FR")}</span>
        </div>
      ))}
    </div>
  );
}

// ── Onglet Avances & Acomptes (école) ────────────────────────────────
function AdvancesTab({ advances, currency }: { advances: StudentAdvance[]; currency: string }) {
  const total = advances.reduce((a, x) => a + x.amount, 0);
  return (
    <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center" }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, flex: 1 }}>Avances & Acomptes ({advances.length})</div>
        <div style={{ fontSize: 12.5, color: "var(--ink-2)" }}>Total : <strong>{money(total, currency)}</strong></div>
      </div>
      <div style={{ padding: "8px 16px 4px", fontSize: 11.5, color: "var(--ink-3)" }}>
        Pour en ajouter, ouvrez un élève dans l’onglet « Élèves » → sous-onglet « Avances & Acomptes ».
      </div>
      {advances.length === 0 ? (
        <div style={{ padding: 26, textAlign: "center", color: "var(--ink-3)", fontSize: 12.5 }}>Aucune avance enregistrée.</div>
      ) : advances.map((a, i) => (
        <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderTop: i > 0 ? "1px solid var(--divider)" : "none", fontSize: 12.5 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 600 }}>{a.studentName}</span> <span style={{ color: "var(--ink-3)" }}>· {a.className}</span>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{a.categoryLabel ?? "Général"}{a.note ? ` · ${a.note}` : ""}</div>
          </div>
          <span style={{ fontWeight: 700, color: "#4F66E8" }}>{money(a.amount, a.currency)}</span>
          <span style={{ color: "var(--ink-3)", fontSize: 11 }}>{new Date(a.createdAt).toLocaleDateString("fr-FR")}</span>
        </div>
      ))}
    </div>
  );
}

// ── Onglet Tranches & Échéances (barème → classes → montant par élève) ─
function InstallmentsTab({ installments, templates, students, currency }: { installments: StudentInstallment[]; templates: InstallmentTemplate[]; students: FinanceStudentRow[]; currency: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 1) Barème des tranches */}
      <BaremeTranches templates={templates} />

      {/* 2) Application par classe (montant par élève) */}
      <ApplyInstallmentsByClass templates={templates} students={students} />

      {/* 3) État des tranches enregistrées */}
      <InstallmentsStatus installments={installments} pending={pending} start={start} router={router} />
    </div>
  );
}

// Barème réutilisable : Tranche · Période · Montant.
function BaremeTranches({ templates }: { templates: InstallmentTemplate[] }) {
  const [modal, setModal] = useState<null | InstallmentTemplate | "new">(null);
  return (
    <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center" }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, flex: 1 }}>Barème des tranches ({templates.length})</div>
        <button onClick={() => setModal("new")} className="ek-btn ek-btn-primary" style={{ height: 34, fontSize: 12.5 }}><Icon name="plus" size={13} /> Ajouter une tranche</button>
      </div>
      <div className="ek-tablewrap">
        <div style={{ minWidth: 560 }}>
          <div style={{ display: "grid", gridTemplateColumns: TR_GRID, padding: "8px 16px", fontSize: 10.5, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.04em", background: "var(--surface-2)" }}>
            <div>Tranche</div><div>Période</div><div style={{ textAlign: "right" }}>Montant</div><div style={{ textAlign: "center" }}>Actions</div>
          </div>
          {templates.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--ink-3)", fontSize: 12.5 }}>Aucune tranche. Cliquez sur « Ajouter une tranche ».</div>
          ) : templates.map((t, i) => (
            <div key={t.id} style={{ display: "grid", gridTemplateColumns: TR_GRID, padding: "10px 16px", alignItems: "center", fontSize: 12.5, borderTop: i > 0 ? "1px solid var(--divider)" : "none" }}>
              <div style={{ fontWeight: 600, color: "var(--ink)" }}>{t.name}</div>
              <div style={{ color: "var(--ink-2)" }}>{t.period || "—"}</div>
              <div style={{ textAlign: "right", fontWeight: 700 }}>{money(t.amount, t.currency)}</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
                <button onClick={() => setModal(t)} title="Modifier" style={iconBtn}><Icon name="edit" size={14} /></button>
                <TemplateDelete id={t.id} name={t.name} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {modal && <TemplateModal existing={modal === "new" ? undefined : modal} onClose={() => setModal(null)} />}
    </div>
  );
}

const TR_GRID = "1.1fr 2.2fr 0.9fr 0.7fr";

function TemplateDelete({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button onClick={() => { if (confirm(`Supprimer « ${name} » du barème ?`)) start(async () => { await deleteInstallmentTemplate(id); router.refresh(); }); }} disabled={pending} title="Supprimer" style={iconBtn}><Icon name="trash" size={14} /></button>
  );
}

function TemplateModal({ existing, onClose }: { existing?: InstallmentTemplate; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState(existing?.name ?? "");
  const [period, setPeriod] = useState(existing?.period ?? "");
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [currency, setCurrency] = useState(existing?.currency ?? "CDF");
  const [error, setError] = useState<string | null>(null);
  const submit = () => {
    if (!name.trim()) { setError("Nom requis."); return; }
    const amt = parseFloat(amount.replace(",", ".")) || 0;
    start(async () => {
      const r = existing
        ? await updateInstallmentTemplate({ id: existing.id, name, period, amount: amt, currency })
        : await addInstallmentTemplate({ name, period, amount: amt, currency });
      if (r.ok) { onClose(); router.refresh(); } else setError(r.message);
    });
  };
  return (
    <Modal title={existing ? "Modifier la tranche" : "Nouvelle tranche"} onClose={onClose}>
      <Labeled label="Tranche"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="2ème tranche" style={modalInp} /></Labeled>
      <Labeled label="Période"><input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="Début janvier à fin février 2027 (durant 2 mois)" style={modalInp} /></Labeled>
      <div style={{ display: "flex", gap: 10 }}>
        <Labeled label="Montant" style={{ flex: 1 }}><input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))} inputMode="decimal" placeholder="100" style={modalInp} /></Labeled>
        <Labeled label="Devise" style={{ width: 100 }}><select value={currency} onChange={(e) => setCurrency(e.target.value)} style={modalInp}><option value="CDF">FC</option><option value="USD">USD</option></select></Labeled>
      </div>
      {error && <div style={errBox}>{error}</div>}
      <ModalActions onClose={onClose} onSubmit={submit} pending={pending} />
    </Modal>
  );
}

// Application d'une tranche à une classe : montant par élève (nom, post-nom, sexe).
function ApplyInstallmentsByClass({ templates, students }: { templates: InstallmentTemplate[]; students: FinanceStudentRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [activeClass, setActiveClass] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [skip, setSkip] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const classList = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of students) counts.set(s.className, (counts.get(s.className) ?? 0) + 1);
    return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name, "fr", { numeric: true }));
  }, [students]);
  const cls = activeClass && classList.some((x) => x.name === activeClass) ? activeClass : classList[0]?.name ?? "";
  const tpl = templates.find((t) => t.id === templateId) ?? templates[0] ?? null;
  const classStudents = useMemo(() => students.filter((s) => s.className === cls).sort((a, b) => a.fullName.localeCompare(b.fullName)), [students, cls]);

  const amountOf = (id: string) => (amounts[id] !== undefined ? amounts[id] : tpl ? String(tpl.amount) : "");
  const toggleSkip = (id: string) => setSkip((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const apply = () => {
    setMsg(null);
    if (!tpl) { setMsg({ ok: false, text: "Créez d'abord une tranche dans le barème." }); return; }
    const entries = classStudents.filter((s) => !skip.has(s.id)).map((s) => ({ studentId: s.id, amount: parseFloat(amountOf(s.id).replace(",", ".")) || 0 }));
    start(async () => {
      const r = await applyInstallmentToClass({ name: tpl.name, period: tpl.period ?? undefined, currency: tpl.currency, entries });
      if (r.ok) { setMsg({ ok: true, text: `Tranche « ${tpl.name} » appliquée à la classe.` }); setAmounts({}); setSkip(new Set()); router.refresh(); }
      else setMsg({ ok: false, text: r.message });
    });
  };

  return (
    <div className="ek-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 13.5, fontWeight: 700 }}>Appliquer une tranche à une classe</div>

      {classList.length === 0 ? (
        <div style={{ color: "var(--ink-3)", fontSize: 12.5 }}>Aucune classe (aucun élève actif).</div>
      ) : (
        <>
          <ClassPicker classes={classList} selected={cls} onSelect={(n) => { setActiveClass(n); setAmounts({}); setSkip(new Set()); }} />

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Labeled label="Tranche à appliquer" style={{ minWidth: 240, flex: 1 }}>
              <select value={tpl?.id ?? ""} onChange={(e) => { setTemplateId(e.target.value); setAmounts({}); }} style={modalInp}>
                {templates.length === 0 && <option value="">— aucune tranche —</option>}
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name} · {money(t.amount, t.currency)}</option>)}
              </select>
            </Labeled>
            {tpl?.period && <div style={{ fontSize: 12, color: "var(--ink-3)", alignSelf: "flex-end", paddingBottom: 8 }}>Période : {tpl.period}</div>}
          </div>

          <div className="ek-tablewrap">
            <div style={{ minWidth: 520 }}>
              <div style={{ display: "grid", gridTemplateColumns: APP_GRID, padding: "8px 4px", fontSize: 10.5, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.03em", borderBottom: "1px solid var(--divider)" }}>
                <div>Élève (nom · post-nom)</div><div style={{ textAlign: "center" }}>Sexe</div><div style={{ textAlign: "right" }}>Montant</div><div style={{ textAlign: "center" }}>Inclure</div>
              </div>
              {classStudents.length === 0 ? (
                <div style={{ padding: 16, color: "var(--ink-3)", fontSize: 12.5 }}>Aucun élève dans cette classe.</div>
              ) : classStudents.map((s) => (
                <div key={s.id} style={{ display: "grid", gridTemplateColumns: APP_GRID, padding: "8px 4px", alignItems: "center", fontSize: 12.5, borderBottom: "1px solid var(--divider)", opacity: skip.has(s.id) ? 0.45 : 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <Avatar name={s.fullName} url={s.avatarUrl} size={24} />
                    <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.fullName}</span>
                  </div>
                  <div style={{ textAlign: "center" }}><SexBadge sex={s.sex} size={14} /></div>
                  <div style={{ textAlign: "right" }}>
                    <input value={amountOf(s.id)} onChange={(e) => setAmounts((p) => ({ ...p, [s.id]: e.target.value.replace(/[^\d.,]/g, "") }))} inputMode="decimal"
                      style={{ width: 110, textAlign: "right", padding: "6px 8px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface)", fontSize: 12.5, color: "var(--ink)" }} />
                  </div>
                  <div style={{ textAlign: "center" }}><input type="checkbox" checked={!skip.has(s.id)} onChange={() => toggleSkip(s.id)} /></div>
                </div>
              ))}
            </div>
          </div>

          {msg && <div style={{ fontSize: 12.5, fontWeight: 600, color: msg.ok ? "#16A34A" : "var(--danger)" }}>{msg.text}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={apply} disabled={pending || !tpl || classStudents.length === 0} className="ek-btn ek-btn-primary" style={{ height: 40, fontSize: 13, opacity: pending || !tpl || classStudents.length === 0 ? 0.6 : 1 }}>
              <Icon name="check" size={15} /> Appliquer à la classe
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const APP_GRID = "1.8fr 0.6fr 1fr 0.6fr";

// État des tranches enregistrées (suivi + marquage payé).
function InstallmentsStatus({ installments, pending, start, router }: { installments: StudentInstallment[]; pending: boolean; start: React.TransitionStartFunction; router: ReturnType<typeof useRouter> }) {
  const today = new Date();
  const overdue = installments.filter((i) => !i.paidAt && i.dueDate && new Date(i.dueDate) < today);
  const upcoming = installments.filter((i) => !i.paidAt && (!i.dueDate || new Date(i.dueDate) >= today));
  const paid = installments.filter((i) => i.paidAt);

  const Section = ({ title, rows, tint }: { title: string; rows: StudentInstallment[]; tint: string }) => (
    <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--divider)", fontSize: 13, fontWeight: 700, color: tint }}>{title} ({rows.length})</div>
      {rows.length === 0 ? <div style={{ padding: 18, textAlign: "center", color: "var(--ink-3)", fontSize: 12 }}>—</div> : rows.map((it, i) => (
        <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", borderTop: i > 0 ? "1px solid var(--divider)" : "none", fontSize: 12.5 }}>
          <input type="checkbox" checked={!!it.paidAt} onChange={(e) => start(async () => { await toggleInstallmentPaid(it.id, e.target.checked); router.refresh(); })} disabled={pending} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 600 }}>{it.studentName}</span> <span style={{ color: "var(--ink-3)" }}>· {it.className}</span>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{it.label}{it.period ? ` · ${it.period}` : ""}</div>
          </div>
          <span style={{ fontWeight: 700 }}>{money(it.amount, it.currency)}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 13.5, fontWeight: 700 }}>État des tranches</div>
      <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>Cochez pour marquer une tranche payée. (Les tranches appliquées ci-dessus apparaissent ici.)</div>
      <Section title="En retard" rows={overdue} tint="#E11D48" />
      <Section title="À venir" rows={upcoming} tint="#B45309" />
      <Section title="Payées" rows={paid} tint="#16A34A" />
    </div>
  );
}

function AdvanceModal({ studentId, categories, onClose, onDone }: { studentId: string; categories: FeeCategory[]; onClose: () => void; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("CDF");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Préremplit le montant depuis la rubrique choisie (montant par défaut).
  const pickCategory = (id: string) => {
    setCategoryId(id);
    const cat = categories.find((c) => c.id === id);
    if (cat) { setAmount(String(cat.amount)); setCurrency(cat.currency); }
  };
  const submit = () => {
    const amt = parseFloat(amount.replace(",", ".")) || 0;
    if (!(amt > 0)) { setError("Montant invalide."); return; }
    start(async () => { const r = await addAdvance({ studentId, categoryId: categoryId || null, amount: amt, currency, note }); if (r.ok) onDone(); else setError(r.message); });
  };
  return (
    <Modal title="Avance / acompte" onClose={onClose}>
      <Labeled label="Rubrique (optionnel)">
        <select value={categoryId} onChange={(e) => pickCategory(e.target.value)} style={modalInp}>
          <option value="">Général</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Labeled>
      <div style={{ display: "flex", gap: 10 }}>
        <Labeled label="Montant" style={{ flex: 1 }}><input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))} inputMode="decimal" placeholder="10000" style={modalInp} /></Labeled>
        <Labeled label="Devise" style={{ width: 110 }}><select value={currency} onChange={(e) => setCurrency(e.target.value)} style={modalInp}><option value="CDF">FC</option><option value="USD">USD</option></select></Labeled>
      </div>
      <Labeled label="Note (optionnel)"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Acompte inscription…" style={modalInp} /></Labeled>
      {error && <div style={errBox}>{error}</div>}
      <ModalActions onClose={onClose} onSubmit={submit} pending={pending} />
    </Modal>
  );
}

function InstallmentModal({ studentId, categories, onClose, onDone }: { studentId: string; categories: FeeCategory[]; onClose: () => void; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [categoryId, setCategoryId] = useState("");
  const [label, setLabel] = useState("");
  const [period, setPeriod] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("CDF");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const pickCategory = (id: string) => {
    setCategoryId(id);
    const cat = categories.find((c) => c.id === id);
    if (cat) { setAmount(String(cat.amount)); setCurrency(cat.currency); }
  };
  const submit = () => {
    const amt = parseFloat(amount.replace(",", ".")) || 0;
    if (!(amt > 0)) { setError("Montant invalide."); return; }
    start(async () => { const r = await addInstallment({ studentId, categoryId: categoryId || null, label: label || "Tranche", period, amount: amt, currency, dueDate }); if (r.ok) onDone(); else setError(r.message); });
  };
  return (
    <Modal title="Tranche / échéance" onClose={onClose}>
      <Labeled label="Rubrique (optionnel)">
        <select value={categoryId} onChange={(e) => pickCategory(e.target.value)} style={modalInp}>
          <option value="">Général</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Labeled>
      <Labeled label="Libellé"><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Tranche 1 — scolarité" style={modalInp} /></Labeled>
      <Labeled label="Période (optionnel)"><input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="Début janvier à fin février 2027" style={modalInp} /></Labeled>
      <div style={{ display: "flex", gap: 10 }}>
        <Labeled label="Montant" style={{ flex: 1 }}><input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))} inputMode="decimal" placeholder="25000" style={modalInp} /></Labeled>
        <Labeled label="Devise" style={{ width: 110 }}><select value={currency} onChange={(e) => setCurrency(e.target.value)} style={modalInp}><option value="CDF">FC</option><option value="USD">USD</option></select></Labeled>
      </div>
      <Labeled label="Date d'échéance (optionnel)"><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={modalInp} /></Labeled>
      {error && <div style={errBox}>{error}</div>}
      <ModalActions onClose={onClose} onSubmit={submit} pending={pending} />
    </Modal>
  );
}

// ── Onglet Rubriques ─────────────────────────────────────────────────
function RubriquesTab({ categories, classNames }: { categories: FeeCategory[]; classNames: string[] }) {
  const [addOpen, setAddOpen] = useState(false);
  return (
    <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center" }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)", flex: 1 }}>Rubriques des frais ({categories.length})</div>
        <button onClick={() => setAddOpen(true)} className="ek-btn ek-btn-primary" style={{ height: 34, fontSize: 12.5 }}><Icon name="plus" size={13} /> Ajouter</button>
      </div>
      {categories.length === 0 ? (
        <div style={{ padding: 30, textAlign: "center", color: "var(--ink-3)", fontSize: 12.5 }}>Aucune rubrique. Ajoutez-en une (ex. Frais de scolarité).</div>
      ) : (
        categories.map((cat, i) => <RubriqueRow key={cat.id} cat={cat} classNames={classNames} first={i === 0} />)
      )}
      {addOpen && <RubriqueModal onClose={() => setAddOpen(false)} />}
    </div>
  );
}

function RubriqueRow({ cat, classNames, first }: { cat: FeeCategory; classNames: string[]; first: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [edit, setEdit] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderTop: first ? "none" : "1px solid var(--divider)" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{cat.name}</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>Montant par défaut : {money(cat.amount, cat.currency)}</div>
        </div>
        <button onClick={() => setApplyOpen(true)} className="ek-btn ek-btn-outline" style={{ height: 30, fontSize: 11.5 }}>Appliquer aux élèves</button>
        <button onClick={() => setEdit(true)} title="Modifier" style={iconBtn}><Icon name="edit" size={14} /></button>
        <button onClick={() => { if (confirm(`Supprimer la rubrique « ${cat.name} » ?`)) start(async () => { await deleteFeeCategory(cat.id); router.refresh(); }); }} disabled={pending} title="Supprimer" style={iconBtn}><Icon name="trash" size={14} /></button>
      </div>
      {edit && <RubriqueModal existing={cat} onClose={() => setEdit(false)} />}
      {applyOpen && <ApplyModal cat={cat} classNames={classNames} onClose={() => setApplyOpen(false)} />}
    </>
  );
}

// ── Onglet Vue d'ensemble ────────────────────────────────────────────
function OverviewTab({ overview }: { overview: FinanceOverview }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 16, alignItems: "start" }} className="ek-fin-grid">
      <div className="ek-card" style={{ padding: 18 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>{"Synthèse de l'année"}</div>
        <p style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.6 }}>
          {overview.total} élève(s) suivis. Total à encaisser : <strong>{money(overview.kpis.totalDue, overview.currency)}</strong>.
          Encaissé : <strong>{money(overview.kpis.totalPaid, overview.currency)}</strong>.
          Reste attendu : <strong>{money(overview.kpis.pending, overview.currency)}</strong> dont <strong>{money(overview.kpis.late, overview.currency)}</strong> en retard.
        </p>
      </div>
      <RightPanel overview={overview} selected={null} />
      <style>{`@media (max-width: 980px){ .ek-fin-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

// ── Onglet Insolvabilité (par classe) ────────────────────────────────
function InsolvabiliteTab({ overview }: { overview: FinanceOverview }) {
  const c = overview.currency;
  const [classF, setClassF] = useState("");
  const all = overview.students.filter((s) => s.financeStatus === "insolvable");
  const classNames = [...new Set(all.map((s) => s.className))].sort((a, b) => a.localeCompare(b, "fr", { numeric: true }));
  const rows = classF ? all.filter((s) => s.className === classF) : all;

  // Regroupement par classe.
  const byClass = new Map<string, FinanceStudentRow[]>();
  for (const s of rows) { if (!byClass.has(s.className)) byClass.set(s.className, []); byClass.get(s.className)!.push(s); }
  const groups = [...byClass.entries()].sort((a, b) => a[0].localeCompare(b[0], "fr", { numeric: true }));
  const grandTotal = rows.reduce((a, s) => a + s.remaining, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Select label="Classe" value={classF} onChange={setClassF}
          options={[{ v: "", l: "Toutes" }, ...classNames.map((n) => ({ v: n, l: n }))]} />
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={() => exportInsolvablesPdf(rows, c)} disabled={rows.length === 0} className="ek-btn ek-btn-outline" style={{ height: 38, fontSize: 12.5, opacity: rows.length === 0 ? 0.5 : 1 }}><Icon name="file" size={14} /> PDF</button>
          <button onClick={() => exportInsolvablesCsv(rows, c)} disabled={rows.length === 0} className="ek-btn ek-btn-outline" style={{ height: 38, fontSize: 12.5, opacity: rows.length === 0 ? 0.5 : 1 }}><Icon name="download" size={14} /> Excel</button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="ek-card" style={{ padding: 30, textAlign: "center", color: "var(--ink-3)", fontSize: 12.5 }}>Aucun élève marqué en insolvabilité.</div>
      ) : groups.map(([className, list]) => {
        const total = list.reduce((a, s) => a + s.remaining, 0);
        return (
          <div key={className} className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", fontSize: 13, fontWeight: 700 }}>
              <span style={{ flex: 1 }}>{className} ({list.length})</span>
              <span style={{ color: "#E11D48" }}>{money(total, c)}</span>
            </div>
            {list.map((s, i) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderTop: i > 0 ? "1px solid var(--divider)" : "none", fontSize: 12.5 }}>
                <Avatar name={s.fullName} url={s.avatarUrl} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 600 }}>{s.fullName}</span>
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{s.parentName}{s.parentPhone ? ` · ${s.parentPhone}` : ""}</div>
                </div>
                <span style={{ color: "#E11D48", fontWeight: 700 }}>{money(s.remaining, c)}</span>
                <InsolvableToggle studentId={s.id} />
              </div>
            ))}
          </div>
        );
      })}

      {rows.length > 0 && (
        <div className="ek-card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", fontSize: 13, fontWeight: 800 }}>
          <span style={{ flex: 1 }}>Total insolvabilité ({rows.length} élève(s))</span>
          <span style={{ color: "#E11D48" }}>{money(grandTotal, c)}</span>
        </div>
      )}
    </div>
  );
}

function InsolvableToggle({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button onClick={() => start(async () => { await setStudentFinanceStatus(studentId, "en_ordre"); router.refresh(); })} disabled={pending} className="ek-btn ek-btn-outline" style={{ height: 28, fontSize: 11.5 }}>
      {"Retirer l'insolvabilité"}
    </button>
  );
}

// ── Onglet Rapports (export global + par classe + calculatrice) ──────
function RapportsTab({ overview }: { overview: FinanceOverview }) {
  const c = overview.currency;
  const [classF, setClassF] = useState("");
  const classNames = [...new Set(overview.students.map((s) => s.className))].sort((a, b) => a.localeCompare(b, "fr", { numeric: true }));
  const rows = classF ? overview.students.filter((s) => s.className === classF) : overview.students;
  const scopeLabel = classF || "Toutes les classes";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: 16 }}>
      <div className="ek-card" style={{ padding: 18 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 6 }}>Rapport de frais par classe</div>
        <p style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 12 }}>Choisissez une classe (ou toutes) puis exportez la situation financière, groupée par classe avec sous-totaux.</p>
        <div style={{ marginBottom: 12 }}>
          <Select label="Classe" value={classF} onChange={setClassF}
            options={[{ v: "", l: "Toutes les classes" }, ...classNames.map((n) => ({ v: n, l: n }))]} />
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => exportByClassCsv(rows, c, scopeLabel)} disabled={rows.length === 0} className="ek-btn ek-btn-outline" style={{ height: 38, fontSize: 12.5, opacity: rows.length === 0 ? 0.5 : 1 }}><Icon name="download" size={14} /> Excel (CSV)</button>
          <button onClick={() => exportByClassPdf(rows, c, scopeLabel)} disabled={rows.length === 0} className="ek-btn ek-btn-outline" style={{ height: 38, fontSize: 12.5, opacity: rows.length === 0 ? 0.5 : 1 }}><Icon name="file" size={14} /> PDF</button>
        </div>
        <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 10 }}>{rows.length} élève(s) · {scopeLabel}</div>
      </div>
      <Calculator currency={c} />
    </div>
  );
}

function Calculator({ currency }: { currency: string }) {
  const [due, setDue] = useState("");
  const [paid, setPaid] = useState("");
  const num = (s: string) => parseFloat(s.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
  const remaining = Math.max(0, num(due) - num(paid));
  return (
    <div className="ek-card" style={{ padding: 18 }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 6 }}>Calculatrice — reste à payer</div>
      <p style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 12 }}>Total dû − Payé = Reste à payer.</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <label style={{ flex: 1, minWidth: 120 }}>
          <div style={calcLbl}>Total dû</div>
          <input value={due} onChange={(e) => setDue(e.target.value)} inputMode="decimal" placeholder="250000" style={calcInp} />
        </label>
        <label style={{ flex: 1, minWidth: 120 }}>
          <div style={calcLbl}>Payé</div>
          <input value={paid} onChange={(e) => setPaid(e.target.value)} inputMode="decimal" placeholder="150000" style={calcInp} />
        </label>
      </div>
      <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 10, background: "var(--brand-soft)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12.5, color: "var(--ink-2)", fontWeight: 600 }}>Reste à payer</span>
        <span style={{ fontSize: 20, fontWeight: 800, color: remaining > 0 ? "#E11D48" : "#16A34A", fontFamily: "var(--font-display)" }}>{money(remaining, currency)}</span>
      </div>
    </div>
  );
}

// ── Modales ──────────────────────────────────────────────────────────
function RubriqueModal({ existing, onClose }: { existing?: FeeCategory; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState(existing?.name ?? "");
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [currency, setCurrency] = useState(existing?.currency ?? "CDF");
  const [error, setError] = useState<string | null>(null);
  const submit = () => {
    if (!name.trim()) { setError("Nom requis."); return; }
    const amt = parseFloat(amount.replace(",", ".")) || 0;
    start(async () => {
      const r = existing
        ? await updateFeeCategory({ id: existing.id, name, amount: amt, currency })
        : await createFeeCategory({ name, amount: amt, currency });
      if (r.ok) { onClose(); router.refresh(); } else setError(r.message);
    });
  };
  return (
    <Modal title={existing ? "Modifier la rubrique" : "Nouvelle rubrique de frais"} onClose={onClose}>
      <Labeled label="Nom de la rubrique"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Frais de scolarité" style={modalInp} /></Labeled>
      <div style={{ display: "flex", gap: 10 }}>
        <Labeled label="Montant par défaut" style={{ flex: 1 }}><input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))} inputMode="decimal" placeholder="75000" style={modalInp} /></Labeled>
        <Labeled label="Devise" style={{ width: 110 }}>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={modalInp}>
            <option value="CDF">FC</option><option value="USD">USD</option>
          </select>
        </Labeled>
      </div>
      {error && <div style={errBox}>{error}</div>}
      <ModalActions onClose={onClose} onSubmit={submit} pending={pending} />
    </Modal>
  );
}

function ApplyModal({ cat, classNames, onClose }: { cat: FeeCategory; classNames: string[]; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [scope, setScope] = useState<"all" | "class">("all");
  const [className, setClassName] = useState(classNames[0] ?? "");
  const [error, setError] = useState<string | null>(null);
  const submit = () => start(async () => {
    const r = await applyCategoryToStudents({ categoryId: cat.id, scope, className: scope === "class" ? className : undefined });
    if (r.ok) { onClose(); router.refresh(); } else setError(r.message);
  });
  return (
    <Modal title={`Appliquer « ${cat.name} »`} onClose={onClose}>
      <p style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}>Ajoute {money(cat.amount, cat.currency)} au dossier des élèves choisis (les doublons sont ignorés).</p>
      <Labeled label="Cible">
        <select value={scope} onChange={(e) => setScope(e.target.value as any)} style={modalInp}>
          <option value="all">{"Toute l'école"}</option>
          <option value="class">Une classe</option>
        </select>
      </Labeled>
      {scope === "class" && (
        <Labeled label="Classe">
          <select value={className} onChange={(e) => setClassName(e.target.value)} style={modalInp}>
            {classNames.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Labeled>
      )}
      {error && <div style={errBox}>{error}</div>}
      <ModalActions onClose={onClose} onSubmit={submit} pending={pending} submitLabel="Appliquer" />
    </Modal>
  );
}

function FeeModal({ studentId, onClose, onDone }: { studentId: string; onClose: () => void; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("CDF");
  const [error, setError] = useState<string | null>(null);
  const submit = () => {
    if (!label.trim()) { setError("Libellé requis."); return; }
    const amt = parseFloat(amount.replace(",", ".")) || 0;
    start(async () => {
      const r = await upsertStudentFee({ studentId, label, amountDue: amt, currency });
      if (r.ok) onDone(); else setError(r.message);
    });
  };
  return (
    <Modal title="Ajouter un frais" onClose={onClose}>
      <Labeled label="Rubrique / libellé"><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Frais de scolarité" style={modalInp} /></Labeled>
      <div style={{ display: "flex", gap: 10 }}>
        <Labeled label="Total dû" style={{ flex: 1 }}><input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))} inputMode="decimal" placeholder="75000" style={modalInp} /></Labeled>
        <Labeled label="Devise" style={{ width: 110 }}>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={modalInp}><option value="CDF">FC</option><option value="USD">USD</option></select>
        </Labeled>
      </div>
      {error && <div style={errBox}>{error}</div>}
      <ModalActions onClose={onClose} onSubmit={submit} pending={pending} />
    </Modal>
  );
}

function PaymentModal({ studentId, onClose, onDone }: { studentId: string; onClose: () => void; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("CDF");
  const [label, setLabel] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const submit = () => {
    const amt = parseFloat(amount.replace(",", ".")) || 0;
    if (!(amt > 0)) { setError("Montant invalide."); return; }
    start(async () => {
      const r = await recordStudentPayment({ studentId, amount: amt, currency, label, paidAt });
      if (r.ok) onDone(); else setError(r.message);
    });
  };
  return (
    <Modal title="Enregistrer un paiement" onClose={onClose}>
      <div style={{ display: "flex", gap: 10 }}>
        <Labeled label="Montant" style={{ flex: 1 }}><input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))} inputMode="decimal" placeholder="50000" style={modalInp} /></Labeled>
        <Labeled label="Devise" style={{ width: 110 }}>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={modalInp}><option value="CDF">FC</option><option value="USD">USD</option></select>
        </Labeled>
      </div>
      <Labeled label="Libellé (optionnel)"><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="1ère tranche…" style={modalInp} /></Labeled>
      <Labeled label="Date"><input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} style={modalInp} /></Labeled>
      {error && <div style={errBox}>{error}</div>}
      <ModalActions onClose={onClose} onSubmit={submit} pending={pending} submitLabel="Enregistrer" />
    </Modal>
  );
}

// ── Facture (point 5) ────────────────────────────────────────────────
const INVOICE_TYPES: { v: InvoiceType; l: string }[] = [
  { v: "acompte", l: "Acompte / avance" },
  { v: "tranche", l: "Tranche (frais de scolarité)" },
  { v: "autre", l: "Autre frais" },
];

function InvoiceModal({ students, categories, school, onClose }: { students: FinanceStudentRow[]; categories: FeeCategory[]; school: SchoolBranding; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [q, setQ] = useState("");
  const [studentId, setStudentId] = useState("");
  const [type, setType] = useState<InvoiceType>("acompte");
  const [label, setLabel] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [trancheLabel, setTrancheLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("CDF");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  const student = students.find((s) => s.id === studentId) ?? null;
  const matches = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return students.filter((s) => s.fullName.toLowerCase().includes(query) || s.matricule.toLowerCase().includes(query) || s.className.toLowerCase().includes(query)).slice(0, 8);
  }, [students, q]);

  // Préremplit le montant depuis la rubrique correspondant au type.
  const prefillFor = (t: InvoiceType) => {
    const cat = t === "acompte"
      ? categories.find((c) => (c as any).kind === "acompte") ?? categories.find((c) => c.name.toLowerCase().includes("acompte"))
      : t === "tranche"
        ? categories.find((c) => (c as any).kind === "scolarite") ?? categories.find((c) => c.name.toLowerCase().includes("scolar"))
        : null;
    if (cat) { setAmount(String(cat.amount)); setCurrency(cat.currency); }
  };

  const submit = () => {
    if (!studentId) { setError("Sélectionnez un élève."); return; }
    if (type === "autre" && !categoryName.trim()) { setError("Nom de la rubrique requis."); return; }
    const amt = parseFloat(amount.replace(",", ".")) || 0;
    if (!(amt > 0)) { setError("Montant invalide."); return; }
    start(async () => {
      const r = await createInvoice({ studentId, type, label, categoryName, trancheLabel, amount: amt, currency, date });
      if (!r.ok) { setError(r.message); return; }
      if (student) buildInvoiceHtml(student, { type, label, categoryName, trancheLabel, amount: amt, currency, date }, school);
      onClose();
      router.refresh();
    });
  };

  return (
    <Modal title="Créer une facture" onClose={onClose}>
      <Labeled label="Élève">
        {student ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 11px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)" }}>
            <Avatar name={student.fullName} url={student.avatarUrl} size={26} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontWeight: 600, fontSize: 12.5 }}>{student.fullName}</span><SexBadge sex={student.sex} size={13} /></div>
              <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{student.className} · {student.matricule}</div>
            </div>
            <button onClick={() => { setStudentId(""); setQ(""); }} style={iconBtn} title="Changer"><Icon name="close" size={14} /></button>
          </div>
        ) : (
          <div style={{ position: "relative" }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un élève (nom, code, classe)…" style={modalInp} />
            {matches.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 5, marginTop: 4, background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 9, overflow: "hidden", maxHeight: 220, overflowY: "auto" }}>
                {matches.map((s) => (
                  <button key={s.id} onClick={() => { setStudentId(s.id); setQ(""); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "8px 10px", border: "none", background: "none", cursor: "pointer", fontSize: 12.5 }}>
                    <Avatar name={s.fullName} url={s.avatarUrl} size={24} />
                    <span style={{ flex: 1, minWidth: 0 }}><span style={{ fontWeight: 600 }}>{s.fullName}</span> <span style={{ color: "var(--ink-3)" }}>· {s.className}</span></span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Labeled>

      <Labeled label="Type de frais">
        <select value={type} onChange={(e) => { const t = e.target.value as InvoiceType; setType(t); prefillFor(t); }} style={modalInp}>
          {INVOICE_TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
        </select>
      </Labeled>

      {type === "autre" && (
        <Labeled label="Nom de la rubrique"><input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Frais de transport…" style={modalInp} /></Labeled>
      )}
      {type === "tranche" && (
        <Labeled label="Tranche (n° / libellé)"><input value={trancheLabel} onChange={(e) => setTrancheLabel(e.target.value)} placeholder="Tranche 1" style={modalInp} /></Labeled>
      )}

      <Labeled label="Libellé"><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Objet de la facture" style={modalInp} /></Labeled>
      <div style={{ display: "flex", gap: 10 }}>
        <Labeled label="Montant payé" style={{ flex: 1 }}><input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))} inputMode="decimal" placeholder="50000" style={modalInp} /></Labeled>
        <Labeled label="Devise" style={{ width: 100 }}><select value={currency} onChange={(e) => setCurrency(e.target.value)} style={modalInp}><option value="CDF">FC</option><option value="USD">USD</option></select></Labeled>
      </div>
      <Labeled label="Date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={modalInp} /></Labeled>
      {error && <div style={errBox}>{error}</div>}
      <ModalActions onClose={onClose} onSubmit={submit} pending={pending} submitLabel="Enregistrer & imprimer" />
    </Modal>
  );
}

// Construit une facture imprimable (fenêtre d'impression → PDF).
function buildInvoiceHtml(
  s: FinanceStudentRow,
  inv: { type: InvoiceType; label: string; categoryName: string; trancheLabel: string; amount: number; currency: string; date: string },
  school: SchoolBranding
) {
  const rubrique = inv.type === "acompte" ? "Acompte / avance" : inv.type === "tranche" ? `Tranche${inv.trancheLabel ? ` — ${inv.trancheLabel}` : ""}` : (inv.categoryName || "Autre frais");
  const sexe = s.sex === "M" ? "Masculin" : s.sex === "F" ? "Féminin" : "—";
  const dateFr = inv.date ? new Date(inv.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—";
  const sub = [school.commune, school.city].filter(Boolean).join(", ");
  const num = Math.random().toString(36).slice(2, 8).toUpperCase();
  const logo = school.logoUrl ? `<img src="${escHtml(school.logoUrl)}" style="height:54px;object-fit:contain" />` : "";
  const sign = school.signatureUrl ? `<img src="${escHtml(school.signatureUrl)}" style="height:46px;object-fit:contain;display:block" />` : "";
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Facture ${num}</title><style>*{font-family:Arial,sans-serif;box-sizing:border-box}body{margin:32px;color:#1a1410}.head{display:flex;align-items:center;gap:16px;border-bottom:2px solid #1D6650;padding-bottom:14px;margin-bottom:18px}.head .n{font-size:20px;font-weight:800}.head .s{font-size:12px;color:#6b5f52}.title{margin-left:auto;text-align:right}.title .t{font-size:22px;font-weight:800;color:#1D6650;letter-spacing:.05em}.title .d{font-size:12px;color:#6b5f52}.stu{display:flex;justify-content:space-between;gap:16px;background:#F4EFE3;border-radius:10px;padding:14px 16px;margin-bottom:18px}.lbl{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#8a7c6e;font-weight:600}.val{font-size:14px;font-weight:700}table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px}th{background:#1D6650;color:#fff;text-align:left;padding:9px 10px;font-size:11px;text-transform:uppercase}td{padding:9px 10px;border-bottom:1px solid #ECE3D2}.r{text-align:right}.amount{font-size:20px;font-weight:800;color:#1D6650}.sig{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:36px;padding-top:16px;border-top:1px solid #ECE3D2}.foot{margin-top:26px;font-size:10px;color:#b5a99a;text-align:center}</style></head><body>
<div class="head">${logo}<div><div class="n">${escHtml(school.name)}</div><div class="s">${escHtml(sub)}</div></div><div class="title"><div class="t">FACTURE</div><div class="d">N° ${num} · ${escHtml(dateFr)}</div></div></div>
<div class="stu"><div><div class="lbl">Élève</div><div class="val">${escHtml(s.fullName)}</div><div class="s" style="font-size:12px;color:#6b5f52">Sexe : ${sexe} · Classe : ${escHtml(s.className)}</div></div><div style="text-align:right"><div class="lbl">Montant payé</div><div class="amount">${money(inv.amount, inv.currency)}</div></div></div>
<table><thead><tr><th>Libellé</th><th>Rubrique</th><th class="r">Montant</th><th class="r">Date</th></tr></thead><tbody><tr><td>${escHtml(inv.label || rubrique)}</td><td>${escHtml(rubrique)}</td><td class="r">${money(inv.amount, inv.currency)}</td><td class="r">${escHtml(dateFr)}</td></tr></tbody></table>
<div class="sig"><div><div class="lbl">Cachet &amp; signature</div>${sign}<div style="border-bottom:1px solid #1a1410;padding-bottom:4px;font-size:11.5px;font-weight:600;margin-top:4px">${escHtml(school.directorName || "La direction")}</div></div><div style="text-align:right"><div class="lbl">Reçu par le parent</div><div style="height:46px"></div><div style="border-bottom:1px solid #1a1410"></div></div></div>
<div class="foot">Facture générée via E-KELASI · ${escHtml(new Date().toLocaleDateString("fr-FR"))}</div>
<script>window.onload=function(){window.print()}</script></body></html>`;
  openPrint(html);
}

// ── Onglet Caisse : dépenses & recettes (point 7) ────────────────────
function CaisseTab({ entries, summary, school }: { entries: CashEntry[]; summary: CashSummary; school: SchoolBranding }) {
  const router = useRouter();
  const [form, setForm] = useState<null | "depense" | "recette">(null);
  const c = summary.currency;
  const depenses = entries.filter((e) => e.kind === "depense");
  const recettes = entries.filter((e) => e.kind === "recette");

  const Section = ({ title, rows, tint, kind }: { title: string; rows: CashEntry[]; tint: string; kind: "depense" | "recette" }) => (
    <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: tint, flex: 1 }}>{title} ({rows.length})</span>
        <button onClick={() => setForm(kind)} className="ek-btn ek-btn-outline" style={{ height: 30, fontSize: 11.5 }}><Icon name="plus" size={12} /> Ajouter</button>
      </div>
      {rows.length === 0 ? <div style={{ padding: 18, textAlign: "center", color: "var(--ink-3)", fontSize: 12 }}>—</div> : rows.map((e, i) => (
        <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", borderTop: i > 0 ? "1px solid var(--divider)" : "none", fontSize: 12.5 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 600 }}>{e.label}</span>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{new Date(e.entryDate).toLocaleDateString("fr-FR")}{e.signatory ? ` · ${e.signatory}` : ""}</div>
          </div>
          <span style={{ fontWeight: 700, color: tint }}>{money(e.amount, e.currency)}</span>
          <CashDelete id={e.id} />
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
        <Kpi icon="download" tint="#16A34A" label="Total recettes" value={money(summary.recettes, c)} sub="Entrées de caisse" />
        <Kpi icon="upload" tint="#E11D48" label="Total dépenses" value={money(summary.depenses, c)} sub="Sorties de caisse" />
        <Kpi icon="dollar" tint={summary.solde >= 0 ? "#16A34A" : "#E11D48"} label="Solde" value={money(summary.solde, c)} sub="Recettes − Dépenses" />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button onClick={() => exportCashPdf(entries, summary, school)} disabled={entries.length === 0} className="ek-btn ek-btn-outline" style={{ height: 38, fontSize: 12.5, opacity: entries.length === 0 ? 0.5 : 1 }}><Icon name="file" size={14} /> Rapport PDF</button>
        <button onClick={() => exportCashCsv(entries, summary)} disabled={entries.length === 0} className="ek-btn ek-btn-outline" style={{ height: 38, fontSize: 12.5, opacity: entries.length === 0 ? 0.5 : 1 }}><Icon name="download" size={14} /> Excel (CSV)</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="ek-fin-grid">
        <Section title="Recettes" rows={recettes} tint="#16A34A" kind="recette" />
        <Section title="Dépenses" rows={depenses} tint="#E11D48" kind="depense" />
      </div>

      {form && <CashEntryModal kind={form} defaultSignatory={school.directorName ?? ""} onClose={() => setForm(null)} onDone={() => { setForm(null); router.refresh(); }} />}
      <style>{`@media (max-width: 760px){ .ek-fin-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

function CashDelete({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button onClick={() => { if (confirm("Supprimer cette écriture ?")) start(async () => { await deleteCashEntry(id); router.refresh(); }); }} disabled={pending} title="Supprimer" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", padding: 4, display: "flex" }}>
      <Icon name="trash" size={13} />
    </button>
  );
}

function CashEntryModal({ kind, defaultSignatory, onClose, onDone }: { kind: "depense" | "recette"; defaultSignatory: string; onClose: () => void; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("CDF");
  const [labelTxt, setLabelTxt] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [signatory, setSignatory] = useState(defaultSignatory);
  const [error, setError] = useState<string | null>(null);
  const submit = () => {
    const amt = parseFloat(amount.replace(",", ".")) || 0;
    if (!(amt > 0)) { setError("Montant invalide."); return; }
    if (!labelTxt.trim()) { setError("Libellé requis."); return; }
    start(async () => { const r = await addCashEntry({ kind, amount: amt, currency, label: labelTxt, entryDate, signatory }); if (r.ok) onDone(); else setError(r.message); });
  };
  return (
    <Modal title={kind === "recette" ? "Nouvelle recette" : "Nouvelle dépense"} onClose={onClose}>
      <Labeled label="Libellé"><input value={labelTxt} onChange={(e) => setLabelTxt(e.target.value)} placeholder={kind === "recette" ? "Encaissement scolarité…" : "Achat fournitures…"} style={modalInp} /></Labeled>
      <div style={{ display: "flex", gap: 10 }}>
        <Labeled label="Montant" style={{ flex: 1 }}><input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))} inputMode="decimal" placeholder="50000" style={modalInp} /></Labeled>
        <Labeled label="Devise" style={{ width: 100 }}><select value={currency} onChange={(e) => setCurrency(e.target.value)} style={modalInp}><option value="CDF">FC</option><option value="USD">USD</option></select></Labeled>
      </div>
      <Labeled label="Date"><input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} style={modalInp} /></Labeled>
      <Labeled label="Signataire"><input value={signatory} onChange={(e) => setSignatory(e.target.value)} placeholder="La direction" style={modalInp} /></Labeled>
      {error && <div style={errBox}>{error}</div>}
      <ModalActions onClose={onClose} onSubmit={submit} pending={pending} />
    </Modal>
  );
}

function exportCashCsv(entries: CashEntry[], summary: CashSummary) {
  const lines: (string | number)[][] = [["Journal de caisse"], [], ["Type", "Date", "Libellé", "Signataire", "Montant"]];
  for (const e of entries) lines.push([e.kind === "recette" ? "Recette" : "Dépense", e.entryDate, e.label, e.signatory ?? "", Math.round(e.amount)]);
  lines.push([]);
  lines.push(["Total recettes", "", "", "", Math.round(summary.recettes)]);
  lines.push(["Total dépenses", "", "", "", Math.round(summary.depenses)]);
  lines.push(["Solde", "", "", "", Math.round(summary.solde)]);
  downloadCsv(lines, "journal-de-caisse.csv");
}

function exportCashPdf(entries: CashEntry[], summary: CashSummary, school: SchoolBranding) {
  const c = summary.currency;
  const body = entries.map((e) => `<tr><td>${e.kind === "recette" ? "Recette" : "Dépense"}</td><td>${escHtml(new Date(e.entryDate).toLocaleDateString("fr-FR"))}</td><td>${escHtml(e.label)}</td><td>${escHtml(e.signatory ?? "")}</td><td class="r" style="color:${e.kind === "recette" ? "#16A34A" : "#E11D48"}">${money(e.amount, e.currency)}</td></tr>`).join("");
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Journal de caisse</title><style>*{font-family:Arial,sans-serif}body{margin:28px;color:#1a1a2e}h1{font-size:18px;margin:0 0 4px}.sub{color:#666;font-size:12px;margin-bottom:12px}table{width:100%;border-collapse:collapse;font-size:11px}th{background:#1D6650;color:#fff;text-align:left;padding:7px 8px;font-size:10px;text-transform:uppercase}td{padding:6px 8px;border-bottom:1px solid #e5e7eb}.r{text-align:right}.tot{margin-top:14px;font-size:13px}.tot div{display:flex;justify-content:space-between;padding:3px 0;max-width:320px;margin-left:auto}.tot .solde{font-weight:800;border-top:2px solid #1D6650;padding-top:6px}</style></head><body><h1>Journal de caisse</h1><div class="sub">${escHtml(school.name)} · ${escHtml(new Date().toLocaleDateString("fr-FR"))}</div><table><thead><tr><th>Type</th><th>Date</th><th>Libellé</th><th>Signataire</th><th class="r">Montant</th></tr></thead><tbody>${body}</tbody></table><div class="tot"><div><span>Total recettes</span><span style="color:#16A34A">${money(summary.recettes, c)}</span></div><div><span>Total dépenses</span><span style="color:#E11D48">${money(summary.depenses, c)}</span></div><div class="solde"><span>Solde</span><span>${money(summary.solde, c)}</span></div></div><script>window.onload=function(){window.print()}</script></body></html>`;
  openPrint(html);
}

// ── Helpers UI ───────────────────────────────────────────────────────
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 9.5, color: "var(--ink-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...selStyle, height: 38 }}>
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,16,10,0.45)", display: "grid", placeItems: "center", zIndex: 200, padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} className="ek-card" style={{ width: "100%", maxWidth: 440, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)" }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function Labeled({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5, ...style }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>{label}</span>
      {children}
    </label>
  );
}

function ModalActions({ onClose, onSubmit, pending, submitLabel = "Enregistrer" }: { onClose: () => void; onSubmit: () => void; pending: boolean; submitLabel?: string }) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
      <button onClick={onClose} className="ek-btn ek-btn-outline" style={{ flex: 1 }}>Annuler</button>
      <button onClick={onSubmit} disabled={pending} className="ek-btn ek-btn-primary" style={{ flex: 1, opacity: pending ? 0.6 : 1 }}>{pending ? "…" : submitLabel}</button>
    </div>
  );
}

// ── Exports ──────────────────────────────────────────────────────────
function exportStudentsCsv(rows: FinanceStudentRow[], c: string) {
  const header = ["Code", "Élève", "Sexe", "Classe", "Parent", "Total dû", "Payé", "Reste à payer", "Statut paiement", "Statut"];
  const lines = [header, ...rows.map((s) => [s.matricule, s.fullName, s.sex ?? "", s.className, s.parentName, Math.round(s.totalDue), Math.round(s.paid), Math.round(s.remaining), PAY[s.paymentStatus].label, STA[s.financeStatus].label])];
  const csv = lines.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "finance-eleves.csv"; a.click();
  URL.revokeObjectURL(url);
}

function exportStudentsPdf(rows: FinanceStudentRow[], c: string) {
  const esc = (s: string) => String(s).replace(/[&<>"]/g, (x) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[x]!));
  const body = rows.map((s) => `<tr><td>${esc(s.matricule)}</td><td>${esc(s.fullName)}</td><td>${esc(s.className)}</td><td class="r">${money(s.totalDue, c)}</td><td class="r" style="color:#16A34A">${money(s.paid, c)}</td><td class="r" style="color:#E11D48">${money(s.remaining, c)}</td><td>${PAY[s.paymentStatus].label}</td><td>${STA[s.financeStatus].label}</td></tr>`).join("");
  const totalDue = rows.reduce((a, s) => a + s.totalDue, 0), totalPaid = rows.reduce((a, s) => a + s.paid, 0);
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Finance — élèves</title><style>*{font-family:Arial,sans-serif}body{margin:28px;color:#1a1a2e}h1{font-size:18px;margin:0 0 12px}table{width:100%;border-collapse:collapse;font-size:11px}th{background:#1f3a8a;color:#fff;text-align:left;padding:7px 8px;font-size:10px;text-transform:uppercase}td{padding:6px 8px;border-bottom:1px solid #e5e7eb}.r{text-align:right}tfoot td{font-weight:700;border-top:2px solid #1f3a8a}</style></head><body><h1>Situation financière des élèves (${rows.length})</h1><table><thead><tr><th>Code</th><th>Élève</th><th>Classe</th><th>Total dû</th><th>Payé</th><th>Reste</th><th>Paiement</th><th>Statut</th></tr></thead><tbody>${body}</tbody><tfoot><tr><td colspan="3">Total</td><td class="r">${money(totalDue, c)}</td><td class="r">${money(totalPaid, c)}</td><td class="r">${money(Math.max(0, totalDue - totalPaid), c)}</td><td colspan="2"></td></tr></tfoot></table><script>window.onload=function(){window.print()}</script></body></html>`;
  const w = window.open("", "_blank");
  if (!w) { alert("Autorisez les fenêtres pop-up pour générer le PDF."); return; }
  w.document.write(html); w.document.close();
}

const escHtml = (s: string) => String(s).replace(/[&<>"]/g, (x) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[x]!));
function groupByClass(rows: FinanceStudentRow[]): [string, FinanceStudentRow[]][] {
  const m = new Map<string, FinanceStudentRow[]>();
  for (const s of rows) { if (!m.has(s.className)) m.set(s.className, []); m.get(s.className)!.push(s); }
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], "fr", { numeric: true }));
}
function downloadCsv(lines: (string | number)[][], name: string) {
  const csv = lines.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}
function openPrint(html: string) {
  const w = window.open("", "_blank");
  if (!w) { alert("Autorisez les fenêtres pop-up pour générer le PDF."); return; }
  w.document.write(html); w.document.close();
}

// Rapport de frais groupé par classe (CSV) avec sous-totaux.
function exportByClassCsv(rows: FinanceStudentRow[], c: string, scope: string) {
  const lines: (string | number)[][] = [["Rapport de frais", scope], [], ["Classe", "Code", "Élève", "Sexe", "Parent", "Total dû", "Payé", "Reste", "Statut paiement", "Statut"]];
  let gDue = 0, gPaid = 0, gRem = 0;
  for (const [cls, list] of groupByClass(rows)) {
    let due = 0, paid = 0, rem = 0;
    for (const s of list) { lines.push([cls, s.matricule, s.fullName, s.sex ?? "", s.parentName, Math.round(s.totalDue), Math.round(s.paid), Math.round(s.remaining), PAY[s.paymentStatus].label, STA[s.financeStatus].label]); due += s.totalDue; paid += s.paid; rem += s.remaining; }
    lines.push([`Sous-total ${cls}`, "", "", "", "", Math.round(due), Math.round(paid), Math.round(rem), "", ""]);
    lines.push([]);
    gDue += due; gPaid += paid; gRem += rem;
  }
  lines.push(["TOTAL GÉNÉRAL", "", "", "", "", Math.round(gDue), Math.round(gPaid), Math.round(gRem), "", ""]);
  downloadCsv(lines, "rapport-frais-par-classe.csv");
}

function exportByClassPdf(rows: FinanceStudentRow[], c: string, scope: string) {
  let gDue = 0, gPaid = 0, gRem = 0;
  const blocks = groupByClass(rows).map(([cls, list]) => {
    let due = 0, paid = 0, rem = 0;
    const body = list.map((s) => { due += s.totalDue; paid += s.paid; rem += s.remaining; return `<tr><td>${escHtml(s.matricule)}</td><td>${escHtml(s.fullName)}</td><td>${escHtml(s.parentName)}</td><td class="r">${money(s.totalDue, c)}</td><td class="r" style="color:#16A34A">${money(s.paid, c)}</td><td class="r" style="color:#E11D48">${money(s.remaining, c)}</td><td>${STA[s.financeStatus].label}</td></tr>`; }).join("");
    gDue += due; gPaid += paid; gRem += rem;
    return `<h2>${escHtml(cls)} (${list.length})</h2><table><thead><tr><th>Code</th><th>Élève</th><th>Parent</th><th>Total dû</th><th>Payé</th><th>Reste</th><th>Statut</th></tr></thead><tbody>${body}</tbody><tfoot><tr><td colspan="3">Sous-total</td><td class="r">${money(due, c)}</td><td class="r">${money(paid, c)}</td><td class="r">${money(rem, c)}</td><td></td></tr></tfoot></table>`;
  }).join("");
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Rapport de frais par classe</title><style>*{font-family:Arial,sans-serif}body{margin:28px;color:#1a1a2e}h1{font-size:18px;margin:0 0 4px}h2{font-size:14px;margin:18px 0 6px;color:#1f3a8a}.sub{color:#666;font-size:12px;margin-bottom:8px}table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:6px}th{background:#1f3a8a;color:#fff;text-align:left;padding:6px 8px;font-size:10px;text-transform:uppercase}td{padding:5px 8px;border-bottom:1px solid #e5e7eb}.r{text-align:right}tfoot td{font-weight:700;border-top:2px solid #1f3a8a}</style></head><body><h1>Rapport de frais par classe</h1><div class="sub">${escHtml(scope)} · ${rows.length} élève(s)</div>${blocks}<h2>Total général</h2><table><tfoot><tr><td colspan="3">TOTAL</td><td class="r">${money(gDue, c)}</td><td class="r">${money(gPaid, c)}</td><td class="r">${money(gRem, c)}</td><td></td></tr></tfoot></table><script>window.onload=function(){window.print()}</script></body></html>`;
  openPrint(html);
}

// Rapport d'insolvabilité (par classe).
function exportInsolvablesCsv(rows: FinanceStudentRow[], c: string) {
  const lines: (string | number)[][] = [["Classe", "Code", "Élève", "Parent", "Téléphone", "Reste à payer"]];
  let total = 0;
  for (const [cls, list] of groupByClass(rows)) for (const s of list) { lines.push([cls, s.matricule, s.fullName, s.parentName, s.parentPhone ?? "", Math.round(s.remaining)]); total += s.remaining; }
  lines.push(["TOTAL", "", "", "", "", Math.round(total)]);
  downloadCsv(lines, "insolvabilite-par-classe.csv");
}
function exportInsolvablesPdf(rows: FinanceStudentRow[], c: string) {
  let total = 0;
  const blocks = groupByClass(rows).map(([cls, list]) => {
    let sub = 0;
    const body = list.map((s) => { sub += s.remaining; return `<tr><td>${escHtml(s.matricule)}</td><td>${escHtml(s.fullName)}</td><td>${escHtml(s.parentName)}</td><td>${escHtml(s.parentPhone ?? "")}</td><td class="r" style="color:#E11D48">${money(s.remaining, c)}</td></tr>`; }).join("");
    total += sub;
    return `<h2>${escHtml(cls)} (${list.length})</h2><table><thead><tr><th>Code</th><th>Élève</th><th>Parent</th><th>Téléphone</th><th>Reste</th></tr></thead><tbody>${body}</tbody><tfoot><tr><td colspan="4">Sous-total</td><td class="r">${money(sub, c)}</td></tr></tfoot></table>`;
  }).join("");
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Insolvabilité par classe</title><style>*{font-family:Arial,sans-serif}body{margin:28px;color:#1a1a2e}h1{font-size:18px;margin:0 0 8px}h2{font-size:14px;margin:18px 0 6px;color:#92400E}table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:6px}th{background:#92400E;color:#fff;text-align:left;padding:6px 8px;font-size:10px;text-transform:uppercase}td{padding:5px 8px;border-bottom:1px solid #e5e7eb}.r{text-align:right}tfoot td{font-weight:700;border-top:2px solid #92400E}</style></head><body><h1>Élèves en insolvabilité (${rows.length})</h1>${blocks}<h2>Total général</h2><table><tfoot><tr><td>TOTAL</td><td class="r">${money(total, c)}</td></tr></tfoot></table><script>window.onload=function(){window.print()}</script></body></html>`;
  openPrint(html);
}

// ── Styles ───────────────────────────────────────────────────────────
const selStyle: React.CSSProperties = { padding: "0 10px", height: 40, borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)", fontSize: 13, color: "var(--ink)" };
const modalInp: React.CSSProperties = { width: "100%", padding: "9px 11px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)", fontSize: 13, color: "var(--ink)" };
const iconBtn: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", padding: 5, display: "flex" };
const errBox: React.CSSProperties = { padding: 9, borderRadius: 8, background: "rgba(192,58,43,0.10)", color: "var(--danger)", fontSize: 12, fontWeight: 600 };
const calcLbl: React.CSSProperties = { fontSize: 11, color: "var(--ink-3)", fontWeight: 600, marginBottom: 4 };
const calcInp: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)", fontSize: 15, color: "var(--ink)", fontWeight: 700 };
