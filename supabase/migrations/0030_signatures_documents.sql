-- Lot E2 — Signature numérique & documents officiels.
-- La direction enregistre sa signature (nom + image). Elle peut publier un
-- bulletin SIGNÉ aux parents → enregistré comme document officiel vérifiable.

alter table schools add column if not exists director_name text;
alter table schools add column if not exists signature_url text;

create table if not exists student_documents (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  student_id    uuid not null references students(id) on delete cascade,
  type          text not null default 'bulletin',
  title         text not null,
  period        text,
  signed_by     text,                 -- nom du signataire (snapshot)
  signature_url text,                  -- image de la signature (snapshot)
  verify_code   text not null unique,  -- code public de vérification
  data          jsonb,                 -- contenu figé (moyennes par matière…)
  issued_at     timestamptz not null default now(),
  created_by    uuid references profiles(id) on delete set null
);

create index if not exists idx_student_documents_student on student_documents(student_id, issued_at desc);

alter table student_documents enable row level security;

-- Parents : lecture des documents de leurs enfants.
drop policy if exists student_documents_parent_read on student_documents;
create policy student_documents_parent_read on student_documents for select
  using (student_id in (select my_student_ids()) or is_super_admin());

-- Bucket public pour les signatures (et autres visuels officiels).
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'storage' and table_name = 'buckets'
  ) then
    raise notice 'storage.buckets not present, skipping';
    return;
  end if;

  execute $sql$
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('signatures', 'signatures', true, 2097152,
      array['image/jpeg', 'image/png', 'image/webp'])
    on conflict (id) do update set
      public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types
  $sql$;

  execute 'drop policy if exists "signatures_read" on storage.objects';
  execute $sql$
    create policy "signatures_read" on storage.objects for select
      using (bucket_id = 'signatures')
  $sql$;

  execute 'drop policy if exists "signatures_auth_write" on storage.objects';
  execute $sql$
    create policy "signatures_auth_write" on storage.objects for all
      using (bucket_id = 'signatures' and auth.uid() is not null)
      with check (bucket_id = 'signatures' and auth.uid() is not null)
  $sql$;

  raise notice 'signatures bucket installed (public)';
end $$;
