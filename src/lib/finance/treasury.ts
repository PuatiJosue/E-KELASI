// Module Finance v2 — couche données « Trésorerie ».
//
// La Trésorerie ne stocke QUE les dépenses et les recettes exceptionnelles
// (`treasury_entries`). Les recettes « frais scolaires » et « autres frais » sont
// DÉRIVÉES des encaissements (`fee_payments`, via getFeesOverview) — jamais ressaisies.
// Solde, impayés et taux de recouvrement en découlent automatiquement.

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getMySchool } from "@/lib/school-db";
import { isLiveMode } from "@/lib/db";
import { schoolYearLabel } from "@/lib/trimester";
import { getFeesOverview } from "./fees";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export type TreasuryKind = "depense" | "recette_exceptionnelle";

export type TreasuryEntry = {
  id: string;
  kind: TreasuryKind;
  category: string | null;
  amount: number;
  currency: string;
  label: string;
  entryDate: string;
  note: string | null;
  recordedBy: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
};

export type TreasuryKpis = {
  recettesScolaires: number;
  recettesAutres: number;
  recettesExceptionnelles: number;
  totalRecettes: number;
  totalDepenses: number;
  solde: number;
  impayes: number;
  tauxRecouvrement: number;
};
export type EvolutionPoint = { label: string; recettes: number; depenses: number; solde: number };

export type TreasuryOverview = {
  currency: string;
  year: string;
  kpis: TreasuryKpis;                                  // agrégé (usage interne / alertes)
  currencies: string[];                                // devises présentes (USD / CDF…)
  byCurrency: Record<string, TreasuryKpis>;            // montants séparés par devise
  entries: TreasuryEntry[];
  evolution: EvolutionPoint[];
  evolutionByCurrency: Record<string, EvolutionPoint[]>;
};

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function lastMonths(n: number): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: monthKey(d), label: d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }) });
  }
  return out;
}

export async function getTreasuryOverview(year?: string): Promise<TreasuryOverview> {
  if (!isLiveMode()) return mockTreasury(year);
  try {
    const school = await getMySchool();
    if (!school) return emptyTreasury(year);
    const svc = service();
    const yr = year || school.currentYear || schoolYearLabel();

    const [feesScol, feesAutre, { data: entriesRaw }, { data: paysRaw }] = await Promise.all([
      getFeesOverview("scolaire", year),
      getFeesOverview("autre", year),
      svc.from("treasury_entries")
        .select("id, kind, category, amount, currency, label, entry_date, note, cancelled_at, cancel_reason, profiles:recorded_by(full_name)")
        .eq("school_id", school.id).order("entry_date", { ascending: false }),
      svc.from("fee_payments").select("amount, paid_at, currency, fees(kind)").eq("school_id", school.id).is("cancelled_at", null),
    ]);

    const entries: TreasuryEntry[] = (entriesRaw ?? []).map((e: any) => ({
      id: e.id, kind: e.kind, category: e.category ?? null, amount: Number(e.amount), currency: e.currency ?? "CDF",
      label: e.label ?? "", entryDate: e.entry_date, note: e.note ?? null,
      recordedBy: e.profiles?.full_name ?? null, cancelledAt: e.cancelled_at ?? null, cancelReason: e.cancel_reason ?? null,
    }));

    const active = entries.filter((e) => !e.cancelledAt);
    const recettesExceptionnelles = active.filter((e) => e.kind === "recette_exceptionnelle").reduce((a, e) => a + e.amount, 0);
    const totalDepenses = active.filter((e) => e.kind === "depense").reduce((a, e) => a + e.amount, 0);
    // Recettes = argent réellement encaissé (non plafonné), ventilé par type de frais.
    let recettesScolaires = 0, recettesAutres = 0;
    for (const p of (paysRaw ?? []) as any[]) {
      if (p.fees?.kind === "autre") recettesAutres += Number(p.amount);
      else recettesScolaires += Number(p.amount);
    }
    const totalRecettes = recettesScolaires + recettesAutres + recettesExceptionnelles;
    const solde = totalRecettes - totalDepenses;
    const impayes = feesScol.kpis.remaining + feesAutre.kpis.remaining;
    const expected = feesScol.kpis.expected + feesAutre.kpis.expected;
    const collected = feesScol.kpis.collected + feesAutre.kpis.collected; // plafonné, pour le taux
    const currency = feesScol.currency || feesAutre.currency || entries[0]?.currency || "CDF";

    // ── Séparation par devise (USD / CDF…) ─────────────────────────
    type Acc = { recS: number; recA: number; recE: number; dep: number; expected: number; collected: number; remaining: number };
    const accs = new Map<string, Acc>();
    const acc = (cur: string): Acc => { let a = accs.get(cur); if (!a) { a = { recS: 0, recA: 0, recE: 0, dep: 0, expected: 0, collected: 0, remaining: 0 }; accs.set(cur, a); } return a; };
    for (const p of (paysRaw ?? []) as any[]) { const a = acc(p.currency ?? "CDF"); if (p.fees?.kind === "autre") a.recA += Number(p.amount); else a.recS += Number(p.amount); }
    for (const e of active) { const a = acc(e.currency); if (e.kind === "recette_exceptionnelle") a.recE += e.amount; else a.dep += e.amount; }
    for (const f of [...feesScol.fees, ...feesAutre.fees]) { const a = acc(f.currency); a.expected += f.expected; a.collected += f.collected; a.remaining += f.remaining; }
    const byCurrency: Record<string, TreasuryKpis> = {};
    for (const [cur, a] of accs) {
      const tr = a.recS + a.recA + a.recE;
      byCurrency[cur] = { recettesScolaires: a.recS, recettesAutres: a.recA, recettesExceptionnelles: a.recE, totalRecettes: tr, totalDepenses: a.dep, solde: tr - a.dep, impayes: a.remaining, tauxRecouvrement: a.expected > 0 ? (a.collected / a.expected) * 100 : 0 };
    }
    const currencies = [...accs.keys()].sort();

    // Évolution mensuelle (6 mois), globale et par devise (recettes − dépenses, solde cumulé).
    const months = lastMonths(6);
    const recByMonth = new Map<string, number>();
    const depByMonth = new Map<string, number>();
    const recByCurMonth = new Map<string, Map<string, number>>();
    const depByCurMonth = new Map<string, Map<string, number>>();
    const bump = (map: Map<string, Map<string, number>>, cur: string, key: string, amt: number) => { let mm = map.get(cur); if (!mm) { mm = new Map(); map.set(cur, mm); } mm.set(key, (mm.get(key) ?? 0) + amt); };
    for (const p of (paysRaw ?? []) as any[]) { const k = monthKey(new Date(p.paid_at)); recByMonth.set(k, (recByMonth.get(k) ?? 0) + Number(p.amount)); bump(recByCurMonth, p.currency ?? "CDF", k, Number(p.amount)); }
    for (const e of active) { const k = monthKey(new Date(e.entryDate)); if (e.kind === "recette_exceptionnelle") { recByMonth.set(k, (recByMonth.get(k) ?? 0) + e.amount); bump(recByCurMonth, e.currency, k, e.amount); } else { depByMonth.set(k, (depByMonth.get(k) ?? 0) + e.amount); bump(depByCurMonth, e.currency, k, e.amount); } }
    const series = (rm: Map<string, number>, dm: Map<string, number>): EvolutionPoint[] => { let run = 0; return months.map((m) => { const rec = rm.get(m.key) ?? 0, dep = dm.get(m.key) ?? 0; run += rec - dep; return { label: m.label, recettes: rec, depenses: dep, solde: run }; }); };
    const evolution = series(recByMonth, depByMonth);
    const evolutionByCurrency: Record<string, EvolutionPoint[]> = {};
    for (const cur of currencies) evolutionByCurrency[cur] = series(recByCurMonth.get(cur) ?? new Map(), depByCurMonth.get(cur) ?? new Map());

    return {
      currency, year: yr,
      kpis: { recettesScolaires, recettesAutres, recettesExceptionnelles, totalRecettes, totalDepenses, solde, impayes,
        tauxRecouvrement: expected > 0 ? (collected / expected) * 100 : 0 },
      currencies, byCurrency,
      entries, evolution, evolutionByCurrency,
    };
  } catch {
    return emptyTreasury(year);
  }
}

// ── Clôture quotidienne de caisse ────────────────────────────────────
export type CashLine = { label: string; amount: number; category: string | null };
export type CashTotals = {
  currency: string;
  recettesScolaires: number;
  recettesAutres: number;
  recettesExceptionnelles: number;
  totalRecettes: number;
  totalDepenses: number;
  solde: number;
  recettes: CashLine[];   // détail des recettes exceptionnelles
  depenses: CashLine[];   // détail des dépenses
};
export type CashSession = {
  id: string;
  sessionDate: string;
  status: "open" | "closed";
  openedBy: string | null;
  openedAt: string;
  closedBy: string | null;
  closedAt: string | null;
  totals: CashTotals | null;
};

function mapSession(s: any): CashSession {
  return {
    id: s.id, sessionDate: s.session_date, status: s.status,
    openedBy: s.opener?.full_name ?? null, openedAt: s.opened_at,
    closedBy: s.closer?.full_name ?? null, closedAt: s.closed_at ?? null,
    totals: (s.totals as CashTotals) ?? null,
  };
}
const SESSION_SELECT = "id, session_date, status, opened_at, closed_at, totals, opener:opened_by(full_name), closer:closed_by(full_name)";

export type CashState = { today: CashSession | null; recent: CashSession[] };

export async function getCashState(): Promise<CashState> {
  if (!isLiveMode()) return mockCashState();
  try {
    const school = await getMySchool();
    if (!school) return { today: null, recent: [] };
    const svc = service();
    const today = new Date().toISOString().slice(0, 10);
    const [{ data: todayRows }, { data: recent }] = await Promise.all([
      svc.from("cash_sessions").select(SESSION_SELECT).eq("school_id", school.id).eq("session_date", today).order("opened_at", { ascending: false }).limit(1),
      svc.from("cash_sessions").select(SESSION_SELECT).eq("school_id", school.id).eq("status", "closed").order("session_date", { ascending: false }).limit(12),
    ]);
    return { today: todayRows?.[0] ? mapSession(todayRows[0]) : null, recent: (recent ?? []).map(mapSession) };
  } catch {
    return { today: null, recent: [] };
  }
}

// Totaux d'une journée (utilisé à la clôture). Calculés depuis la source unique.
export async function computeDayTotals(svc: ReturnType<typeof service>, schoolId: string, date: string): Promise<CashTotals> {
  const start = `${date}T00:00:00`;
  const end = `${date}T23:59:59.999`;
  const [{ data: pays }, { data: entries }] = await Promise.all([
    svc.from("fee_payments").select("amount, currency, fees(kind)").eq("school_id", schoolId).is("cancelled_at", null).gte("paid_at", start).lte("paid_at", end),
    svc.from("treasury_entries").select("kind, amount, currency, label, category").eq("school_id", schoolId).is("cancelled_at", null).eq("entry_date", date),
  ]);
  let recettesScolaires = 0, recettesAutres = 0, currency = "CDF";
  for (const p of (pays ?? []) as any[]) {
    currency = p.currency ?? currency;
    if (p.fees?.kind === "autre") recettesAutres += Number(p.amount); else recettesScolaires += Number(p.amount);
  }
  const recettes: CashLine[] = [], depenses: CashLine[] = [];
  let recettesExceptionnelles = 0, totalDepenses = 0;
  for (const e of (entries ?? []) as any[]) {
    currency = e.currency ?? currency;
    if (e.kind === "recette_exceptionnelle") { recettesExceptionnelles += Number(e.amount); recettes.push({ label: e.label, amount: Number(e.amount), category: e.category ?? null }); }
    else { totalDepenses += Number(e.amount); depenses.push({ label: e.label, amount: Number(e.amount), category: e.category ?? null }); }
  }
  const totalRecettes = recettesScolaires + recettesAutres + recettesExceptionnelles;
  return { currency, recettesScolaires, recettesAutres, recettesExceptionnelles, totalRecettes, totalDepenses, solde: totalRecettes - totalDepenses, recettes, depenses };
}

function mockCashState(): CashState {
  const totals: CashTotals = {
    currency: "CDF", recettesScolaires: 320000, recettesAutres: 45000, recettesExceptionnelles: 0,
    totalRecettes: 365000, totalDepenses: 95000, solde: 270000,
    recettes: [], depenses: [{ label: "Achat de craies", amount: 95000, category: "Fournitures" }],
  };
  return {
    today: null,
    recent: [
      { id: "cs1", sessionDate: "2026-10-12", status: "closed", openedBy: "La direction", openedAt: "2026-10-12T07:30:00", closedBy: "La direction", closedAt: "2026-10-12T16:10:00", totals },
    ],
  };
}

function emptyTreasury(year?: string): TreasuryOverview {
  return {
    currency: "CDF", year: year || schoolYearLabel(),
    kpis: { recettesScolaires: 0, recettesAutres: 0, recettesExceptionnelles: 0, totalRecettes: 0, totalDepenses: 0, solde: 0, impayes: 0, tauxRecouvrement: 0 },
    currencies: [], byCurrency: {},
    entries: [], evolution: lastMonths(6).map((m) => ({ label: m.label, recettes: 0, depenses: 0, solde: 0 })), evolutionByCurrency: {},
  };
}

function mockTreasury(year?: string): TreasuryOverview {
  const entries: TreasuryEntry[] = [
    { id: "t1", kind: "recette_exceptionnelle", category: "Don", amount: 500000, currency: "CDF", label: "Don d’un partenaire", entryDate: "2026-10-03", note: null, recordedBy: "La direction", cancelledAt: null, cancelReason: null },
    { id: "t2", kind: "depense", category: "Fonctionnement", amount: 180000, currency: "CDF", label: "Facture électricité", entryDate: "2026-10-07", note: null, recordedBy: "La direction", cancelledAt: null, cancelReason: null },
    { id: "t3", kind: "depense", category: "Fournitures", amount: 95000, currency: "CDF", label: "Achat de craies et registres", entryDate: "2026-10-12", note: null, recordedBy: "La direction", cancelledAt: null, cancelReason: null },
  ];
  const recettesScolaires = 2100000, recettesAutres = 320000, recettesExceptionnelles = 500000;
  const totalDepenses = 275000;
  const totalRecettes = recettesScolaires + recettesAutres + recettesExceptionnelles;
  const evolution = lastMonths(6).map((m, i) => {
    const rec = [200000, 350000, 480000, 620000, 540000, 730000][i] ?? 0;
    const dep = [60000, 90000, 75000, 110000, 80000, 95000][i] ?? 0;
    return { label: m.label, recettes: rec, depenses: dep, solde: 0 };
  });
  let run = 0; for (const e of evolution) { run += e.recettes - e.depenses; e.solde = run; }
  const kpis = { recettesScolaires, recettesAutres, recettesExceptionnelles, totalRecettes, totalDepenses, solde: totalRecettes - totalDepenses, impayes: 900000, tauxRecouvrement: 72 };
  const usd: TreasuryKpis = { recettesScolaires: 400, recettesAutres: 0, recettesExceptionnelles: 0, totalRecettes: 400, totalDepenses: 50, solde: 350, impayes: 150, tauxRecouvrement: 68 };
  return {
    currency: "CDF", year: year || schoolYearLabel(),
    kpis, currencies: ["CDF", "USD"], byCurrency: { CDF: kpis, USD: usd },
    entries, evolution, evolutionByCurrency: { CDF: evolution, USD: evolution.map((e) => ({ ...e, recettes: Math.round(e.recettes / 2500), depenses: Math.round(e.depenses / 2500), solde: Math.round(e.solde / 2500) })) },
  };
}
