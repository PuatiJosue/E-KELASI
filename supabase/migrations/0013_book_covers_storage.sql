-- E-KELASI · Storage bucket pour les couvertures de livres.
-- Cette migration est NO-OP en local (Storage désactivé pour RAM).
-- Elle s'applique automatiquement sur Supabase Cloud où Storage tourne.
-- Politique : profs + direction uploadent, tout le monde lit (public).

do $$
begin
  -- Skip si la table storage.buckets n'existe pas (storage désactivé en local)
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'storage' and table_name = 'buckets'
  ) then
    raise notice 'storage.buckets not present, skipping (run on Supabase Cloud)';
    return;
  end if;

  -- Crée le bucket
  execute $sql$
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'book-covers', 'book-covers', true, 5242880,
      array['image/jpeg', 'image/png', 'image/webp']
    )
    on conflict (id) do update set
      public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types
  $sql$;

  -- Drop puis recrée les policies de manière idempotente
  execute 'drop policy if exists "book_covers_public_read" on storage.objects';
  execute 'drop policy if exists "book_covers_staff_insert" on storage.objects';
  execute 'drop policy if exists "book_covers_owner_update" on storage.objects';
  execute 'drop policy if exists "book_covers_owner_delete" on storage.objects';

  execute $sql$
    create policy "book_covers_public_read" on storage.objects for select
      using (bucket_id = 'book-covers')
  $sql$;

  execute $sql$
    create policy "book_covers_staff_insert" on storage.objects for insert
      with check (
        bucket_id = 'book-covers'
        and auth.uid() is not null
        and exists (
          select 1 from school_staff
          where user_id = auth.uid()
            and role in ('teacher', 'school_admin')
        )
      )
  $sql$;

  execute $sql$
    create policy "book_covers_owner_update" on storage.objects for update
      using (bucket_id = 'book-covers' and owner = auth.uid())
  $sql$;

  execute $sql$
    create policy "book_covers_owner_delete" on storage.objects for delete
      using (bucket_id = 'book-covers' and owner = auth.uid())
  $sql$;

  raise notice 'book-covers bucket and policies installed';
end $$;
