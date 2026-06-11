-- Enregistrement de l'enfant par le PARENT + validation par l'ÉCOLE.
-- Le parent saisit son enfant (nom congolais, sexe, classe…) → statut 'pending'.
-- L'école vérifie/valide → statut 'active' → le parent voit le dashboard.

-- ── students : nom congolais (3 parties), sexe, statut, créateur ──────
alter table students add column if not exists first_name text;   -- prénom
alter table students add column if not exists middle_name text;  -- post-nom
alter table students add column if not exists last_name text;    -- nom
alter table students add column if not exists sex text;          -- 'M' / 'F'
alter table students add column if not exists created_by uuid references profiles(id) on delete set null;
alter table students add column if not exists status text not null default 'active';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'students_sex_chk') then
    alter table students add constraint students_sex_chk check (sex is null or sex in ('M', 'F'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'students_status_chk') then
    alter table students add constraint students_status_chk check (status in ('pending', 'active', 'rejected'));
  end if;
end $$;

create index if not exists idx_students_school_status on students(school_id, status);

-- ── schools : coordonnées + contact (section "Contact École") ─────────
alter table schools add column if not exists commune text;
alter table schools add column if not exists quartier text;
alter table schools add column if not exists address text;
alter table schools add column if not exists phone text;
