-- Lot D1 — Fiches du personnel (RH).
-- Registre de tout le personnel de l'école (pas seulement les comptes app) :
-- enseignants, surveillants, direction, ouvriers… Accès via service_role
-- (les actions serveur vérifient la direction).

create table if not exists staff_members (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references schools(id) on delete cascade,
  full_name      text not null,
  category       text not null default 'enseignant',  -- enseignant, surveillant, direction, ouvrier, autre
  phone          text,
  email          text,
  qualifications text,
  hire_date      date,
  status         text not null default 'active',       -- active, inactive
  photo_url      text,
  address        text,
  notes          text,
  linked_user_id uuid references profiles(id) on delete set null,
  created_at     timestamptz not null default now()
);

create index if not exists idx_staff_school_category on staff_members(school_id, category);

alter table staff_members enable row level security;

-- Bucket public pour les photos du personnel.
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
    values ('staff-photos', 'staff-photos', true, 3145728,
      array['image/jpeg', 'image/png', 'image/webp'])
    on conflict (id) do update set
      public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types
  $sql$;

  execute 'drop policy if exists "staff_photos_read" on storage.objects';
  execute $sql$
    create policy "staff_photos_read" on storage.objects for select
      using (bucket_id = 'staff-photos')
  $sql$;

  execute 'drop policy if exists "staff_photos_auth_write" on storage.objects';
  execute $sql$
    create policy "staff_photos_auth_write" on storage.objects for all
      using (bucket_id = 'staff-photos' and auth.uid() is not null)
      with check (bucket_id = 'staff-photos' and auth.uid() is not null)
  $sql$;

  raise notice 'staff-photos bucket installed (public)';
end $$;
