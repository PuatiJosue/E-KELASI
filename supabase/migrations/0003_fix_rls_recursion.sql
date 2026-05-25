-- Fix: is_super_admin() query against profiles re-triggered profiles RLS,
-- which called is_super_admin() again → infinite recursion → stack overflow.
-- Mark SECURITY DEFINER so the function bypasses RLS when checking the role.

create or replace function is_super_admin() returns boolean
language sql stable
security definer
set search_path = public
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'super_admin');
$$;

create or replace function current_role_value() returns user_role
language sql stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;
