-- E-KELASI · RLS policies for the "parent" role.
-- A parent can read:
--   - their own profile (already in 0002)
--   - their parent_links (which student is theirs)
--   - their linked students
--   - subjects of those students' schools
--   - grades of their student
--   - homework for their student's class
--   - conversations they participate in + messages in those convos
--   - their notifications (already in 0002)
--
-- Teachers' profiles must be readable so the app can show "from Mme Camara"
-- in message lists / grade rows.

-- Helper to get the student IDs a parent is linked to.
create or replace function my_student_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select student_id from parent_links where parent_id = auth.uid();
$$;

-- Helper to get the school IDs of those students.
create or replace function my_student_school_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select distinct s.school_id from students s
  join parent_links pl on pl.student_id = s.id
  where pl.parent_id = auth.uid();
$$;

-- Helper to get the class_names a parent's children belong to.
create or replace function my_student_classes() returns setof text
language sql stable security definer set search_path = public as $$
  select distinct s.class_name from students s
  join parent_links pl on pl.student_id = s.id
  where pl.parent_id = auth.uid() and s.class_name is not null;
$$;

-- ── parent_links ────────────────────────────────────────────────────
drop policy if exists parent_links_own_read on parent_links;
create policy parent_links_own_read on parent_links for select
  using (parent_id = auth.uid() or is_super_admin());

-- ── students ────────────────────────────────────────────────────────
drop policy if exists students_parent_read on students;
create policy students_parent_read on students for select
  using (id in (select my_student_ids()) or is_super_admin());

-- ── subjects ────────────────────────────────────────────────────────
drop policy if exists subjects_parent_read on subjects;
create policy subjects_parent_read on subjects for select
  using (school_id in (select my_student_school_ids()) or is_super_admin());

-- ── grades ──────────────────────────────────────────────────────────
drop policy if exists grades_parent_read on grades;
create policy grades_parent_read on grades for select
  using (student_id in (select my_student_ids()) or is_super_admin());

-- ── homework ────────────────────────────────────────────────────────
drop policy if exists homework_parent_read on homework;
create policy homework_parent_read on homework for select
  using (class_name in (select my_student_classes()) or is_super_admin());

-- ── conversations + participants + messages ─────────────────────────
drop policy if exists conv_participant_read on conversations;
create policy conv_participant_read on conversations for select
  using (
    id in (select conversation_id from conversation_participants where user_id = auth.uid())
    or is_super_admin()
  );

drop policy if exists conv_participants_self_read on conversation_participants;
create policy conv_participants_self_read on conversation_participants for select
  using (
    user_id = auth.uid()
    or conversation_id in (select conversation_id from conversation_participants where user_id = auth.uid())
    or is_super_admin()
  );

drop policy if exists messages_participant_read on messages;
create policy messages_participant_read on messages for select
  using (
    conversation_id in (select conversation_id from conversation_participants where user_id = auth.uid())
    or is_super_admin()
  );

-- ── profiles : on doit pouvoir lire le nom des profs / participants ─
-- Étend la policy profiles_self_read existante : on autorise aussi à
-- lire les profils des participants à nos conversations + profs de nos enfants.
drop policy if exists profiles_visible_to_me on profiles;
create policy profiles_visible_to_me on profiles for select
  using (
    id = auth.uid()
    or is_super_admin()
    -- profs / direction des écoles de mes enfants
    or id in (
      select user_id from school_staff
      where school_id in (select my_student_school_ids())
    )
    -- participants de mes conversations
    or id in (
      select user_id from conversation_participants
      where conversation_id in (select conversation_id from conversation_participants where user_id = auth.uid())
    )
  );

-- ── schools : permettre aux parents de lire le nom de l'école de leur enfant
-- (déjà géré par schools_member_read dans 0002, on vérifie qu'elle existe)
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'schools' and policyname = 'schools_member_read') then
    create policy schools_member_read on schools for select
      using (
        id in (select my_student_school_ids())
        or exists (select 1 from school_staff s where s.school_id = schools.id and s.user_id = auth.uid())
      );
  end if;
end $$;
