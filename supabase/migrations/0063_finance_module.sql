-- E-KELASI · Module Finance complet (côté école).
--
-- Rubriques de frais (scolarité, examen, assurance…), montants dus par élève,
-- et suivi de la situation financière. Tout est saisi manuellement par la
-- direction. Accès via service_role uniquement (les actions serveur vérifient
-- la direction) → RLS activé sans policy, comme student_fee_payments.

-- ── Rubriques de frais ───────────────────────────────────────────────
create table if not exists fee_categories (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  name        text not null,
  amount      numeric(14,2) not null default 0,   -- montant par défaut de la rubrique
  currency    text not null default 'CDF',         -- CDF (FC), USD
  school_year text,
  position    int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists idx_fee_categories_school on fee_categories(school_id);
alter table fee_categories enable row level security;

-- ── Frais dus par élève (une ligne = une rubrique appliquée à un élève) ─
create table if not exists student_fees (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  student_id  uuid not null references students(id) on delete cascade,
  category_id uuid references fee_categories(id) on delete set null,
  label       text,                                -- libellé (repris de la rubrique)
  amount_due  numeric(14,2) not null default 0,    -- total dû pour cette rubrique
  currency    text not null default 'CDF',
  school_year text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_student_fees_school_student on student_fees(school_id, student_id);
alter table student_fees enable row level security;

-- ── Rattacher un paiement à une rubrique (facultatif) ────────────────
alter table student_fee_payments add column if not exists category_id uuid references fee_categories(id) on delete set null;

-- ── Situation financière de l'élève (statut manuel côté école) ───────
--   en_ordre | en_retard | insolvable | en_traitement
alter table students add column if not exists finance_status text not null default 'en_ordre';
