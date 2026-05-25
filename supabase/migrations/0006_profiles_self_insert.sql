-- Permettre à un user de créer son propre profil au moment du signup.
-- Sans cette policy, supabase.from('profiles').upsert(...) après signUp() échoue
-- silencieusement à cause de RLS.

drop policy if exists profiles_self_insert on profiles;
create policy profiles_self_insert on profiles for insert
  with check (id = auth.uid());
