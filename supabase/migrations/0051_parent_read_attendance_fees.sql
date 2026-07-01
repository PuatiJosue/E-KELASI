-- Accès parent en lecture (app mobile) : présences et frais de leurs enfants.
-- Jusqu'ici ces tables étaient en service_role only ; on autorise le parent
-- à LIRE uniquement les lignes de ses propres enfants (my_student_ids()).

alter table student_attendance enable row level security;
drop policy if exists student_attendance_parent_read on student_attendance;
create policy student_attendance_parent_read on student_attendance for select
  using (student_id in (select my_student_ids()) or is_super_admin());

alter table student_fee_payments enable row level security;
drop policy if exists student_fee_parent_read on student_fee_payments;
create policy student_fee_parent_read on student_fee_payments for select
  using (student_id in (select my_student_ids()) or is_super_admin());
