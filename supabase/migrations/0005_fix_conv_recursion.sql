-- Fix: conversation_participants policy queries conversation_participants itself
-- → infinite recursion. Use SECURITY DEFINER helper to bypass RLS for the lookup.

create or replace function my_conversation_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select conversation_id from conversation_participants where user_id = auth.uid();
$$;

drop policy if exists conv_participants_self_read on conversation_participants;
create policy conv_participants_self_read on conversation_participants for select
  using (
    user_id = auth.uid()
    or conversation_id in (select my_conversation_ids())
    or is_super_admin()
  );

drop policy if exists conv_participant_read on conversations;
create policy conv_participant_read on conversations for select
  using (id in (select my_conversation_ids()) or is_super_admin());

drop policy if exists messages_participant_read on messages;
create policy messages_participant_read on messages for select
  using (conversation_id in (select my_conversation_ids()) or is_super_admin());

-- Idem pour profiles_visible_to_me qui regarde aussi conversation_participants
drop policy if exists profiles_visible_to_me on profiles;
create policy profiles_visible_to_me on profiles for select
  using (
    id = auth.uid()
    or is_super_admin()
    or id in (
      select user_id from school_staff
      where school_id in (select my_student_school_ids())
    )
    or id in (
      select user_id from conversation_participants
      where conversation_id in (select my_conversation_ids())
    )
  );
