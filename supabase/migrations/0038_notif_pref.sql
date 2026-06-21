-- Préférence de notifications par utilisateur.
--   'all'       : reçoit tous les push
--   'important' : reçoit seulement les notes, annonces école, abonnement et rappels
--                 (pas les devoirs ni les messages du quotidien)
--   'none'      : ne reçoit aucun push
--
-- Respectée par l'Edge Function send-push (filtre par kind selon la préférence).
-- L'utilisateur la modifie depuis l'app mobile (Profil > Notifications) ou
-- depuis les Paramètres web (carte Préférences).

alter table profiles
  add column if not exists notif_pref text not null default 'all'
  check (notif_pref in ('all', 'important', 'none'));

-- La policy profiles_self_update (migration 0002) autorise déjà l'utilisateur
-- à mettre à jour son propre profil ; le trigger lock_profile_role (0014) ne
-- verrouille que la colonne `role`, donc notif_pref est librement modifiable.
