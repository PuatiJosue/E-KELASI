-- E-KELASI · Module Finance v2 — refonte en 3 rubriques (Frais scolaires /
-- Autres frais / Trésorerie) avec source de données unique.
--
-- Principe : `fee_payments` est l'UNIQUE table des encaissements (frais scolaires
-- ET autres frais). La Trésorerie ne duplique jamais ces paiements ; ses recettes
-- « frais » sont dérivées à la lecture. `treasury_entries` ne stocke que les
-- dépenses et les recettes exceptionnelles. Impayés, statuts, graphiques et solde
-- sont TOUS calculés depuis ces tables — aucune double saisie.
--
-- Annulation = soft delete (cancelled_at + motif), jamais de suppression définitive
-- pour paiements et écritures de trésorerie.
--
-- RLS activé SANS policy : accès service_role uniquement (les actions serveur
-- vérifient school_admin), comme cash_entries. Ces tables ne dépendent que de
-- schools / students / profiles → migration indépendante de 0063–0068.
-- Les anciennes tables Finance (fee_categories, student_fees, …) restent intactes.

-- ── Frais (scolaire ou autre) ────────────────────────────────────────
create table if not exists fees (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references schools(id) on delete cascade,
  school_year  text,
  kind         text not null default 'scolaire',   -- 'scolaire' | 'autre'
  label        text not null,
  category     text,                                -- autres frais : Uniforme / Transport…
  class_name   text,                                -- niveau/classe ciblé (null = école entière)
  option       text,                                -- filière (couple class_name+option = classe)
  total_amount numeric(14,2) not null default 0,
  currency     text not null default 'CDF',
  position     int not null default 0,
  archived     boolean not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists idx_fees_school on fees(school_id, school_year);
create index if not exists idx_fees_school_kind on fees(school_id, kind);
alter table fees enable row level security;

-- ── Tranches d'un frais ──────────────────────────────────────────────
create table if not exists fee_installments (
  id          uuid primary key default gen_random_uuid(),
  fee_id      uuid not null references fees(id) on delete cascade,
  school_id   uuid not null references schools(id) on delete cascade,
  name        text not null,
  position    int not null default 0,
  amount      numeric(14,2) not null default 0,
  due_date    date,
  created_at  timestamptz not null default now()
);
create index if not exists idx_fee_installments_fee on fee_installments(fee_id);
alter table fee_installments enable row level security;

-- ── Montant ajusté / exonéré par élève (absence = montant total du frais) ─
create table if not exists fee_overrides (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  fee_id      uuid not null references fees(id) on delete cascade,
  student_id  uuid not null references students(id) on delete cascade,
  amount      numeric(14,2) not null default 0,
  reason      text,
  created_at  timestamptz not null default now(),
  unique (fee_id, student_id)
);
create index if not exists idx_fee_overrides_fee on fee_overrides(fee_id);
alter table fee_overrides enable row level security;

-- ── Encaissements — SOURCE UNIQUE ────────────────────────────────────
create table if not exists fee_payments (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references schools(id) on delete cascade,
  fee_id         uuid not null references fees(id) on delete cascade,
  student_id     uuid not null references students(id) on delete cascade,
  installment_id uuid references fee_installments(id) on delete set null,
  amount         numeric(14,2) not null default 0,
  currency       text not null default 'CDF',
  paid_at        timestamptz not null default now(),
  invoice_no     text,                              -- n° de facture saisissable
  cashier_name   text,                              -- nom du caissier saisissable
  note           text,
  recorded_by    uuid references profiles(id) on delete set null,
  cancelled_at   timestamptz,                       -- soft delete
  cancel_reason  text,
  cancelled_by   uuid references profiles(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists idx_fee_payments_school on fee_payments(school_id);
create index if not exists idx_fee_payments_fee_student on fee_payments(fee_id, student_id);
create index if not exists idx_fee_payments_student on fee_payments(school_id, student_id);
alter table fee_payments enable row level security;

-- ── Trésorerie : dépenses & recettes exceptionnelles uniquement ──────
create table if not exists treasury_entries (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  school_year   text,
  kind          text not null,                      -- 'depense' | 'recette_exceptionnelle'
  category      text,                               -- Don / Subvention / Location / …
  amount        numeric(14,2) not null default 0,
  currency      text not null default 'CDF',
  label         text not null,
  entry_date    date not null default current_date,
  note          text,
  recorded_by   uuid references profiles(id) on delete set null,
  cancelled_at  timestamptz,                        -- soft delete
  cancel_reason text,
  cancelled_by  uuid references profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists idx_treasury_entries_school_date on treasury_entries(school_id, entry_date);
alter table treasury_entries enable row level security;

-- ── Clôture quotidienne de caisse ────────────────────────────────────
create table if not exists cash_sessions (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  session_date  date not null default current_date,
  opened_by     uuid references profiles(id) on delete set null,
  opened_at     timestamptz not null default now(),
  closed_by     uuid references profiles(id) on delete set null,
  closed_at     timestamptz,
  status        text not null default 'open',       -- 'open' | 'closed'
  totals        jsonb,                              -- snapshot des totaux à la clôture
  note          text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_cash_sessions_school_date on cash_sessions(school_id, session_date);
alter table cash_sessions enable row level security;

-- ── Journal d'audit (modifications exceptionnelles après clôture) ────
create table if not exists finance_audit (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references schools(id) on delete cascade,
  entity_type  text not null,                       -- fee_payment | treasury_entry | cash_session | …
  entity_id    uuid,
  action       text not null,                       -- create | update | cancel | reopen | …
  actor        uuid references profiles(id) on delete set null,
  reason       text,
  at           timestamptz not null default now()
);
create index if not exists idx_finance_audit_school on finance_audit(school_id, at);
alter table finance_audit enable row level security;
