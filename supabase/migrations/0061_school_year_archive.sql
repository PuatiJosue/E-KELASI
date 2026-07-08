-- E-KELASI · Archivage de fin d'année, côté ÉCOLE (direction).
--
-- Permet à une direction de « commencer une nouvelle année » : toutes les
-- notes et tous les devoirs de son école enregistrés jusqu'ici sont marqués
-- archivés (archived_at) — RIEN n'est supprimé. Les vues courantes (bulletins,
-- appli parents, saisie prof) ne montrent que les lignes actives
-- (archived_at IS NULL), donc l'interface repart « propre » pour la rentrée,
-- tandis que l'historique reste consultable.
--
-- Les colonnes archived_at + index partiels existent déjà (0017). On ajoute
-- ici une fonction SCOPÉE À L'ÉCOLE, appelable par la direction concernée.

create or replace function archive_school_year(p_school_id uuid)
returns table(grades_count int, homework_count int)
language plpgsql security definer set search_path = public as $$
declare
  g int;
  h int;
begin
  -- Seule la direction de CETTE école (ou un super admin) peut archiver.
  if not (
    p_school_id in (select my_admin_school_ids())
    or is_super_admin()
  ) then
    raise exception 'forbidden: school_admin of this school only';
  end if;

  -- Notes des élèves de l'école.
  update grades
     set archived_at = now()
   where archived_at is null
     and student_id in (select id from students where school_id = p_school_id);
  get diagnostics g = row_count;

  -- Devoirs rattachés aux matières de l'école.
  update homework
     set archived_at = now()
   where archived_at is null
     and subject_id in (select id from subjects where school_id = p_school_id);
  get diagnostics h = row_count;

  return query select g, h;
end $$;

grant execute on function archive_school_year(uuid) to authenticated;
