-- Attribution des cours : section / option de la classe (système congolais).
-- Ex. Scientifique, Commercial et gestion, Littéraire… Renseigné par l'école
-- au moment d'affecter un prof à une classe ; modifiable à tout moment.
-- Reste synchronisé avec les options des élèves (mêmes intitulés).

alter table course_assignments add column if not exists option text;
