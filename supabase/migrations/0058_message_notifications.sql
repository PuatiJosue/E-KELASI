-- Notifications (et push) sur nouveau message + temps réel sur les messages.
-- Jusqu'ici, envoyer un message ne créait aucune notification : le destinataire
-- n'était donc jamais alerté. Ce trigger crée une notification « message » pour
-- chaque autre participant → le cron Edge Function « send-push » l'envoie en push.

create or replace function notify_on_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender text;
begin
  select full_name into v_sender from profiles where id = new.sender_id;

  insert into notifications (user_id, kind, body, payload)
  select
    cp.user_id,
    'message'::notification_kind,
    coalesce(nullif(trim(v_sender), ''), 'Nouveau message') || ' : ' || left(new.body, 140),
    jsonb_build_object('conversation_id', new.conversation_id)
  from conversation_participants cp
  where cp.conversation_id = new.conversation_id
    and cp.user_id <> new.sender_id;

  return new;
end;
$$;

drop trigger if exists trg_notify_on_new_message on messages;
create trigger trg_notify_on_new_message
  after insert on messages
  for each row execute function notify_on_new_message();

-- Temps réel : diffuse les nouveaux messages aux apps connectées (affichage
-- instantané dans le fil de discussion).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;
end $$;
