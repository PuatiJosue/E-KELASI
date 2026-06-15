-- Option / filière de l'élève (système congolais).
-- Obligatoire à partir de la 8e année (éducation de base) et en humanités :
-- Sciences, Technique, Commercial et gestion, Pédagogie, Littéraire,
-- Nutrition, Arts et métiers, etc. NULL pour le primaire / 7e année.
alter table students add column if not exists option text;
