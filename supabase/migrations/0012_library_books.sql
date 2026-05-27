-- E-KELASI · Bibliothèque scolaire
-- Les profs ajoutent des livres recommandés, les parents les voient dans
-- l'app mobile (lecture seule).

create table if not exists library_books (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  added_by uuid not null references profiles(id) on delete set null,
  subject_id uuid references subjects(id) on delete set null,

  title text not null,
  author text not null,
  description text,
  cover_url text,
  grade_level text,            -- ex: "5e", "6e", null = tous niveaux
  isbn text,
  published_year int,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_library_school on library_books(school_id, created_at desc);
create index if not exists idx_library_subject on library_books(subject_id);
create index if not exists idx_library_level on library_books(grade_level);

create trigger trg_library_updated before update on library_books
  for each row execute function set_updated_at();

alter table library_books enable row level security;

-- READ : profs de l'école + direction + parents dont l'enfant est dans l'école + super_admin
drop policy if exists library_read on library_books;
create policy library_read on library_books for select
  using (
    school_id in (select my_teacher_school_ids())
    or school_id in (select my_admin_school_ids())
    or school_id in (select my_student_school_ids())
    or is_super_admin()
  );

-- INSERT : profs + direction de l'école
drop policy if exists library_insert on library_books;
create policy library_insert on library_books for insert
  with check (
    added_by = auth.uid()
    and (
      school_id in (select my_teacher_school_ids())
      or school_id in (select my_admin_school_ids())
    )
  );

-- UPDATE : seulement le prof qui l'a ajouté + direction de l'école
drop policy if exists library_update on library_books;
create policy library_update on library_books for update
  using (
    added_by = auth.uid()
    or school_id in (select my_admin_school_ids())
    or is_super_admin()
  );

-- DELETE : pareil que update
drop policy if exists library_delete on library_books;
create policy library_delete on library_books for delete
  using (
    added_by = auth.uid()
    or school_id in (select my_admin_school_ids())
    or is_super_admin()
  );
