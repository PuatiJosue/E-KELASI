-- Lot C — Annonces / événements de l'école vers les parents.
-- La direction publie une annonce → visible par tous les parents de l'école
-- (app mobile) + une notification est créée pour chacun.

create table if not exists announcements (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  title       text not null,
  body        text not null,
  event_date  date,                       -- optionnel : date de l'événement
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_announcements_school on announcements(school_id, created_at desc);

alter table announcements enable row level security;

-- Parents : lecture des annonces des écoles de leurs enfants.
drop policy if exists announcements_parent_read on announcements;
create policy announcements_parent_read on announcements for select
  using (
    school_id in (select my_student_school_ids())
    or is_super_admin()
  );

-- Personnel : lecture des annonces de son école.
drop policy if exists announcements_staff_read on announcements;
create policy announcements_staff_read on announcements for select
  using (
    exists (
      select 1 from school_staff s
      where s.school_id = announcements.school_id and s.user_id = auth.uid()
    )
  );

-- Écriture : via service_role (actions serveur qui vérifient la direction).
