-- Accès parent en lecture aux tables Finance v2 (app mobile).
--
-- Contexte : 0069 crée fees / fee_installments / fee_payments avec RLS activé
-- mais SANS aucune policy — donc service_role uniquement, par choix assumé.
-- Effet de bord : depuis la refonte v2, l'école encaisse dans `fee_payments`
-- alors que l'app parent lisait encore `student_fee_payments` (v1). Le parent
-- recevait bien la notification « Paiement enregistré » (envoyée par la v2)
-- mais son écran « Paiements » restait vide. On ouvre donc la lecture, limitée
-- aux enfants du parent, sur le modèle de 0051.
--
-- Les paiements annulés (soft delete) ne sont jamais exposés au parent : le
-- filtre vit dans la policy, pas seulement dans la requête, pour qu'aucun futur
-- écran ne puisse les laisser fuir.

-- Encaissements : uniquement les lignes des enfants du parent, hors annulés.
drop policy if exists fee_payments_parent_read on fee_payments;
create policy fee_payments_parent_read on fee_payments for select
  using (
    (student_id in (select my_student_ids()) and cancelled_at is null)
    or is_super_admin()
  );

-- Frais : nécessaires pour afficher le libellé du paiement (fee_payments ne
-- stocke pas de label, il vit dans fees.label). Portée : les écoles où le
-- parent a un enfant.
drop policy if exists fees_parent_read on fees;
create policy fees_parent_read on fees for select
  using (school_id in (select my_student_school_ids()) or is_super_admin());

-- Tranches : le nom de la tranche complète le libellé (« 3e tranche »).
drop policy if exists fee_installments_parent_read on fee_installments;
create policy fee_installments_parent_read on fee_installments for select
  using (school_id in (select my_student_school_ids()) or is_super_admin());
