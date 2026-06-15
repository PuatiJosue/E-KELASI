-- Annonces PLATEFORME (super-admin E-KELASI) → parents et/ou écoles.
-- Les écoles lisent cette table (bannière console). Les parents sont touchés
-- via la table notifications (lue par l'app actuelle, sans nouveau build).

create table if not exists platform_announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null,
  audience    text not null default 'all',  -- all | parents | schools
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_platform_announcements_created on platform_announcements(created_at desc);

alter table platform_announcements enable row level security;

-- Lecture par tout utilisateur connecté (le filtrage d'audience se fait à l'affichage).
drop policy if exists platform_announcements_read on platform_announcements;
create policy platform_announcements_read on platform_announcements for select
  using (auth.uid() is not null);
