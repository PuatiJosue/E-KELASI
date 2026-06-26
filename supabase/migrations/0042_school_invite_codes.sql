-- Invitation d'une école par le super admin :
--   • code d'accès (comme les profs) : l'école crée elle-même ses identifiants
--     sur /school-signup avec le code remis par la plateforme ;
--   • notes libres sur la fiche école ;
--   • documents attachés (PDF / image / doc) stockés dans un bucket dédié.

-- 1) Notes libres sur l'école.
alter table schools add column if not exists notes text;

-- 2) Codes d'accès école (calqué sur teacher_access_codes).
create table if not exists school_access_codes (
  code          text primary key check (length(code) between 6 and 16),
  school_id     uuid not null references schools(id) on delete cascade,
  director_name text,
  created_by    uuid references profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  redeemed_by   uuid references profiles(id),
  redeemed_at   timestamptz
);

create index if not exists idx_sac_school_pending
  on school_access_codes(school_id) where redeemed_at is null;

alter table school_access_codes enable row level security;

-- Seul le super admin gère ces codes. La validation/consommation publique
-- (page /school-signup) passe par le service_role côté serveur.
drop policy if exists sac_super_select on school_access_codes;
create policy sac_super_select on school_access_codes for select
  using (is_super_admin());

drop policy if exists sac_super_insert on school_access_codes;
create policy sac_super_insert on school_access_codes for insert
  with check (is_super_admin());

drop policy if exists sac_super_delete on school_access_codes;
create policy sac_super_delete on school_access_codes for delete
  using (is_super_admin());

-- 3) Documents attachés à une école.
create table if not exists school_documents (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  name        text not null,
  url         text not null,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_school_documents_school on school_documents(school_id);

alter table school_documents enable row level security;

-- Super admin : tout ; direction de l'école : lit les documents de SON école.
drop policy if exists sdoc_super_all on school_documents;
create policy sdoc_super_all on school_documents for all
  using (is_super_admin())
  with check (is_super_admin());

drop policy if exists sdoc_admin_select on school_documents;
create policy sdoc_admin_select on school_documents for select
  using (school_id in (select my_admin_school_ids()));

-- 4) Bucket privé pour les documents école (PDF / images / docs courants).
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'storage' and table_name = 'buckets'
  ) then
    raise notice 'storage.buckets not present, skipping (run on Supabase Cloud)';
    return;
  end if;

  execute $sql$
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'school-docs', 'school-docs', false, 8388608,
      array[
        'application/pdf',
        'image/png', 'image/jpeg', 'image/webp', 'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
    )
    on conflict (id) do update set
      public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types
  $sql$;

  -- Aucune policy publique : seul le service_role écrit, la lecture se fait
  -- via des URLs signées générées côté serveur.
  raise notice 'school-docs bucket installed (private)';
end $$;
