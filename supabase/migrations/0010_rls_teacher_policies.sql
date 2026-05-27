-- E-KELASI · RLS policies pour le rôle "teacher".
-- Un prof peut :
--   - lire ses écoles (via school_staff)
--   - lire les étudiants de ses écoles
--   - lire les matières de ses écoles
--   - lire/insérer/update les notes des étudiants de ses écoles
--   - lire/insérer/update/delete les devoirs dans ses écoles
--   - lire/insérer messages dans ses conversations

-- Helper : les écoles où je suis prof
create or replace function my_teacher_school_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select school_id from school_staff where user_id = auth.uid();
$$;

-- ── schools ─────────────────────────────────────────────────────────
-- Pour la sidebar prof : voir mon école
drop policy if exists schools_teacher_read on schools;
create policy schools_teacher_read on schools for select
  using (id in (select my_teacher_school_ids()));

-- ── students ────────────────────────────────────────────────────────
drop policy if exists students_teacher_read on students;
create policy students_teacher_read on students for select
  using (school_id in (select my_teacher_school_ids()) or is_super_admin());

-- ── subjects ────────────────────────────────────────────────────────
drop policy if exists subjects_teacher_read on subjects;
create policy subjects_teacher_read on subjects for select
  using (school_id in (select my_teacher_school_ids()) or is_super_admin());

-- ── grades ──────────────────────────────────────────────────────────
drop policy if exists grades_teacher_read on grades;
create policy grades_teacher_read on grades for select
  using (
    student_id in (
      select s.id from students s where s.school_id in (select my_teacher_school_ids())
    )
    or is_super_admin()
  );

drop policy if exists grades_teacher_insert on grades;
create policy grades_teacher_insert on grades for insert
  with check (
    teacher_id = auth.uid()
    and student_id in (
      select s.id from students s where s.school_id in (select my_teacher_school_ids())
    )
  );

drop policy if exists grades_teacher_update on grades;
create policy grades_teacher_update on grades for update
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

drop policy if exists grades_teacher_delete on grades;
create policy grades_teacher_delete on grades for delete
  using (teacher_id = auth.uid());

-- ── homework ────────────────────────────────────────────────────────
drop policy if exists homework_teacher_read on homework;
create policy homework_teacher_read on homework for select
  using (
    subject_id in (
      select s.id from subjects s where s.school_id in (select my_teacher_school_ids())
    )
    or is_super_admin()
  );

drop policy if exists homework_teacher_insert on homework;
create policy homework_teacher_insert on homework for insert
  with check (
    teacher_id = auth.uid()
    and subject_id in (
      select s.id from subjects s where s.school_id in (select my_teacher_school_ids())
    )
  );

drop policy if exists homework_teacher_update on homework;
create policy homework_teacher_update on homework for update
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

drop policy if exists homework_teacher_delete on homework;
create policy homework_teacher_delete on homework for delete
  using (teacher_id = auth.uid());

-- ── notifications côté élève (insertable par le prof concerné) ──────
drop policy if exists notifications_teacher_insert on notifications;
create policy notifications_teacher_insert on notifications for insert
  with check (
    -- Le prof peut insérer une notif pour un parent dont l'enfant est dans son école
    user_id in (
      select pl.parent_id from parent_links pl
      join students s on s.id = pl.student_id
      where s.school_id in (select my_teacher_school_ids())
    )
  );

-- ── profiles visibles : profs voient parents de leurs élèves + autres profs ──
-- (étend la policy profiles_visible_to_me de 0005)
drop policy if exists profiles_visible_to_me on profiles;
create policy profiles_visible_to_me on profiles for select
  using (
    id = auth.uid()
    or is_super_admin()
    -- Profs/staff de mes écoles (que je sois parent ou prof)
    or id in (
      select user_id from school_staff
      where school_id in (select my_student_school_ids())
         or school_id in (select my_teacher_school_ids())
    )
    -- Participants de mes conversations
    or id in (
      select user_id from conversation_participants
      where conversation_id in (select my_conversation_ids())
    )
    -- Parents des élèves de mes écoles (côté prof)
    or id in (
      select pl.parent_id from parent_links pl
      join students s on s.id = pl.student_id
      where s.school_id in (select my_teacher_school_ids())
    )
  );
