-- Matricule des élèves (format congolais « AA/CC/NNN »).
--   AA  = année d'inscription sur 2 chiffres (ex. 25 pour 2025)
--   CC  = code de classe sur 2 chiffres, propre à l'école
--   NNN = numéro d'ordre de l'élève dans la classe, sur 3 chiffres
-- Ex. : 25/01/001
-- Le matricule est généré automatiquement à l'insertion et unique par école.

alter table students add column if not exists matricule text;

-- 1) Génération automatique à l'insertion (toutes sources : inscription parent,
--    console école, import…). Si un matricule est fourni explicitement, on le garde.
create or replace function public.assign_student_matricule()
returns trigger
language plpgsql
as $$
declare
  v_yy  text := to_char(coalesce(new.created_at, now()), 'YY');
  v_cc  text;
  v_seq int;
begin
  if new.matricule is not null and new.matricule <> '' then
    return new;
  end if;

  -- Réutilise le code de classe si la classe possède déjà des matricules.
  select split_part(matricule, '/', 2)
    into v_cc
    from students
   where school_id = new.school_id
     and class_name is not distinct from new.class_name
     and matricule is not null
   limit 1;

  -- Sinon, attribue le prochain code de classe disponible pour l'école.
  if v_cc is null then
    select lpad((coalesce(max((split_part(matricule, '/', 2))::int), 0) + 1)::text, 2, '0')
      into v_cc
      from students
     where school_id = new.school_id
       and matricule is not null;
    if v_cc is null then
      v_cc := '01';
    end if;
  end if;

  -- Prochain numéro d'ordre dans ce code de classe.
  select coalesce(max((split_part(matricule, '/', 3))::int), 0) + 1
    into v_seq
    from students
   where school_id = new.school_id
     and split_part(matricule, '/', 2) = v_cc
     and matricule is not null;

  new.matricule := v_yy || '/' || v_cc || '/' || lpad(coalesce(v_seq, 1)::text, 3, '0');
  return new;
end;
$$;

drop trigger if exists trg_assign_student_matricule on students;
create trigger trg_assign_student_matricule
  before insert on students
  for each row
  execute function public.assign_student_matricule();

-- 2) Remplissage des élèves existants (sans matricule), classe par classe.
with ranked as (
  select
    id,
    to_char(coalesce(created_at, now()), 'YY') as yy,
    dense_rank() over (partition by school_id order by class_name nulls last) as cc_rank,
    row_number() over (partition by school_id, class_name order by full_name, created_at, id) as seq
  from students
  where matricule is null
)
update students s
   set matricule = r.yy || '/' || lpad(r.cc_rank::text, 2, '0') || '/' || lpad(r.seq::text, 3, '0')
  from ranked r
 where s.id = r.id;

-- 3) Unicité du matricule au sein d'une école.
create unique index if not exists students_school_matricule_uniq
  on students (school_id, matricule);
