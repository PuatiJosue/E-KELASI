-- Journal de bord du professeur : trace, jour par jour, la matière enseignée,
-- la leçon donnée et un court résumé. Le prof gère ses propres entrées ;
-- la direction de l'école peut les consulter.

create table if not exists teacher_journal (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references profiles(id) on delete cascade,
  school_id   uuid references schools(id) on delete set null,
  entry_date  date not null,
  subject     text,
  class_name  text,
  lesson      text not null,
  summary     text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_teacher_journal_teacher
  on teacher_journal(teacher_id, entry_date desc);

alter table teacher_journal enable row level security;

-- Le prof gère (lit / écrit / supprime) uniquement son propre journal.
drop policy if exists tj_self_all on teacher_journal;
create policy tj_self_all on teacher_journal for all
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

-- La direction de l'école (et le super admin) peut consulter le journal.
drop policy if exists tj_admin_select on teacher_journal;
create policy tj_admin_select on teacher_journal for select
  using (school_id in (select my_admin_school_ids()) or is_super_admin());
