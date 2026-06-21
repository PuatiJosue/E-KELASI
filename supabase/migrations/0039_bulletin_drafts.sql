-- Bulletins encodés (brouillons) : le professeur encode le tableau
-- Branche/Max/Obtenu + place + mention et ENREGISTRE. L'école retrouve
-- l'encodage et reste seule à pouvoir ENVOYER le bulletin aux parents.
--
-- Un seul brouillon par élève et par trimestre (mis à jour à chaque save).
-- Accès uniquement via les server actions (service role) qui vérifient le
-- rôle de l'appelant (professeur ou direction de l'école de l'élève).

create table if not exists bulletin_drafts (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  student_id    uuid not null references students(id) on delete cascade,
  trimester     int not null,
  period        text,
  rows          jsonb not null default '[]'::jsonb,  -- [{branche, max, obtenu}]
  place         text,
  mention       text,
  total_max     numeric,
  total_obtenu  numeric,
  percentage    numeric,
  updated_by    uuid references profiles(id) on delete set null,
  updated_at    timestamptz not null default now(),
  unique (student_id, trimester)
);

create index if not exists idx_bulletin_drafts_school on bulletin_drafts(school_id);

-- RLS activé sans policy : accès réservé au service role (server actions).
alter table bulletin_drafts enable row level security;
