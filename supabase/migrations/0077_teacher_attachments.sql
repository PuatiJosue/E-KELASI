-- E-KELASI · Pièces jointes du professeur (notes & devoirs)
--
-- Le prof peut joindre un fichier (PDF, doc, feuille d'exercices) ET/OU une
-- photo (page du manuel, énoncé écrit au tableau, copie corrigée) quand il
-- saisit une note ou publie un devoir. Les fichiers vivent dans un bucket
-- PRIVÉ ; on stocke des URLs signées (1 an) relayées aux parents via la
-- notification, exactement comme les bulletins et les annonces.
--
-- Format de la colonne `attachments` (jsonb) :
--   [{ "url": "...", "name": "enonce.pdf", "type": "application/pdf", "isImage": false }]

alter table homework add column if not exists attachments jsonb not null default '[]'::jsonb;
alter table grades   add column if not exists attachments jsonb not null default '[]'::jsonb;

-- ── Bucket privé des pièces jointes du prof ──────────────────────────
-- NO-OP en local (Storage désactivé) ; s'applique sur Supabase Cloud.
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
      'teacher-files', 'teacher-files', false, 10485760,
      array[
        'application/pdf',
        'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic', 'image/heif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ]
    )
    on conflict (id) do update set
      public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types
  $sql$;

  -- Aucune policy : seul le service_role écrit, les parents lisent via URL
  -- signée (la signature contourne la RLS).

  raise notice 'teacher-files bucket installed (private)';
end $$;
