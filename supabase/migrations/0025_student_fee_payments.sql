-- Lot B — Frais scolaires / minerval par ÉLÈVE.
-- La direction enregistre chaque paiement (montant libre, devise, libellé,
-- commentaire, photo du reçu). Historique complet par élève.
-- Accès via service_role uniquement (les actions serveur vérifient la direction).

create table if not exists student_fee_payments (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  student_id  uuid not null references students(id) on delete cascade,
  amount      numeric(12,2) not null default 0,     -- montant payé
  currency    text not null default 'USD',           -- USD, CDF (FC)…
  label       text,                                  -- ex. "1ère tranche", "Minerval"
  comment     text,
  receipt_url text,                                  -- photo/scan du reçu
  paid_at     date not null default current_date,
  recorded_by uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_student_fee_school_student
  on student_fee_payments(school_id, student_id);

alter table student_fee_payments enable row level security;

-- Bucket public pour les reçus (chemin obscur : school_id/student_id/uuid.ext).
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
    values ('fee-receipts', 'fee-receipts', true, 5242880,
      array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
    on conflict (id) do update set
      public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types
  $sql$;

  execute 'drop policy if exists "fee_receipts_read" on storage.objects';
  execute $sql$
    create policy "fee_receipts_read" on storage.objects for select
      using (bucket_id = 'fee-receipts')
  $sql$;

  execute 'drop policy if exists "fee_receipts_auth_write" on storage.objects';
  execute $sql$
    create policy "fee_receipts_auth_write" on storage.objects for all
      using (bucket_id = 'fee-receipts' and auth.uid() is not null)
      with check (bucket_id = 'fee-receipts' and auth.uid() is not null)
  $sql$;

  raise notice 'fee-receipts bucket installed (public)';
end $$;
