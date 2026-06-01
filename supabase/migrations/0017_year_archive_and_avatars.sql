-- E-KELASI · Archive de fin d'année + photo de l'enfant
--
-- 1. Marqueur d'archivage sur grades/homework : permet à chaque rentrée
--    de "remettre à zéro" l'interface des parents sans rien supprimer.
-- 2. Photo de l'enfant : bucket privé + RPC pour qu'un parent ne puisse
--    mettre à jour QUE l'avatar de SON enfant.

-- ── 1. Archive annuelle ──────────────────────────────────────────────
alter table grades   add column if not exists archived_at timestamptz;
alter table homework add column if not exists archived_at timestamptz;

-- Index partiels : on ne paie le coût que sur les lignes actives.
create index if not exists idx_grades_active
  on grades(student_id, graded_at desc) where archived_at is null;
create index if not exists idx_homework_active
  on homework(class_name, due_at desc) where archived_at is null;

-- Fonction d'archivage : un seul appel, super_admin uniquement.
-- Tout ce qui est antérieur à `cutoff` est marqué archivé.
create or replace function archive_year(cutoff timestamptz)
returns table(grades_count int, homework_count int)
language plpgsql security definer set search_path = public as $$
declare
  g int;
  h int;
begin
  if not is_super_admin() then
    raise exception 'forbidden: super_admin only';
  end if;

  update grades
     set archived_at = now()
   where graded_at < cutoff and archived_at is null;
  get diagnostics g = row_count;

  update homework
     set archived_at = now()
   where due_at < cutoff and archived_at is null;
  get diagnostics h = row_count;

  return query select g, h;
end $$;

-- ── 2. Photo de l'enfant ─────────────────────────────────────────────
alter table students add column if not exists avatar_url text;

-- RPC : un parent ne peut modifier QUE l'avatar de SON enfant.
-- (RLS sur students.update n'autorise pas les parents : on passe par cette
--  fonction security-definer qui vérifie le lien parent-enfant.)
create or replace function set_student_avatar(p_student_id uuid, p_avatar_url text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from parent_links
    where parent_id = auth.uid() and student_id = p_student_id
  ) then
    raise exception 'forbidden: not a parent of this student';
  end if;
  if length(coalesce(p_avatar_url, '')) > 1024 then
    raise exception 'avatar_url too long';
  end if;
  update students set avatar_url = p_avatar_url where id = p_student_id;
end $$;

-- ── Storage : bucket privé student-avatars ───────────────────────────
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
    values ('student-avatars', 'student-avatars', false, 2097152,
      array['image/jpeg', 'image/png', 'image/webp'])
    on conflict (id) do update set
      public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types
  $sql$;

  -- READ : tout utilisateur connecté (les profs et la direction veulent voir).
  execute 'drop policy if exists "student_avatars_read" on storage.objects';
  execute $sql$
    create policy "student_avatars_read" on storage.objects for select
      using (bucket_id = 'student-avatars' and auth.uid() is not null)
  $sql$;

  -- WRITE : seul un parent lié à l'élève (folder name = student_id).
  execute 'drop policy if exists "student_avatars_parent_write" on storage.objects';
  execute $sql$
    create policy "student_avatars_parent_write" on storage.objects for all
      using (
        bucket_id = 'student-avatars'
        and exists (
          select 1 from parent_links
          where parent_id = auth.uid()
            and student_id::text = (storage.foldername(name))[1]
        )
      )
      with check (
        bucket_id = 'student-avatars'
        and exists (
          select 1 from parent_links
          where parent_id = auth.uid()
            and student_id::text = (storage.foldername(name))[1]
        )
      )
  $sql$;

  raise notice 'student-avatars bucket installed (private)';
end $$;
