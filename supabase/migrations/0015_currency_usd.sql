-- E-KELASI · Bascule la devise du projet de EUR vers USD.
-- Les montants en centimes (amount_cents) ne changent pas — 900 cents = $9.00.
-- Seul le code de devise est mis à jour, ainsi que les défauts de colonnes.

-- 1. Mettre à jour la table de prix de référence
update plan_prices set currency = 'USD' where currency = 'EUR';

-- 2. Aligner les rangs existants (test / seed) sur USD
update mobile_money_payments set currency = 'USD' where currency = 'EUR';
update subscriptions          set currency = 'USD' where currency = 'EUR';
update payments               set currency = 'USD' where currency = 'EUR';

-- 3. Changer le défaut des colonnes pour les futures insertions
alter table mobile_money_payments alter column currency set default 'USD';
alter table subscriptions          alter column currency set default 'USD';
alter table payments               alter column currency set default 'USD';
alter table plan_prices            alter column currency set default 'USD';
