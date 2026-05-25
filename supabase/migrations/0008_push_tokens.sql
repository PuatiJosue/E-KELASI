-- Table pour stocker les Expo push tokens des appareils des utilisateurs.
-- Un user peut avoir plusieurs appareils (mobile + tablette par ex).

create table if not exists push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  expo_token text not null unique,
  platform text not null check (platform in ('ios', 'android', 'web')),
  device_name text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists idx_push_tokens_user on push_tokens(user_id);

alter table push_tokens enable row level security;

drop policy if exists push_tokens_own_read on push_tokens;
create policy push_tokens_own_read on push_tokens for select
  using (user_id = auth.uid() or is_super_admin());

drop policy if exists push_tokens_own_insert on push_tokens;
create policy push_tokens_own_insert on push_tokens for insert
  with check (user_id = auth.uid());

drop policy if exists push_tokens_own_delete on push_tokens;
create policy push_tokens_own_delete on push_tokens for delete
  using (user_id = auth.uid());

-- Trigger : à chaque insert dans notifications, on appelle l'Edge Function
-- "send-push" qui POST à l'Expo Push API. (La fonction est créée séparément.)
-- Pour l'instant on déclare juste la fonction utilitaire.
create or replace function notify_push_on_new_notification() returns trigger as $$
begin
  -- Cette fonction ne fait rien tant que l'Edge Function n'est pas hookée.
  -- L'Edge Function est appelée par un cron toutes les 30s qui scanne les
  -- notifications non-pushées (champ pushed_at).
  return new;
end;
$$ language plpgsql;

-- Track quand chaque notification a été push pour éviter les doublons.
alter table notifications add column if not exists pushed_at timestamptz;
