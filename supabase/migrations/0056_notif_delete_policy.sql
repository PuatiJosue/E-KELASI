-- Permet au parent de supprimer ses propres notifications depuis l'app mobile.
-- (Auparavant : lecture + mise à jour uniquement.)

drop policy if exists notif_delete_own on notifications;
create policy notif_delete_own on notifications for delete using (user_id = auth.uid());
