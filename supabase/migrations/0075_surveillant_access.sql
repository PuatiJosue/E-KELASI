-- E-KELASI · Rattachement et code d'accès du surveillant
-- (suite de 0074, qui a ajouté la valeur d'enum 'surveillant').

-- ── 1. school_staff accepte le rôle surveillant ──────────────────────
alter table school_staff drop constraint if exists school_staff_role_check;
alter table school_staff add constraint school_staff_role_check
  check (role in ('school_admin', 'teacher', 'surveillant'));

-- ── 2. Les codes d'accès portent le rôle qu'ils ouvrent ──────────────
-- La table sert aux profs depuis 0018 ; on la réutilise pour les surveillants
-- (même flux : la direction génère un code depuis la fiche du personnel).
alter table teacher_access_codes add column if not exists role text not null default 'teacher';
alter table teacher_access_codes drop constraint if exists teacher_access_codes_role_check;
alter table teacher_access_codes add constraint teacher_access_codes_role_check
  check (role in ('teacher', 'surveillant'));

-- ── 3. Écoles où l'utilisateur est surveillant ───────────────────────
create or replace function my_surveillant_school_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select school_id from school_staff
  where user_id = auth.uid()
    and role = 'surveillant';
$$;

-- ── 4. Lecture des élèves de son école ───────────────────────────────
-- Le pointage lui-même passe par le service_role côté serveur (comme pour la
-- direction) ; cette policy couvre les lectures faites avec la session.
drop policy if exists students_surveillant_read on students;
create policy students_surveillant_read on students for select
  using (school_id in (select my_surveillant_school_ids()));

-- Note : student_attendance reste sans policy publique — toutes les écritures
-- passent par les actions serveur en service_role, qui vérifient le rôle.
