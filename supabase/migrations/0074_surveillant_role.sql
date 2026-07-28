-- E-KELASI · Rôle « surveillant »
--
-- Le surveillant a un espace minimal : uniquement le pointage des présences
-- des élèves. Il ne voit ni les notes, ni les finances, ni la direction.
--
-- ⚠️ Cette migration ne contient QUE l'ajout de la valeur d'enum : Postgres
-- interdit d'utiliser une valeur d'enum dans la même transaction que son ajout.
-- Tout ce qui s'appuie sur 'surveillant' est dans la migration 0075.

alter type user_role add value if not exists 'surveillant';
