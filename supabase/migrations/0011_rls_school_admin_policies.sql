-- E-KELASI · RLS policies pour le rôle "school_admin" (direction).
-- Un school_admin peut TOUT faire au sein de son école :
--   - gérer les profs (school_staff)
--   - gérer les élèves
--   - gérer les matières
--   - lire toutes les notes/devoirs de son école
--   - lire les conversations
--   - update son école (branding, nom)

-- Helper : les écoles où je suis school_admin
create or replace function my_admin_school_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select school_id from school_staff
  where user_id = auth.uid()
    and role = 'school_admin';
$$;

-- ── schools : update branding/nom de son école ─────────────────────
drop policy if exists schools_admin_update on schools;
create policy schools_admin_update on schools for update
  using (id in (select my_admin_school_ids()))
  with check (id in (select my_admin_school_ids()));

-- Lecture (déjà géré par schools_member_read en 0002, on s'assure)
drop policy if exists schools_admin_read on schools;
create policy schools_admin_read on schools for select
  using (id in (select my_admin_school_ids()));

-- ── school_staff : ajouter/retirer des profs ───────────────────────
drop policy if exists school_staff_read on school_staff;
create policy school_staff_read on school_staff for select
  using (
    user_id = auth.uid()
    or school_id in (select my_admin_school_ids())
    or school_id in (select my_teacher_school_ids())
    or is_super_admin()
  );

drop policy if exists school_staff_admin_insert on school_staff;
create policy school_staff_admin_insert on school_staff for insert
  with check (school_id in (select my_admin_school_ids()) or is_super_admin());

drop policy if exists school_staff_admin_delete on school_staff;
create policy school_staff_admin_delete on school_staff for delete
  using (school_id in (select my_admin_school_ids()) or is_super_admin());

-- ── students : direction peut tout faire dans son école ─────────────
drop policy if exists students_admin_all on students;
create policy students_admin_all on students for all
  using (school_id in (select my_admin_school_ids()) or is_super_admin())
  with check (school_id in (select my_admin_school_ids()) or is_super_admin());

-- ── subjects ────────────────────────────────────────────────────────
drop policy if exists subjects_admin_all on subjects;
create policy subjects_admin_all on subjects for all
  using (school_id in (select my_admin_school_ids()) or is_super_admin())
  with check (school_id in (select my_admin_school_ids()) or is_super_admin());

-- ── grades : direction lit toutes les notes de son école ────────────
drop policy if exists grades_admin_read on grades;
create policy grades_admin_read on grades for select
  using (
    student_id in (
      select s.id from students s where s.school_id in (select my_admin_school_ids())
    )
    or is_super_admin()
  );

-- ── homework : direction lit tous les devoirs de son école ──────────
drop policy if exists homework_admin_read on homework;
create policy homework_admin_read on homework for select
  using (
    subject_id in (
      select s.id from subjects s where s.school_id in (select my_admin_school_ids())
    )
    or is_super_admin()
  );

-- ── parent_links : direction lit les liens parent-enfant ────────────
drop policy if exists parent_links_admin_read on parent_links;
create policy parent_links_admin_read on parent_links for select
  using (
    student_id in (
      select s.id from students s where s.school_id in (select my_admin_school_ids())
    )
    or parent_id = auth.uid()
    or is_super_admin()
  );

-- ── conversations : direction lit toutes les conversations de son école
drop policy if exists conv_admin_read on conversations;
create policy conv_admin_read on conversations for select
  using (
    school_id in (select my_admin_school_ids())
    or id in (select my_conversation_ids())
    or is_super_admin()
  );

-- ── profiles : direction voit profs + parents de son école ──────────
-- (étend profiles_visible_to_me)
drop policy if exists profiles_visible_to_me on profiles;
create policy profiles_visible_to_me on profiles for select
  using (
    id = auth.uid()
    or is_super_admin()
    or id in (
      select user_id from school_staff
      where school_id in (select my_student_school_ids())
         or school_id in (select my_teacher_school_ids())
         or school_id in (select my_admin_school_ids())
    )
    or id in (
      select user_id from conversation_participants
      where conversation_id in (select my_conversation_ids())
    )
    or id in (
      select pl.parent_id from parent_links pl
      join students s on s.id = pl.student_id
      where s.school_id in (select my_teacher_school_ids())
         or s.school_id in (select my_admin_school_ids())
    )
  );
