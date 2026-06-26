-- Équipe E-KELASI (super admins) :
--   • code d'accès pour ajouter un membre (il crée son compte sur /admin-signup) ;
--   • documents attachés par personne ;
--   • infos éditables (nom, téléphone, adresse) — colonnes déjà présentes sur profiles.

-- 1) Codes d'accès super admin (calqué sur school_access_codes / teacher_access_codes).
create table if not exists admin_access_codes (
  code         text primary key check (length(code) between 6 and 16),
  full_name    text not null,
  created_by   uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  redeemed_by  uuid references profiles(id),
  redeemed_at  timestamptz
);

create index if not exists idx_aac_pending
  on admin_access_codes(created_at) where redeemed_at is null;

alter table admin_access_codes enable row level security;

-- Seul le super admin gère ces codes ; la consommation publique (/admin-signup)
-- passe par le service_role côté serveur.
drop policy if exists aac_super_select on admin_access_codes;
create policy aac_super_select on admin_access_codes for select using (is_super_admin());

drop policy if exists aac_super_insert on admin_access_codes;
create policy aac_super_insert on admin_access_codes for insert with check (is_super_admin());

drop policy if exists aac_super_delete on admin_access_codes;
create policy aac_super_delete on admin_access_codes for delete using (is_super_admin());

-- 2) Documents attachés à un membre (profil).
create table if not exists profile_documents (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  name        text not null,
  url         text not null,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_profile_documents_profile on profile_documents(profile_id);

alter table profile_documents enable row level security;

-- Super admin : tout ; chacun peut lire ses propres documents.
drop policy if exists pdoc_super_all on profile_documents;
create policy pdoc_super_all on profile_documents for all
  using (is_super_admin())
  with check (is_super_admin());

drop policy if exists pdoc_self_select on profile_documents;
create policy pdoc_self_select on profile_documents for select
  using (profile_id = auth.uid());

-- 3) Bucket privé pour les documents des membres (PDF / images / docs).
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
      'profile-docs', 'profile-docs', false, 8388608,
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

  raise notice 'profile-docs bucket installed (private)';
end $$;
