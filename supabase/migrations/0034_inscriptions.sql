-- Inscription d'un NOUVEL élève (flux parent → validation école → PDF).
-- Le parent remplit le dossier complet + documents ; l'école valide (preuve de
-- paiement) en signant ; un élève actif est créé ; confirmation PDF imprimable.

create table if not exists inscriptions (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  student_data  jsonb,                 -- identité, scolarité, adresse de l'élève
  parent_data   jsonb,                 -- parents, tuteur, urgence
  extra         jsonb,                 -- champs ajoutés par l'école
  photo_student_url text,
  photo_parent_url  text,
  documents_url text,                  -- fichier groupé (max 20 Mo)
  school_year   text,
  requested_class text,
  option        text,
  status        text not null default 'pending',  -- pending | validated | rejected
  comment       text,
  signed_by     text,
  signature_url text,
  verify_code   text unique,
  student_id    uuid references students(id) on delete set null,  -- créé à la validation
  created_by    uuid references profiles(id) on delete set null,  -- parent
  validated_by  uuid references profiles(id) on delete set null,  -- direction
  created_at    timestamptz not null default now(),
  decided_at    timestamptz
);

create index if not exists idx_inscriptions_school_status on inscriptions(school_id, status);
create index if not exists idx_inscriptions_creator on inscriptions(created_by);

alter table inscriptions enable row level security;

-- Parents : lecture de leurs propres demandes d'inscription.
drop policy if exists inscriptions_parent_read on inscriptions;
create policy inscriptions_parent_read on inscriptions for select
  using (created_by = auth.uid() or is_super_admin());

-- Bucket public pour les pièces (photos + documents groupés, 20 Mo).
do $$
begin
  if not exists (select 1 from information_schema.tables where table_schema='storage' and table_name='buckets') then
    raise notice 'storage not present'; return;
  end if;
  execute $sql$
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('inscription-docs', 'inscription-docs', true, 20971520,
      array['image/jpeg','image/png','image/webp','application/pdf'])
    on conflict (id) do update set public=excluded.public, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types
  $sql$;
  execute 'drop policy if exists "inscription_docs_read" on storage.objects';
  execute $sql$ create policy "inscription_docs_read" on storage.objects for select using (bucket_id='inscription-docs') $sql$;
  execute 'drop policy if exists "inscription_docs_write" on storage.objects';
  execute $sql$ create policy "inscription_docs_write" on storage.objects for all using (bucket_id='inscription-docs' and auth.uid() is not null) with check (bucket_id='inscription-docs' and auth.uid() is not null) $sql$;
end $$;
