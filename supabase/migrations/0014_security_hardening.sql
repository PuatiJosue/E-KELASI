-- E-KELASI · Security hardening
-- 1. Empêche l'élévation de privilèges (un user ne peut plus se mettre super_admin).
-- 2. Empêche un participant d'éditer le contenu des messages d'autrui
--    (seul read_at peut bouger).
-- 3. Recalcule côté serveur le montant Mobile Money à partir du plan
--    (le client ne peut plus prétendre un Premium à 1 cent).

-- ── 1. profiles : verrouiller la colonne `role` ───────────────────────
create or replace function lock_profile_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Les actions serveur (service_role) et les super_admin peuvent définir
  -- librement les rôles. Le reste : verrouillé.
  if auth.role() = 'service_role' or is_super_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.role := 'parent';        -- une inscription est toujours un parent
  elsif tg_op = 'UPDATE' then
    new.role := old.role;        -- interdit de changer son propre rôle
  end if;
  return new;
end $$;

drop trigger if exists trg_lock_profile_role on profiles;
create trigger trg_lock_profile_role
  before insert or update on profiles
  for each row execute function lock_profile_role();

-- ── 2. messages : seul read_at peut être modifié par un participant ───
create or replace function lock_message_columns() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'service_role' or is_super_admin() then
    return new;
  end if;
  -- On force la conservation du contenu et des métadonnées d'origine.
  new.body            := old.body;
  new.sender_id       := old.sender_id;
  new.conversation_id := old.conversation_id;
  new.created_at      := old.created_at;
  return new;
end $$;

drop trigger if exists trg_lock_message_columns on messages;
create trigger trg_lock_message_columns
  before update on messages
  for each row execute function lock_message_columns();

-- Et on resserre la policy with check pour rester explicite.
drop policy if exists messages_self_update_read on messages;
create policy messages_self_update_read on messages for update
  using (
    conversation_id in (select my_conversation_ids())
    and sender_id <> auth.uid()
  )
  with check (
    conversation_id in (select my_conversation_ids())
    and sender_id <> auth.uid()
  );

-- ── 3. mobile_money_payments : montant recalculé serveur ──────────────
-- Table de référence des prix (source de vérité côté DB)
create table if not exists plan_prices (
  plan         subscription_plan primary key,
  amount_cents int not null,
  currency     char(3) not null default 'EUR',
  updated_at   timestamptz not null default now()
);

insert into plan_prices (plan, amount_cents) values
  ('essentiel',  900),
  ('famille',   1900),
  ('premium',   2900)
on conflict (plan) do update set
  amount_cents = excluded.amount_cents,
  updated_at = now();

alter table plan_prices enable row level security;

drop policy if exists plan_prices_read on plan_prices;
create policy plan_prices_read on plan_prices for select using (true);

drop policy if exists plan_prices_super_admin_write on plan_prices;
create policy plan_prices_super_admin_write on plan_prices for all
  using (is_super_admin()) with check (is_super_admin());

create or replace function enforce_mm_amount() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_amount int;
  v_currency char(3);
begin
  if auth.role() = 'service_role' or is_super_admin() then
    return new;
  end if;
  select amount_cents, currency into v_amount, v_currency
    from plan_prices where plan = new.plan;
  if v_amount is null then
    raise exception 'unknown plan %', new.plan;
  end if;
  -- On écrase ce que le client a envoyé : pas négociable.
  new.amount_cents := v_amount;
  new.currency     := v_currency;
  return new;
end $$;

drop trigger if exists trg_mm_amount on mobile_money_payments;
create trigger trg_mm_amount
  before insert on mobile_money_payments
  for each row execute function enforce_mm_amount();
