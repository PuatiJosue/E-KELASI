-- Emploi du temps — couleur personnalisée par cours.
-- La grille est affichée comme un calendrier hebdomadaire (jours en colonnes,
-- axe horaire vertical, blocs colorés dont la hauteur = durée du cours).
-- Chaque cours conserve son heure de début / fin propre (durées libres).

alter table timetable_slots add column if not exists color text;
