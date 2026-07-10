-- Finance : échéance (date limite) au niveau du frais / de la rubrique.
-- Complète l'échéance déjà disponible par tranche (fee_installments.due_date) :
-- permet de fixer une date limite pour un frais sans le découper en tranches.

alter table fees add column if not exists due_date date;
