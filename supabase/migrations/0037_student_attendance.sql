-- Présence des élèves, pointée par le professeur depuis sa console.
-- Un statut par élève et par jour. Accès via service_role (comme staff_attendance).

create table if not exists student_attendance (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  student_id  uuid not null references students(id) on delete cascade,
  date        date not null,
  status      text not null,                 -- present, absent, late, justified
  comment     text,
  recorded_by uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (student_id, date)
);

create index if not exists idx_student_attendance_school_date on student_attendance(school_id, date);

alter table student_attendance enable row level security;
