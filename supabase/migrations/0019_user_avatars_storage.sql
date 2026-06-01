-- E-KELASI · Bucket privé pour les photos de profil (profs, direction,
-- super admin, etc. — tout user qui a un row dans `profiles`).
-- Le fichier est stocké sous `<user_id>/avatar.<ext>`. Les RLS storage
-- garantissent que seul le propriétaire peut écrire.

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'storage' and table_name = 'buckets'
  ) then
    raise notice 'storage.buckets not present, skipping (run on Supabase Cloud)';
    return;
  end if;

  execute $sql$
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('user-avatars', 'user-avatars', false, 2097152,
      array['image/jpeg', 'image/png', 'image/webp'])
    on conflict (id) do update set
      public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types
  $sql$;

  -- READ : tout utilisateur connecté peut voir tous les avatars
  -- (un parent doit pouvoir voir l'avatar du prof, etc.).
  execute 'drop policy if exists "user_avatars_read" on storage.objects';
  execute $sql$
    create policy "user_avatars_read" on storage.objects for select
      using (bucket_id = 'user-avatars' and auth.uid() is not null)
  $sql$;

  -- WRITE : un user n'écrit/écrase que SON propre avatar (folder = user_id).
  execute 'drop policy if exists "user_avatars_own_write" on storage.objects';
  execute $sql$
    create policy "user_avatars_own_write" on storage.objects for all
      using (
        bucket_id = 'user-avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
      )
      with check (
        bucket_id = 'user-avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
      )
  $sql$;

  raise notice 'user-avatars bucket installed (private)';
end $$;
