// Clôture quotidienne de caisse (totaux séparés par devise).

import { serviceClient } from "@/lib/supabase/service";
import { getMySchool } from "@/lib/school/profile";
import { isLiveMode } from "@/lib/env";

// ── Clôture quotidienne de caisse (séparée par devise) ───────────────
export type CashLine = { label: string; amount: number; currency: string; category: string | null };
export type CashCurrencyTotals = {
  recettesScolaires: number;
  recettesAutres: number;
  recettesExceptionnelles: number;
  totalRecettes: number;
  totalDepenses: number;
  solde: number;
};
export type CashTotals = {
  currencies: string[];
  byCurrency: Record<string, CashCurrencyTotals>;
  recettes: CashLine[];   // détail des recettes exceptionnelles (avec devise)
  depenses: CashLine[];   // détail des dépenses (avec devise)
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

// Normalise le JSON `totals` brut vers une forme CashTotals toujours valide.
// Les clôtures créées avant la refonte multi-devises peuvent contenir un objet
// sans `byCurrency`/`currencies` : sans ça, un `Object.keys(totals.byCurrency)`
// côté UI lève « Cannot convert undefined or null to object » et fait planter
// tout l'onglet Trésorerie.
function normalizeTotals(raw: any): CashTotals | null {
  if (!raw || typeof raw !== "object") return null;
  let byCurrency: Record<string, CashCurrencyTotals> =
    raw.byCurrency && typeof raw.byCurrency === "object" ? raw.byCurrency : {};
  // Rétrocompat : ancienne forme mono-devise (solde/currency/totalRecettes… à
  // plat, sans byCurrency). On la reconstruit pour garder la clôture lisible.
  if (Object.keys(byCurrency).length === 0 && typeof raw.currency === "string") {
    byCurrency = {
      [raw.currency]: {
        recettesScolaires: raw.recettesScolaires ?? 0,
        recettesAutres: raw.recettesAutres ?? 0,
        recettesExceptionnelles: raw.recettesExceptionnelles ?? 0,
        totalRecettes: raw.totalRecettes ?? 0,
        totalDepenses: raw.totalDepenses ?? 0,
        solde: raw.solde ?? 0,
      },
    };
  }
  return {
    currencies: Array.isArray(raw.currencies) && raw.currencies.length ? raw.currencies : Object.keys(byCurrency),
    byCurrency,
    recettes: Array.isArray(raw.recettes) ? raw.recettes : [],
    depenses: Array.isArray(raw.depenses) ? raw.depenses : [],
  };
}

function mapSession(s: any): CashSession {
  return {
    id: s.id, sessionDate: s.session_date, status: s.status,
    openedBy: s.opener?.full_name ?? null, openedAt: s.opened_at,
    closedBy: s.closer?.full_name ?? null, closedAt: s.closed_at ?? null,
    totals: normalizeTotals(s.totals),
  };
}
const SESSION_SELECT = "id, session_date, status, opened_at, closed_at, totals, opener:opened_by(full_name), closer:closed_by(full_name)";

export type CashState = { today: CashSession | null; recent: CashSession[] };

export async function getCashState(): Promise<CashState> {
  if (!isLiveMode()) return mockCashState();
  try {
    const school = await getMySchool();
    if (!school) return { today: null, recent: [] };
    const svc = serviceClient();
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

// Totaux d'une journée (utilisé à la clôture). Calculés depuis la source unique,
// séparés par devise (USD / CDF…).
export async function computeDayTotals(svc: ReturnType<typeof serviceClient>, schoolId: string, date: string): Promise<CashTotals> {
  const start = `${date}T00:00:00`;
  const end = `${date}T23:59:59.999`;
  const [{ data: pays }, { data: entries }] = await Promise.all([
    svc.from("fee_payments").select("amount, currency, fees(kind)").eq("school_id", schoolId).is("cancelled_at", null).gte("paid_at", start).lte("paid_at", end),
    svc.from("treasury_entries").select("kind, amount, currency, label, category").eq("school_id", schoolId).is("cancelled_at", null).eq("entry_date", date),
  ]);
  const by: Record<string, CashCurrencyTotals> = {};
  const ens = (cur: string): CashCurrencyTotals => { if (!by[cur]) by[cur] = { recettesScolaires: 0, recettesAutres: 0, recettesExceptionnelles: 0, totalRecettes: 0, totalDepenses: 0, solde: 0 }; return by[cur]; };
  for (const p of (pays ?? []) as any[]) {
    const t = ens(p.currency ?? "CDF");
    if (p.fees?.kind === "autre") t.recettesAutres += Number(p.amount); else t.recettesScolaires += Number(p.amount);
  }
  const recettes: CashLine[] = [], depenses: CashLine[] = [];
  for (const e of (entries ?? []) as any[]) {
    const cur = e.currency ?? "CDF";
    const t = ens(cur);
    if (e.kind === "recette_exceptionnelle") { t.recettesExceptionnelles += Number(e.amount); recettes.push({ label: e.label, amount: Number(e.amount), currency: cur, category: e.category ?? null }); }
    else { t.totalDepenses += Number(e.amount); depenses.push({ label: e.label, amount: Number(e.amount), currency: cur, category: e.category ?? null }); }
  }
  for (const cur of Object.keys(by)) { const t = by[cur]; t.totalRecettes = t.recettesScolaires + t.recettesAutres + t.recettesExceptionnelles; t.solde = t.totalRecettes - t.totalDepenses; }
  return { currencies: Object.keys(by).sort(), byCurrency: by, recettes, depenses };
}

function mockCashState(): CashState {
  const totals: CashTotals = {
    currencies: ["CDF"],
    byCurrency: { CDF: { recettesScolaires: 320000, recettesAutres: 45000, recettesExceptionnelles: 0, totalRecettes: 365000, totalDepenses: 95000, solde: 270000 } },
    recettes: [], depenses: [{ label: "Achat de craies", amount: 95000, currency: "CDF", category: "Fournitures" }],
  };
  return {
    today: null,
    recent: [
      { id: "cs1", sessionDate: "2026-10-12", status: "closed", openedBy: "La direction", openedAt: "2026-10-12T07:30:00", closedBy: "La direction", closedAt: "2026-10-12T16:10:00", totals },
    ],
  };
}
