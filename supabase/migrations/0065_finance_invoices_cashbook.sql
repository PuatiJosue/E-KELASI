-- E-KELASI · Finance — Facturation, statuts simplifiés & Caisse (dépenses/recettes).
--
-- 1) Statuts d'élève simplifiés : en_ordre | non_paye | avance | insolvable.
--    On retire « en_retard » (→ non_paye) et « en_traitement » (→ en_ordre).
-- 2) fee_categories.kind : route les factures (acompte / tranche / autre / scolarite)
--    et porte le montant par défaut par type de frais.
-- 3) cash_entries : journal de caisse (dépenses et recettes), saisi par la direction.
--    Accès service_role uniquement (les actions serveur vérifient la direction) →
--    RLS activé sans policy, comme student_fees / student_advances.

-- ── 1) Normalisation des statuts financiers ──────────────────────────
update students set finance_status = 'non_paye' where finance_status = 'en_retard';
update students set finance_status = 'en_ordre' where finance_status = 'en_traitement';

-- ── 2) Type de rubrique ──────────────────────────────────────────────
alter table fee_categories add column if not exists kind text;  -- acompte | tranche | autre | scolarite | null

-- ── 3) Journal de caisse ─────────────────────────────────────────────
create table if not exists cash_entries (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  kind        text not null,                       -- 'depense' | 'recette'
  amount      numeric(14,2) not null default 0,
  currency    text not null default 'CDF',
  label       text not null,
  entry_date  date not null default current_date,
  signatory   text,                                -- nom du signataire
  note        text,
  school_year text,
  recorded_by uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_cash_entries_school_date on cash_entries(school_id, entry_date);
alter table cash_entries enable row level security;
