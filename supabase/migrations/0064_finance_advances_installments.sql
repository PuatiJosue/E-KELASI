-- E-KELASI · Finance — Avances & Acomptes + Tranches & Échéances.
--
-- Avances/acomptes : crédits versés d'avance par le parent (déduits du reste).
-- Tranches/échéances : découpage d'une rubrique en versements datés, chacun
-- marqué payé ou non (retard si la date est dépassée sans paiement).
-- Accès service_role uniquement (les actions serveur vérifient la direction).

create table if not exists student_advances (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  student_id  uuid not null references students(id) on delete cascade,
  category_id uuid references fee_categories(id) on delete set null,
  amount      numeric(14,2) not null default 0,
  currency    text not null default 'CDF',
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_student_advances_school_student on student_advances(school_id, student_id);
alter table student_advances enable row level security;

create table if not exists student_installments (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  student_id  uuid not null references students(id) on delete cascade,
  category_id uuid references fee_categories(id) on delete set null,
  label       text,
  amount      numeric(14,2) not null default 0,
  currency    text not null default 'CDF',
  due_date    date,
  paid_at     date,                                 -- null = pas encore payée
  created_at  timestamptz not null default now()
);
create index if not exists idx_student_installments_school_student on student_installments(school_id, student_id);
create index if not exists idx_student_installments_due on student_installments(school_id, due_date) where paid_at is null;
alter table student_installments enable row level security;
