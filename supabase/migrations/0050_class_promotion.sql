-- Passage de classe assisté (promotion en lot).
-- 1) Autorise le statut « graduated » (élève sortant / fin de cycle).
-- 2) Conserve l'ancienne classe pour permettre l'annulation d'une promotion.

alter table students drop constraint if exists students_status_chk;
alter table students add constraint students_status_chk
  check (status in ('pending', 'active', 'rejected', 'graduated'));

alter table students add column if not exists previous_class  text;
alter table students add column if not exists previous_option text;
alter table students add column if not exists promoted_at     timestamptz;
