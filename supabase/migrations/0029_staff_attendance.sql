-- Lot D3 — Suivi des absences du personnel (enseignants…).
-- Registre numérique : un statut par membre et par jour. Sert au rapport de
-- régularité (primes de performance). Accès via service_role.

create table if not exists staff_attendance (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  staff_id    uuid not null references staff_members(id) on delete cascade,
  date        date not null,
  status      text not null,                 -- present, absent, late, justified
  comment     text,
  recorded_by uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (school_id, staff_id, date)
);

create index if not exists idx_staff_attendance_school_date on staff_attendance(school_id, date);

alter table staff_attendance enable row level security;
