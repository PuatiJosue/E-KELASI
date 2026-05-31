-- E-KELASI · Bucket privé pour les bulletins PDF.
-- NO-OP en local (Storage désactivé pour RAM) ; s'applique sur Supabase Cloud.
-- Le bucket est PRIVÉ : aucune policy SELECT publique. Les parents accèdent
-- via des URLs signées générées côté serveur (expirent au bout de 30 jours).

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
    values (
      'grade-reports', 'grade-reports', false, 5242880,
      array['application/pdf']
    )
    on conflict (id) do update set
      public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types
  $sql$;

  -- Aucune policy SELECT/INSERT/UPDATE/DELETE : seul le service_role écrit,
  -- les parents lisent via signed URLs (qui bypassent RLS via leur signature).

  raise notice 'grade-reports bucket installed (private)';
end $$;
