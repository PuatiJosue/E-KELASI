-- Mobile Money payments (Orange Money, Airtel Money, M-Pesa, MTN MoMo)
-- Mode MVP : paiement manuel — le parent transfère, soumet une référence,
-- un admin valide depuis la console, on active la subscription.

create type mm_provider as enum ('orange', 'airtel', 'mtn', 'mpesa', 'wave');
create type mm_status as enum ('pending', 'validated', 'rejected');

create table if not exists mobile_money_payments (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references profiles(id) on delete cascade,
  plan subscription_plan not null,
  amount_cents int not null,
  currency char(3) not null default 'EUR',
  provider mm_provider not null,
  sender_phone text not null,           -- numéro du parent qui a envoyé
  reference text not null,              -- code de transaction (TXN ID)
  screenshot_url text,                  -- preuve (uploadée plus tard)
  status mm_status not null default 'pending',
  validated_by uuid references profiles(id) on delete set null,
  validated_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_mm_status on mobile_money_payments(status, created_at desc);
create index if not exists idx_mm_parent on mobile_money_payments(parent_id, created_at desc);

create trigger trg_mm_updated before update on mobile_money_payments
  for each row execute function set_updated_at();

alter table mobile_money_payments enable row level security;

-- Parent : peut créer ses propres demandes + lire les siennes
drop policy if exists mm_own_insert on mobile_money_payments;
create policy mm_own_insert on mobile_money_payments for insert
  with check (parent_id = auth.uid());

drop policy if exists mm_own_read on mobile_money_payments;
create policy mm_own_read on mobile_money_payments for select
  using (parent_id = auth.uid() or is_super_admin());

-- Super admin : update (valider/rejeter)
drop policy if exists mm_admin_update on mobile_money_payments;
create policy mm_admin_update on mobile_money_payments for update
  using (is_super_admin()) with check (is_super_admin());
