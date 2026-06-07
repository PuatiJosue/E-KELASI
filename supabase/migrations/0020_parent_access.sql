-- Phase 1 du modèle B2B : l'école contrôle l'accès des parents.
-- Par défaut un parent est 'active' (l'app reste libre) ; l'école peut le
-- passer à 'blocked' (impayé) → l'app parent affiche "accès suspendu".

alter table parent_links
  add column if not exists access_status text not null default 'active';

-- Contrainte de valeurs (ajoutée séparément pour rester idempotent).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'parent_links_access_status_chk'
  ) then
    alter table parent_links
      add constraint parent_links_access_status_chk
      check (access_status in ('active', 'blocked'));
  end if;
end $$;

-- Index pour filtrer rapidement les parents bloqués d'une école.
create index if not exists idx_parent_links_access on parent_links(access_status);
