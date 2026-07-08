-- E-KELASI · Finance — Barème des tranches (échéancier réutilisable).
--
-- installment_templates : le barème commun de l'école (ex. « 2ème tranche »,
-- période « Début janvier à fin février 2027 », montant 100 $). La direction
-- l'applique ensuite à une classe, en ajustant le montant par élève.
-- student_installments.period : mémorise la période (texte libre) sur la
-- tranche appliquée à l'élève.
-- Accès service_role uniquement (les actions serveur vérifient la direction).

alter table student_installments add column if not exists period text;

create table if not exists installment_templates (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  name        text not null,                       -- ex. « 2ème tranche »
  period      text,                                -- ex. « Début janvier à fin février 2027 (durant 2 mois) »
  amount      numeric(14,2) not null default 0,
  currency    text not null default 'CDF',
  position    int not null default 0,
  school_year text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_installment_templates_school on installment_templates(school_id);
alter table installment_templates enable row level security;
