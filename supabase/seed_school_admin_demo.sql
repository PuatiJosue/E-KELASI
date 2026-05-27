-- E-KELASI · Seed demo "direction d'école" (Mme Diop, Lycée Albert-Camus)
-- Idempotent.

do $$
declare
  v_school_id uuid;
  v_diop_id uuid;
begin
  select id into v_school_id from schools where slug = 'lycee-albert-camus';

  -- auth.users
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, email_change, email_change_token_new, recovery_token)
  select '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
         'mme.diop@ekelasi.demo', crypt('demo1234', gen_salt('bf')), now(),
         '{"provider":"email","providers":["email"]}', '{}', now(), now(), '','','',''
  where not exists (select 1 from auth.users where email = 'mme.diop@ekelasi.demo');

  select id into v_diop_id from auth.users where email = 'mme.diop@ekelasi.demo';

  -- profil
  insert into profiles (id, email, full_name, role, locale)
  values (v_diop_id, 'mme.diop@ekelasi.demo', 'Mme Aminata Diop', 'school_admin', 'fr')
  on conflict (id) do update set role = 'school_admin', full_name = 'Mme Aminata Diop';

  -- staff role school_admin
  insert into school_staff (school_id, user_id, role)
  values (v_school_id, v_diop_id, 'school_admin')
  on conflict (school_id, user_id) do update set role = 'school_admin';

  -- branding par défaut
  update schools
  set brand_color = coalesce(brand_color, '#E0701E'),
      logo_url = coalesce(logo_url, null)
  where id = v_school_id;

  -- Ajout de quelques élèves supplémentaires pour démontrer la gestion
  insert into students (school_id, full_name, grade_level, class_name, birth_date) values
    (v_school_id, 'Mamadou Ndoye',  '5e', '5ème B', '2013-04-22'),
    (v_school_id, 'Salimata Sow',   '5e', '5ème B', '2013-08-15'),
    (v_school_id, 'Ibrahim Kane',   '5e', '5ème B', '2013-11-03'),
    (v_school_id, 'Aïcha Sarr',     '6e', '6ème A', '2014-02-19'),
    (v_school_id, 'Oumar Cissé',    '6e', '6ème A', '2014-06-08'),
    (v_school_id, 'Fatima Diakité', '6e', '6ème A', '2014-09-21')
  on conflict do nothing;
end $$;
