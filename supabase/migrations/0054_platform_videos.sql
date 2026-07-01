-- Vidéos PLATEFORME (équipe E-KLASS) → visibles par tous les parents, en plus
-- des vidéos de leur école. Écriture via service_role (actions super-admin).

create table if not exists platform_videos (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  url         text not null,          -- lien YouTube / Vimeo / fichier
  subject     text,
  description text,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_platform_videos_created on platform_videos(created_at desc);

alter table platform_videos enable row level security;

-- Lecture par tout utilisateur connecté (parents + personnel).
drop policy if exists platform_videos_read on platform_videos;
create policy platform_videos_read on platform_videos for select
  using (auth.uid() is not null);
