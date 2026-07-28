-- E-KELASI · Encaissement manuel de l'abonnement école
--
-- Quand une école règle hors Stripe (Mobile Money, virement, espèces), on veut
-- garder la trace de la transaction : référence donnée par l'opérateur et note
-- libre. Sans ça, impossible de rapprocher un encaissement d'un relevé.

alter table school_payments add column if not exists reference text; -- TXN Mobile Money, n° de virement…
alter table school_payments add column if not exists note      text; -- remarque libre du super admin
