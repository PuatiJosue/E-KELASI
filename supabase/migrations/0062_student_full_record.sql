-- E-KELASI · Fiche de renseignements complète de l'élève (côté école).
--
-- L'école saisit une fiche complète (modèle RDC) à l'ajout d'un élève :
-- identité, lieu de naissance, parents/responsable, province, observation,
-- date d'inscription à l'école, photo + documents joints.
-- (Le prénom/post-nom/nom, le sexe, la date de naissance, l'adresse, la classe
--  et la photo existent déjà : on ajoute ici le reste.)

alter table students add column if not exists birth_place       text;   -- Lieu de naissance
alter table students add column if not exists father_name        text;   -- Nom du père
alter table students add column if not exists mother_name        text;   -- Nom de la mère
alter table students add column if not exists guardian_name      text;   -- Nom du responsable
alter table students add column if not exists guardian_relation  text;   -- Degré de parenté
alter table students add column if not exists guardian_phone     text;   -- Téléphone du responsable
alter table students add column if not exists province_origin    text;   -- Province d'origine
alter table students add column if not exists observation        text;   -- Observation
alter table students add column if not exists enrolled_at        date;   -- Date d'inscription à l'école
alter table students add column if not exists documents          jsonb not null default '[]'::jsonb; -- [{name,url}]

-- ── Storage : bucket privé student-files (photo + documents joints) ───
-- Écriture/lecture par tout membre du personnel connecté ; URLs signées
-- côté client (le dossier n'est jamais public). Aligné sur staff-photos.
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
    values ('student-files', 'student-files', false, 10485760,
      array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
    on conflict (id) do update set
      public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types
  $sql$;

  -- READ : tout utilisateur connecté (direction / profs).
  execute 'drop policy if exists "student_files_read" on storage.objects';
  execute $sql$
    create policy "student_files_read" on storage.objects for select
      using (bucket_id = 'student-files' and auth.uid() is not null)
  $sql$;

  -- WRITE : tout utilisateur connecté (la direction ajoute les fiches).
  execute 'drop policy if exists "student_files_auth_write" on storage.objects';
  execute $sql$
    create policy "student_files_auth_write" on storage.objects for all
      using (bucket_id = 'student-files' and auth.uid() is not null)
      with check (bucket_id = 'student-files' and auth.uid() is not null)
  $sql$;

  raise notice 'student-files bucket installed (private)';
end $$;
