-- E-KELASI · Codes d'accès professeurs
--
-- L'école génère un code court (8 chars) qu'elle remet en main propre au prof.
-- Le prof utilise ce code sur /teacher-signup pour créer son compte avec
-- son propre email + mot de passe. Une fois le code consommé, il est marqué
-- comme tel et lié à l'auth user créé.

-- Adresse facultative du prof (entrée par l'école au moment de générer le code).
alter table profiles add column if not exists address text;

create table if not exists teacher_access_codes (
  code         text primary key check (length(code) between 6 and 16),
  school_id    uuid not null references schools(id) on delete cascade,
  full_name    text not null,
  address      text,
  created_by   uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  redeemed_by  uuid references profiles(id),
  redeemed_at  timestamptz
);

create index if not exists idx_tac_school_pending
  on teacher_access_codes(school_id) where redeemed_at is null;

alter table teacher_access_codes enable row level security;

-- school_admin / super_admin de l'école : lit, insère, supprime les codes
-- (suppression utile si l'école veut révoquer un code non utilisé).
drop policy if exists tac_admin_select on teacher_access_codes;
create policy tac_admin_select on teacher_access_codes for select
  using (school_id in (select my_admin_school_ids()) or is_super_admin());

drop policy if exists tac_admin_insert on teacher_access_codes;
create policy tac_admin_insert on teacher_access_codes for insert
  with check (school_id in (select my_admin_school_ids()) or is_super_admin());

drop policy if exists tac_admin_delete on teacher_access_codes;
create policy tac_admin_delete on teacher_access_codes for delete
  using (school_id in (select my_admin_school_ids()) or is_super_admin());

-- Pas de policy UPDATE publique : la consommation passe par le service_role
-- depuis le serveur (lors de /teacher-signup). Les RLS n'autorisent personne
-- à modifier les codes côté client.

-- Note : la lecture publique pour valider un code se fait via le serveur
-- (service_role) — on évite ainsi d'exposer la liste des codes valides.
