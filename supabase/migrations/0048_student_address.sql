-- Adresse de résidence de l'élève.
-- Saisie par le parent lors de l'enregistrement rapide de l'enfant
-- (app mobile → « Enregistrer mon enfant ») ; détail important souvent oublié.
alter table students add column if not exists address text;
