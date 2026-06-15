-- Lot E1 — Inscription / réinscription (flux parent + validation école).
-- Le parent envoie une demande de réinscription (passage/redoublant, infos
-- élève + parent mises à jour). L'école ajoute des champs, puis VALIDE en
-- signant (signature numérique) ou REJETTE avec un commentaire.

alter table schools add column if not exists current_year text;

create table if not exists reenrollments (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  student_id    uuid not null references students(id) on delete cascade,
  school_year   text not null,                 -- année visée, ex. '2026-2027'
  mode          text not null default 'promotion',  -- promotion | redoublant
  requested_class text,
  option        text,
  student_data  jsonb,                          -- infos élève (proposées par le parent)
  parent_data   jsonb,                          -- infos parent/tuteur (proposées)
  extra         jsonb,                          -- champs personnalisés ajoutés par l'école
  status        text not null default 'pending',-- pending | validated | rejected
  comment       text,                           -- motif de rejet
  signed_by     text,
  signature_url text,
  verify_code   text unique,
  created_by    uuid references profiles(id) on delete set null,  -- parent
  validated_by  uuid references profiles(id) on delete set null,  -- direction
  created_at    timestamptz not null default now(),
  decided_at    timestamptz
);

create index if not exists idx_reenroll_school_status on reenrollments(school_id, status);
create index if not exists idx_reenroll_student on reenrollments(student_id);

alter table reenrollments enable row level security;

-- Parents : lecture des réinscriptions de leurs enfants.
drop policy if exists reenroll_parent_read on reenrollments;
create policy reenroll_parent_read on reenrollments for select
  using (student_id in (select my_student_ids()) or is_super_admin());
