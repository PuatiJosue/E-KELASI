"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/Avatar";
import { SexBadge } from "@/components/SexBadge";
import {
  createFeeCategory, updateFeeCategory, deleteFeeCategory, applyCategoryToStudents,
  upsertStudentFee, deleteStudentFee, setStudentFinanceStatus, recordStudentPayment, loadStudentFinance,
  addAdvance, deleteAdvance, addInstallment, toggleInstallmentPaid, deleteInstallment,
} from "./actions";
import type {
  FinanceOverview, FeeCategory, FinanceStudentRow, StudentFinanceDetail,
  StudentAdvance, StudentInstallment, PaymentStatus, FinanceStatus,
} from "@/lib/finance-db";

const cur = (c: string) => (c === "CDF" ? "FC" : c === "USD" ? "USD" : c);
const money = (n: number, c = "CDF") => `${Math.round(n).toLocaleString("fr-FR")} ${cur(c)}`;

const PAY: Record<PaymentStatus, { label: string; bg: string; fg: string }> = {
  paye:     { label: "Payé",     bg: "rgba(22,163,74,0.12)",  fg: "#16A34A" },
  partiel:  { label: "Partiel",  bg: "rgba(217,119,6,0.12)",  fg: "#B45309" },
  non_paye: { label: "Non payé", bg: "rgba(225,29,72,0.12)",  fg: "#E11D48" },
};
const STA: Record<FinanceStatus, { label: string; bg: string; fg: string }> = {
  en_ordre:      { label: "En ordre",      bg: "rgba(22,163,74,0.12)",  fg: "#16A34A" },
  en_retard:     { label: "En retard",     bg: "rgba(225,29,72,0.12)",  fg: "#E11D48" },
  insolvable:    { label: "Insolvable",    bg: "rgba(120,53,15,0.12)",  fg: "#92400E" },
  en_traitement: { label: "En traitement", bg: "rgba(79,102,232,0.12)", fg: "#4F66E8" },
};

const TABS = [
  { key: "overview", label: "Vue d'ensemble" },
  { key: "rubriques", label: "Rubriques des frais" },
  { key: "avances", label: "Avances & Acomptes" },
  { key: "echeances", label: "Tranches & Échéances" },
  { key: "eleves", label: "Élèves" },
  { key: "insolvabilite", label: "Insolvabilité" },
  { key: "rapports", label: "Rapports" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export function FinanceDashboard({
  overview, categories, advances, installments, year, classNames,
}: {
  overview: FinanceOverview;
  categories: FeeCategory[];
  advances: StudentAdvance[];
  installments: StudentInstallment[];
  year: string;
  classNames: string[];
}) {
  const [tab, setTab] = useState<TabKey>("eleves");
  const [rubriqueModal, setRubriqueModal] = useState(false);
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
        <button onClick={() => setRubriqueModal(true)} className="ek-btn ek-btn-primary" style={{ height: 40 }}>
          <Icon name="plus" size={15} stroke={2.5} /> Nouvelle rubrique
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

      {tab === "eleves" && <ElevesTab overview={overview} classNames={classNames} />}
      {tab === "rubriques" && <RubriquesTab categories={categories} classNames={classNames} />}
      {tab === "overview" && <OverviewTab overview={overview} />}
      {tab === "insolvabilite" && <InsolvabiliteTab overview={overview} />}
      {tab === "rapports" && <RapportsTab overview={overview} />}
      {tab === "avances" && <AdvancesTab advances={advances} currency={c} />}
      {tab === "echeances" && <InstallmentsTab installments={installments} currency={c} />}

      {rubriqueModal && <RubriqueModal onClose={() => setRubriqueModal(false)} />}
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

// ── Onglet Élèves (vue principale de l'image) ────────────────────────
function ElevesTab({ overview, classNames }: { overview: FinanceOverview; classNames: string[] }) {
  const c = overview.currency;
  const [query, setQuery] = useState("");
  const [classF, setClassF] = useState("");
  const [payF, setPayF] = useState<"" | PaymentStatus>("");
  const [statF, setStatF] = useState<"" | FinanceStatus>("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return overview.students.filter((s) => {
      if (classF && s.className !== classF) return false;
      if (payF && s.paymentStatus !== payF) return false;
      if (statF && s.financeStatus !== statF) return false;
      if (q && !s.fullName.toLowerCase().includes(q) && !s.matricule.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [overview.students, query, classF, payF, statF]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const cur = Math.min(page, pages - 1);
  const pageRows = filtered.slice(cur * pageSize, cur * pageSize + pageSize);

  const exportCsv = () => exportStudentsCsv(filtered, c);
  const exportPdf = () => exportStudentsPdf(filtered, c);

  return (
    <>
      {/* Barre d'outils */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)", display: "flex" }}>
            <Icon name="search" size={15} />
          </span>
          <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Rechercher un élève (nom, code…)"
            style={{ width: "100%", padding: "9px 12px 9px 34px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)", fontSize: 13, color: "var(--ink)" }} />
        </div>
        <Select label="Classe" value={classF} onChange={(v) => { setClassF(v); setPage(0); }}
          options={[{ v: "", l: "Toutes" }, ...classNames.map((n) => ({ v: n, l: n }))]} />
        <Select label="Statut de paiement" value={payF} onChange={(v) => { setPayF(v as any); setPage(0); }}
          options={[{ v: "", l: "Tous" }, { v: "paye", l: "Payé" }, { v: "partiel", l: "Partiel" }, { v: "non_paye", l: "Non payé" }]} />
        <Select label="Statut" value={statF} onChange={(v) => { setStatF(v as any); setPage(0); }}
          options={[{ v: "", l: "Tous" }, { v: "en_ordre", l: "En ordre" }, { v: "en_retard", l: "En retard" }, { v: "insolvable", l: "Insolvable" }, { v: "en_traitement", l: "En traitement" }]} />
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
      {selected && <DetailPanel studentId={selected} currency={c} />}

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
    { label: "En retard", value: d.late, color: "#E11D48" },
    { label: "Non payés", value: d.unpaid, color: "#94A3B8" },
  ];
  const s = overview.situation;
  const sit = [
    { label: "En ordre", value: s.enOrdre, color: "#16A34A" },
    { label: "En retard", value: s.enRetard, color: "#E11D48" },
    { label: "Insolvables", value: s.insolvable, color: "#92400E" },
    { label: "En traitement", value: s.enTraitement, color: "#4F66E8" },
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
          <QuickAction icon="flag" label="Marquer un élève en insolvabilité" onClick={() => act("insolvable")} disabled={pending} />
          <QuickAction icon="check" label="Retirer l'insolvabilité" onClick={() => act("en_ordre")} disabled={pending} />
          <QuickAction icon="bell" label="Envoyer un rappel de paiement" onClick={() => act("en_retard")} disabled={pending} />
          <QuickAction icon="file" label="Voir les dettes par élève" onClick={() => act("en_traitement")} disabled={pending} />
        </div>
        {!selected && <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 8 }}>Sélectionnez un élève dans la liste pour ces actions.</div>}
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
function DetailPanel({ studentId, currency }: { studentId: string; currency: string }) {
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
        <div style={{ marginLeft: "auto" }}><Chip meta={STA[s.financeStatus]} /></div>
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
      {advForm && <AdvanceModal studentId={studentId} onClose={() => setAdvForm(false)} onDone={() => { setAdvForm(false); reload(); router.refresh(); }} />}
      {instForm && <InstallmentModal studentId={studentId} onClose={() => setInstForm(false)} onDone={() => { setInstForm(false); reload(); router.refresh(); }} />}
    </div>
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

// ── Onglet Tranches & Échéances (école) ──────────────────────────────
function InstallmentsTab({ installments, currency }: { installments: StudentInstallment[]; currency: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
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
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{it.label}{it.categoryLabel ? ` · ${it.categoryLabel}` : ""}</div>
          </div>
          <span style={{ fontWeight: 700 }}>{money(it.amount, it.currency)}</span>
          <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{it.dueDate ? new Date(it.dueDate).toLocaleDateString("fr-FR") : "—"}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>Pour créer une tranche, ouvrez un élève dans « Élèves » → sous-onglet « Échéances ». Cochez pour marquer une tranche payée.</div>
      <Section title="En retard" rows={overdue} tint="#E11D48" />
      <Section title="À venir" rows={upcoming} tint="#B45309" />
      <Section title="Payées" rows={paid} tint="#16A34A" />
    </div>
  );
}

function AdvanceModal({ studentId, onClose, onDone }: { studentId: string; onClose: () => void; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("CDF");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = () => {
    const amt = parseFloat(amount.replace(",", ".")) || 0;
    if (!(amt > 0)) { setError("Montant invalide."); return; }
    start(async () => { const r = await addAdvance({ studentId, amount: amt, currency, note }); if (r.ok) onDone(); else setError(r.message); });
  };
  return (
    <Modal title="Avance / acompte" onClose={onClose}>
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

function InstallmentModal({ studentId, onClose, onDone }: { studentId: string; onClose: () => void; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("CDF");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = () => {
    const amt = parseFloat(amount.replace(",", ".")) || 0;
    if (!(amt > 0)) { setError("Montant invalide."); return; }
    start(async () => { const r = await addInstallment({ studentId, label: label || "Tranche", amount: amt, currency, dueDate }); if (r.ok) onDone(); else setError(r.message); });
  };
  return (
    <Modal title="Tranche / échéance" onClose={onClose}>
      <Labeled label="Libellé"><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Tranche 1 — scolarité" style={modalInp} /></Labeled>
      <div style={{ display: "flex", gap: 10 }}>
        <Labeled label="Montant" style={{ flex: 1 }}><input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))} inputMode="decimal" placeholder="25000" style={modalInp} /></Labeled>
        <Labeled label="Devise" style={{ width: 110 }}><select value={currency} onChange={(e) => setCurrency(e.target.value)} style={modalInp}><option value="CDF">FC</option><option value="USD">USD</option></select></Labeled>
      </div>
      <Labeled label="Date d'échéance"><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={modalInp} /></Labeled>
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

// ── Onglet Insolvabilité ─────────────────────────────────────────────
function InsolvabiliteTab({ overview }: { overview: FinanceOverview }) {
  const rows = overview.students.filter((s) => s.financeStatus === "insolvable");
  return (
    <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--divider)", fontSize: 13.5, fontWeight: 700 }}>Élèves en insolvabilité ({rows.length})</div>
      {rows.length === 0 ? (
        <div style={{ padding: 30, textAlign: "center", color: "var(--ink-3)", fontSize: 12.5 }}>Aucun élève marqué en insolvabilité.</div>
      ) : rows.map((s, i) => (
        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderTop: i > 0 ? "1px solid var(--divider)" : "none", fontSize: 12.5 }}>
          <Avatar name={s.fullName} url={s.avatarUrl} size={30} />
          <div style={{ flex: 1 }}><span style={{ fontWeight: 600 }}>{s.fullName}</span> <span style={{ color: "var(--ink-3)" }}>· {s.className}</span></div>
          <span style={{ color: "#E11D48", fontWeight: 700 }}>{money(s.remaining, overview.currency)}</span>
          <InsolvableToggle studentId={s.id} />
        </div>
      ))}
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

// ── Onglet Rapports (export + calculatrice) ──────────────────────────
function RapportsTab({ overview }: { overview: FinanceOverview }) {
  const c = overview.currency;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: 16 }}>
      <div className="ek-card" style={{ padding: 18 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 6 }}>Exporter les données</div>
        <p style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 14 }}>Téléchargez la liste des élèves et leur situation financière.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => exportStudentsCsv(overview.students, c)} className="ek-btn ek-btn-outline" style={{ height: 38, fontSize: 12.5 }}><Icon name="download" size={14} /> Excel (CSV)</button>
          <button onClick={() => exportStudentsPdf(overview.students, c)} className="ek-btn ek-btn-outline" style={{ height: 38, fontSize: 12.5 }}><Icon name="file" size={14} /> PDF</button>
        </div>
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

// ── Styles ───────────────────────────────────────────────────────────
const selStyle: React.CSSProperties = { padding: "0 10px", height: 40, borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)", fontSize: 13, color: "var(--ink)" };
const modalInp: React.CSSProperties = { width: "100%", padding: "9px 11px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)", fontSize: 13, color: "var(--ink)" };
const iconBtn: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", padding: 5, display: "flex" };
const errBox: React.CSSProperties = { padding: 9, borderRadius: 8, background: "rgba(192,58,43,0.10)", color: "var(--danger)", fontSize: 12, fontWeight: 600 };
const calcLbl: React.CSSProperties = { fontSize: 11, color: "var(--ink-3)", fontWeight: 600, marginBottom: 4 };
const calcInp: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)", fontSize: 15, color: "var(--ink)", fontWeight: 700 };
