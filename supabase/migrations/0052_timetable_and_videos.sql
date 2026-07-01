-- Emploi du temps (créneaux par classe) + vidéos des cours.
-- Saisis par la direction (écriture via service_role dans les actions serveur).
-- Lus par le personnel de l'école et par les parents (leurs écoles uniquement).

-- ── Emploi du temps ───────────────────────────────────────────────────
create table if not exists timetable_slots (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references schools(id) on delete cascade,
  class_name text not null,
  option     text,
  day        int  not null,           -- 1 = Lundi … 7 = Dimanche
  start_time text not null,           -- "08:00"
  end_time   text not null,           -- "09:40"
  subject    text not null,
  teacher    text,
  room       text,
  created_at timestamptz not null default now()
);
create index if not exists idx_timetable_school_class on timetable_slots(school_id, class_name);
alter table timetable_slots enable row level security;

drop policy if exists timetable_parent_read on timetable_slots;
create policy timetable_parent_read on timetable_slots for select
  using (school_id in (select my_student_school_ids()) or is_super_admin());

drop policy if exists timetable_staff_read on timetable_slots;
create policy timetable_staff_read on timetable_slots for select
  using (exists (select 1 from school_staff s where s.school_id = timetable_slots.school_id and s.user_id = auth.uid()));

-- ── Vidéos des cours ──────────────────────────────────────────────────
create table if not exists course_videos (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  class_name  text,                   -- null = toutes les classes de l'école
  subject     text,
  title       text not null,
  url         text not null,          -- lien YouTube / Vimeo / fichier
  description text,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_course_videos_school on course_videos(school_id, created_at desc);
alter table course_videos enable row level security;

drop policy if exists course_videos_parent_read on course_videos;
create policy course_videos_parent_read on course_videos for select
  using (school_id in (select my_student_school_ids()) or is_super_admin());

drop policy if exists course_videos_staff_read on course_videos;
create policy course_videos_staff_read on course_videos for select
  using (exists (select 1 from school_staff s where s.school_id = course_videos.school_id and s.user_id = auth.uid()));
