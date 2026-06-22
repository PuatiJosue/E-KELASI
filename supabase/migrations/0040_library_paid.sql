-- E-KELASI · Bibliothèque payante (gérée par la plateforme)
-- Les livres sont ajoutés UNIQUEMENT par le super admin (bibliothèque centrale,
-- school_id = NULL = visible par tous les parents). Chaque livre a un prix, un
-- fichier PDF/EPUB privé, et n'est lisible qu'après achat (Stripe instantané ou
-- Mobile Money validé manuellement).

-- 1) Colonnes prix + fichier sur library_books, et school_id devient optionnel
--    (NULL = livre plateforme central, visible par tout le monde).
alter table library_books
  add column if not exists price_cents  int  not null default 0,           -- 0 = gratuit
  add column if not exists currency     char(3) not null default 'USD',
  add column if not exists file_path    text,                              -- chemin dans le bucket library-files
  add column if not exists file_format  text check (file_format in ('pdf', 'epub'));

alter table library_books alter column school_id drop not null;

-- 2) Lecture : livres plateforme (school_id NULL) visibles par tout utilisateur
--    connecté ; sinon membres de l'école (règle existante conservée).
drop policy if exists library_read on library_books;
create policy library_read on library_books for select
  using (
    school_id is null
    or school_id in (select my_teacher_school_ids())
    or school_id in (select my_admin_school_ids())
    or school_id in (select my_student_school_ids())
    or is_super_admin()
  );

-- 3) Écriture réservée au super admin (plateforme).
drop policy if exists library_insert on library_books;
create policy library_insert on library_books for insert
  with check (is_super_admin());

drop policy if exists library_update on library_books;
create policy library_update on library_books for update
  using (is_super_admin());

drop policy if exists library_delete on library_books;
create policy library_delete on library_books for delete
  using (is_super_admin());

-- 4) Achats de livres (1 ligne par tentative). L'accès au fichier est ouvert
--    dès qu'une ligne (book_id, parent_id) est en statut 'paid'.
do $$ begin
  if not exists (select 1 from pg_type where typname = 'library_purchase_status') then
    create type library_purchase_status as enum ('pending', 'paid', 'rejected');
  end if;
  if not exists (select 1 from pg_type where typname = 'library_purchase_method') then
    create type library_purchase_method as enum ('stripe', 'mobile_money');
  end if;
end $$;

create table if not exists library_purchases (
  id            uuid primary key default gen_random_uuid(),
  book_id       uuid not null references library_books(id) on delete cascade,
  parent_id     uuid not null references profiles(id) on delete cascade,
  amount_cents  int  not null,
  currency      char(3) not null default 'USD',
  method        library_purchase_method not null,
  status        library_purchase_status not null default 'pending',

  -- Stripe (paiement unique)
  stripe_session_id text,

  -- Mobile Money (validation manuelle)
  provider      mm_provider,
  sender_phone  text,
  reference     text,
  screenshot_url text,
  validated_by  uuid references profiles(id) on delete set null,
  validated_at  timestamptz,
  rejection_reason text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_libpur_parent on library_purchases(parent_id, status);
create index if not exists idx_libpur_book on library_purchases(book_id);
create index if not exists idx_libpur_pending on library_purchases(status, created_at desc);
create unique index if not exists uq_libpur_session on library_purchases(stripe_session_id)
  where stripe_session_id is not null;

create trigger trg_libpur_updated before update on library_purchases
  for each row execute function set_updated_at();

alter table library_purchases enable row level security;

-- Parent : crée ses propres demandes (Mobile Money) + lit les siennes.
drop policy if exists libpur_own_insert on library_purchases;
create policy libpur_own_insert on library_purchases for insert
  with check (parent_id = auth.uid());

drop policy if exists libpur_own_read on library_purchases;
create policy libpur_own_read on library_purchases for select
  using (parent_id = auth.uid() or is_super_admin());

-- Super admin : valider / rejeter.
drop policy if exists libpur_admin_update on library_purchases;
create policy libpur_admin_update on library_purchases for update
  using (is_super_admin()) with check (is_super_admin());

-- 5) Bucket privé pour les fichiers de livres (PDF/EPUB). NO-OP en local.
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
      'library-files', 'library-files', false, 104857600,
      array['application/pdf', 'application/epub+zip', 'application/octet-stream']
    )
    on conflict (id) do update set
      public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types
  $sql$;

  -- Privé : aucune lecture publique. L'accès se fait via URL signée générée
  -- côté serveur (service role) après vérification de l'achat. Seul le super
  -- admin écrit directement dans le bucket.
  execute 'drop policy if exists "library_files_admin_insert" on storage.objects';
  execute 'drop policy if exists "library_files_admin_update" on storage.objects';
  execute 'drop policy if exists "library_files_admin_delete" on storage.objects';

  execute $sql$
    create policy "library_files_admin_insert" on storage.objects for insert
      with check (bucket_id = 'library-files' and is_super_admin())
  $sql$;
  execute $sql$
    create policy "library_files_admin_update" on storage.objects for update
      using (bucket_id = 'library-files' and is_super_admin())
  $sql$;
  execute $sql$
    create policy "library_files_admin_delete" on storage.objects for delete
      using (bucket_id = 'library-files' and is_super_admin())
  $sql$;

  raise notice 'library-files bucket and policies installed';

  -- Le super admin peut aussi uploader des couvertures (book-covers) pour la
  -- bibliothèque centrale (la policy existante ne couvre que le staff d'école).
  execute 'drop policy if exists "book_covers_superadmin_insert" on storage.objects';
  execute $sql$
    create policy "book_covers_superadmin_insert" on storage.objects for insert
      with check (bucket_id = 'book-covers' and is_super_admin())
  $sql$;
end $$;
