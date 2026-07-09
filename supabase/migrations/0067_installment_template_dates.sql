-- E-KELASI · Finance — Dates d'échéance sur le barème des tranches.
--
-- Le barème d'une tranche porte désormais une période explicite « du … au … »
-- (date_from / date_to) en plus du texte libre. La facture de type « tranche »
-- se choisit dans ce barème et hérite de ces dates + montant.

alter table installment_templates add column if not exists date_from date;
alter table installment_templates add column if not exists date_to   date;
