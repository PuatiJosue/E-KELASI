-- Phase 2 du modèle B2B : suivi des cotisations parent → école (5 USD/mois).
-- L'argent est encaissé par l'école (hors app), mais TRACÉ ici.
-- Une ligne par (école, parent, mois couvert).

create table if not exists parent_fee_payments (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  parent_id   uuid not null references profiles(id) on delete cascade,
  period      text not null,                       -- mois couvert, format 'YYYY-MM'
  amount_cents int not null default 500,           -- 5 USD par défaut
  currency    char(3) not null default 'USD',
  method      text not null default 'cash',        -- cash, mobile_money, autre
  recorded_by uuid references profiles(id) on delete set null,
  paid_at     timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  unique (school_id, parent_id, period)            -- évite les doublons du mois
);

create index if not exists idx_parent_fee_school_period
  on parent_fee_payments(school_id, period);

-- Accès uniquement via service_role (les actions serveur vérifient la direction).
alter table parent_fee_payments enable row level security;
