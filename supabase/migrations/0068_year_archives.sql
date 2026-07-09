-- E-KELASI · Archivage de fin d'année — instantané durable par élève.
--
-- L'Option 1 « Archiver l'année » fige, pour chaque élève et par classe, un
-- dossier annuel complet (identité, situation financière, bulletins des 3
-- trimestres, présences, décision passe/redouble) dans `payload` (jsonb).
-- L'Option 2 « Nouvelle année » vide ensuite les tables live (finances,
-- présences, bulletins) : l'instantané ici tient lieu d'archive consultable.
-- Accès service_role uniquement (les actions serveur vérifient la direction) →
-- RLS activé sans policy, comme les tables finance.

create table if not exists student_year_archives (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  student_id  uuid not null references students(id) on delete cascade,
  school_year text not null,
  class_name  text,
  full_name   text,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  unique (school_id, student_id, school_year)
);
create index if not exists idx_year_archives_school_year_class on student_year_archives(school_id, school_year, class_name);
alter table student_year_archives enable row level security;
