-- E-KELASI · Dossier élève : nouvelles rubriques
--
-- 1) Rubriques fixes ajoutées à la fiche : Santé & urgence, Scolarité antérieure.
-- 2) Rubriques libres : l'école définit ses propres champs (« Groupe sanguin »,
--    « N° matricule interne », « Bourse »…) stockés en JSON [{label, value}].
--    Aucun changement de schéma nécessaire quand l'école veut un champ de plus.

-- ── Santé & contact d'urgence ────────────────────────────────────────
alter table students add column if not exists blood_group             text; -- Groupe sanguin
alter table students add column if not exists allergies               text; -- Allergies connues
alter table students add column if not exists medical_notes           text; -- Maladies chroniques / traitement
alter table students add column if not exists emergency_contact_name  text; -- Personne à prévenir
alter table students add column if not exists emergency_contact_phone text; -- Téléphone d'urgence

-- ── Scolarité antérieure ─────────────────────────────────────────────
alter table students add column if not exists previous_school text; -- École fréquentée avant
alter table students add column if not exists previous_class  text; -- Dernière classe suivie

-- ── Rubriques libres définies par l'école ────────────────────────────
-- Format : [{"label": "Groupe sanguin", "value": "O+"}, …]
alter table students add column if not exists extra_fields jsonb not null default '[]'::jsonb;
