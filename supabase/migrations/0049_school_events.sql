-- Agenda de la direction — événements internes de l'école affichés sur la
-- vue d'ensemble (« Aujourd'hui »). Écriture via service_role (actions serveur
-- qui vérifient que l'appelant est bien la direction de l'école).

create table if not exists school_events (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  title       text not null,
  location    text,
  starts_at   timestamptz not null,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_school_events_school_start on school_events(school_id, starts_at);

alter table school_events enable row level security;

-- Personnel : lecture des événements de son école.
drop policy if exists school_events_staff_read on school_events;
create policy school_events_staff_read on school_events for select
  using (
    exists (
      select 1 from school_staff s
      where s.school_id = school_events.school_id and s.user_id = auth.uid()
    )
    or is_super_admin()
  );

-- Écriture : via service_role uniquement (actions serveur côté direction).
