-- Bucket public pour les logos d'école (téléversement depuis l'appareil).
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'storage' and table_name = 'buckets'
  ) then
    raise notice 'storage.buckets not present, skipping';
    return;
  end if;

  execute $sql$
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('school-logos', 'school-logos', true, 2097152,
      array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
    on conflict (id) do update set
      public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types
  $sql$;

  execute 'drop policy if exists "school_logos_read" on storage.objects';
  execute $sql$
    create policy "school_logos_read" on storage.objects for select
      using (bucket_id = 'school-logos')
  $sql$;

  execute 'drop policy if exists "school_logos_auth_write" on storage.objects';
  execute $sql$
    create policy "school_logos_auth_write" on storage.objects for all
      using (bucket_id = 'school-logos' and auth.uid() is not null)
      with check (bucket_id = 'school-logos' and auth.uid() is not null)
  $sql$;

  raise notice 'school-logos bucket installed (public)';
end $$;
