-- Phase 3 du modèle B2B : abonnement école → E-KELASI (90 USD/mois).
-- Trace les paiements des écoles (carte OU mobile money/manuel).
-- Une ligne par (école, mois).

create table if not exists school_payments (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  period      text not null,                       -- mois couvert 'YYYY-MM'
  amount_cents int not null default 9000,          -- 90 USD par défaut
  currency    char(3) not null default 'USD',
  method      text not null default 'manual',      -- manual, mobile_money, card
  recorded_by uuid references profiles(id) on delete set null,
  paid_at     timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  unique (school_id, period)
);

create index if not exists idx_school_payments_period on school_payments(period);

alter table school_payments enable row level security;

-- Seul le super_admin lit/écrit (les écoles ne voient pas la table directement).
drop policy if exists school_payments_super_admin on school_payments;
create policy school_payments_super_admin on school_payments for all
  using (is_super_admin()) with check (is_super_admin());
