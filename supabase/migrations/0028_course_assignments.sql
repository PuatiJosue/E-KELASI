-- Lot D2 — Attribution des cours.
-- Quel enseignant (fiche personnel) dispense quelle matière dans quelle classe,
-- avec le volume horaire hebdomadaire. Accès via service_role.

create table if not exists course_assignments (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  staff_id      uuid not null references staff_members(id) on delete cascade,
  subject_id    uuid not null references subjects(id) on delete cascade,
  class_name    text not null,
  weekly_hours  numeric(4,1) not null default 0,
  created_at    timestamptz not null default now(),
  unique (school_id, staff_id, subject_id, class_name)
);

create index if not exists idx_course_assign_school on course_assignments(school_id);

alter table course_assignments enable row level security;
