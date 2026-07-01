-- Emploi du temps : brouillon vs publié.
-- Les créneaux sont en brouillon par défaut ; ils ne deviennent visibles par
-- les parents que lorsque l'école publie l'emploi du temps de la classe.

alter table timetable_slots add column if not exists published boolean not null default false;

create index if not exists idx_timetable_published on timetable_slots(school_id, class_name, published);
