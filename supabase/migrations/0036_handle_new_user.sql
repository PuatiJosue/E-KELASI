-- Crée automatiquement la ligne `profiles` à chaque inscription auth.users.
-- Avant : l'upsert du profil se faisait côté client après signUp(), avec RLS
-- `id = auth.uid()`. Juste après signUp(), supabase-js n'a pas toujours attaché
-- le token de session → auth.uid() = null → insert refusé silencieusement
-- (console.warn). Résultat : des parents sans profil, dont les clés étrangères
-- students.created_by et parent_links.parent_id cassent → "Échec de l'envoi"
-- lors de l'enregistrement d'un enfant.
--
-- Ce trigger crée le profil côté serveur (security definer), ce qui supprime
-- la race définitivement. L'upsert client et l'upsert service-role dans
-- /api/parent/register-child restent comme filets de sécurité (idempotents).

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role, locale, phone)
  values (
    new.id,
    coalesce(new.email, new.id::text || '@parent.ekelasi'),
    coalesce(
      nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
      split_part(coalesce(new.email, ''), '@', 1),
      'Parent'
    ),
    'parent',
    'fr',
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), '')
  )
  on conflict (id) do nothing;
  return new;
exception
  -- Ne jamais bloquer l'inscription auth si la création du profil échoue.
  when others then
    raise warning 'handle_new_user: % %', sqlstate, sqlerrm;
    return new;
end $$;

drop trigger if exists trg_handle_new_user on auth.users;
create trigger trg_handle_new_user
  after insert on auth.users
  for each row execute function handle_new_user();
