-- Identité du personnel décomposée (convention RDC) : Nom · Post-nom · Prénom.
-- full_name reste renseigné (dérivé de ces trois champs côté serveur) pour rester
-- compatible avec les affichages existants (listes, avatars, recherche).

alter table staff_members add column if not exists last_name   text; -- Nom
alter table staff_members add column if not exists middle_name text; -- Post-nom
alter table staff_members add column if not exists first_name  text; -- Prénom
