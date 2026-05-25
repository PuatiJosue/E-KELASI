-- Permettre aux participants d'une conversation d'envoyer des messages.
-- Et de mettre à jour last_message_at sur la conversation.

drop policy if exists messages_participant_insert on messages;
create policy messages_participant_insert on messages for insert
  with check (
    sender_id = auth.uid()
    and conversation_id in (select my_conversation_ids())
  );

drop policy if exists messages_self_update_read on messages;
create policy messages_self_update_read on messages for update
  using (
    conversation_id in (select my_conversation_ids())
    and sender_id <> auth.uid()  -- on ne marque "lu" que les messages des autres
  )
  with check (true);

drop policy if exists conv_participant_update on conversations;
create policy conv_participant_update on conversations for update
  using (id in (select my_conversation_ids()))
  with check (id in (select my_conversation_ids()));
