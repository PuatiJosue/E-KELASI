-- Messagerie : permettre à un parent d'écrire à la DIRECTION de n'importe quelle
-- école (pas seulement celle de son enfant), en cohérence avec « Contact école »
-- qui liste déjà toutes les écoles de la plateforme.

-- 1) Direction (school_admin) d'une école donnée → destinataires possibles.
create or replace function list_school_recipients(p_school uuid)
returns table (user_id uuid, full_name text, role text)
language sql
security definer
set search_path = public
as $$
  select distinct p.id, p.full_name, ss.role::text
  from school_staff ss
  join profiles p on p.id = ss.user_id
  where ss.school_id = p_school
    and ss.role = 'school_admin'
    and ss.user_id <> auth.uid();
$$;

grant execute on function list_school_recipients(uuid) to authenticated;

-- 2) start_conversation : ajoute un dernier recours autorisant tout utilisateur
--    authentifié à ouvrir une conversation avec la DIRECTION de n'importe quelle
--    école. La conversation est rattachée à l'école de cette direction.
create or replace function start_conversation(p_other uuid, p_subject text, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me     uuid := auth.uid();
  v_school uuid;
  v_conv   uuid;
begin
  if v_me is null then raise exception 'not authenticated'; end if;
  if p_other is null or p_other = v_me then raise exception 'invalid recipient'; end if;
  if coalesce(trim(p_body), '') = '' then raise exception 'empty message'; end if;

  -- École partagée : parent → DIRECTION …
  select st.school_id into v_school
  from parent_links pl
  join students st on st.id = pl.student_id
  join school_staff ss on ss.school_id = st.school_id
  where pl.parent_id = v_me and ss.user_id = p_other and ss.role = 'school_admin'
  limit 1;

  -- … ou DIRECTION → parent.
  if v_school is null then
    select st.school_id into v_school
    from school_staff ss
    join students st on st.school_id = ss.school_id
    join parent_links pl on pl.student_id = st.id
    where ss.user_id = v_me and ss.role = 'school_admin' and pl.parent_id = p_other
    limit 1;
  end if;

  -- … ou n'importe quel utilisateur → DIRECTION de n'importe quelle école
  --    (Contact école : écrire à une école dont on n'a pas encore d'enfant).
  if v_school is null then
    select ss.school_id into v_school
    from school_staff ss
    where ss.user_id = p_other and ss.role = 'school_admin'
    limit 1;
  end if;

  if v_school is null then raise exception 'not allowed'; end if;

  -- Conversation 1:1 déjà existante entre ces deux personnes ?
  select c.id into v_conv
  from conversations c
  where c.id in (select conversation_id from conversation_participants where user_id = v_me)
    and c.id in (select conversation_id from conversation_participants where user_id = p_other)
    and (select count(*) from conversation_participants cp where cp.conversation_id = c.id) = 2
  limit 1;

  if v_conv is null then
    insert into conversations (school_id, subject)
      values (v_school, coalesce(nullif(trim(p_subject), ''), 'Message'))
      returning id into v_conv;
    insert into conversation_participants (conversation_id, user_id)
      values (v_conv, v_me), (v_conv, p_other);
  end if;

  insert into messages (conversation_id, sender_id, body) values (v_conv, v_me, p_body);
  update conversations set last_message_at = now() where id = v_conv;

  return v_conv;
end;
$$;

grant execute on function start_conversation(uuid, text, text) to authenticated;
