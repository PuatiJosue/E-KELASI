-- E-KELASI · Row Level Security policies
-- High-level rules:
--   super_admin   → can read everything (admin console)
--   school_admin  → can read their school's data
--   teacher       → can read/write their classes
--   parent        → can read their own children's data, their subscriptions, their notifications

alter table profiles            enable row level security;
alter table schools             enable row level security;
alter table school_staff        enable row level security;
alter table students            enable row level security;
alter table parent_links        enable row level security;
alter table subjects            enable row level security;
alter table grades              enable row level security;
alter table homework            enable row level security;
alter table conversations       enable row level security;
alter table conversation_participants enable row level security;
alter table messages            enable row level security;
alter table subscriptions       enable row level security;
alter table payments            enable row level security;
alter table support_tickets     enable row level security;
alter table notifications       enable row level security;
alter table audit_logs          enable row level security;

create or replace function is_super_admin() returns boolean
language sql stable as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'super_admin');
$$;

create or replace function current_role_value() returns user_role
language sql stable as $$
  select role from profiles where id = auth.uid();
$$;

-- profiles: a user can read/update their own; super_admin reads all
create policy profiles_self_read on profiles for select
  using (id = auth.uid() or is_super_admin());
create policy profiles_self_update on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- schools: super_admin all; school staff/parents only their school
create policy schools_super_admin_all on schools for all
  using (is_super_admin()) with check (is_super_admin());
create policy schools_member_read on schools for select
  using (
    exists (select 1 from school_staff s where s.school_id = schools.id and s.user_id = auth.uid())
    or exists (
      select 1 from parent_links pl join students st on st.id = pl.student_id
      where pl.parent_id = auth.uid() and st.school_id = schools.id
    )
  );

-- subscriptions: parent reads their own; super_admin reads all
create policy subs_parent_read on subscriptions for select
  using (parent_id = auth.uid() or is_super_admin());

-- payments: parent reads their own; super_admin reads all
create policy payments_read on payments for select
  using (parent_id = auth.uid() or is_super_admin());

-- support tickets: reporter + super_admin
create policy tickets_read on support_tickets for select
  using (reporter_id = auth.uid() or is_super_admin());

-- notifications: own only
create policy notif_own on notifications for select using (user_id = auth.uid());
create policy notif_update_own on notifications for update using (user_id = auth.uid());

-- audit logs: super_admin only
create policy audit_super_admin on audit_logs for select using (is_super_admin());

-- (additional fine-grained policies for grades/homework/messages omitted for brevity —
--  add them as the teacher & parent apps come online.)
