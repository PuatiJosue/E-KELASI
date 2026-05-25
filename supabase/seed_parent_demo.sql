-- E-KELASI · Seed démo "parent" (Fatou Diallo + Amina à Lycée Albert-Camus)
-- Idempotent : peut être ré-exécuté sans rien casser.
-- À runner après que seed.sql ait créé les écoles.

-- ── Profils des profs ─────────────────────────────────────────────────
-- Note : on les crée SANS auth.users (pas besoin qu'ils se connectent ici).
-- Les profils ont des UUID dérivés stables.

do $$
declare
  v_school_id uuid;
  v_amina_id  uuid := '00000000-0000-0000-0000-000000000a01';
  v_teacher_ba    uuid := '00000000-0000-0000-0000-000000000b01';
  v_teacher_camara uuid := '00000000-0000-0000-0000-000000000b02';
  v_teacher_ndiaye uuid := '00000000-0000-0000-0000-000000000b03';
  v_teacher_adeyemi uuid := '00000000-0000-0000-0000-000000000b04';
  v_teacher_traore uuid := '00000000-0000-0000-0000-000000000b05';
  v_subj_math uuid;
  v_subj_fr   uuid;
  v_subj_hg   uuid;
  v_subj_sci  uuid;
  v_subj_eng  uuid;
  v_subj_eps  uuid;
  v_conv_camara uuid;
  v_conv_ba uuid;
  v_conv_direction uuid;
  v_conv_ndiaye uuid;
begin
  -- récupère Lycée Albert-Camus
  select id into v_school_id from schools where slug = 'lycee-albert-camus';

  -- ── Profs (profiles sans auth.users) ───────────────────────────────
  -- On contourne la FK profiles.id → auth.users.id pour les profs en
  -- créant des auth.users factices (juste pour respecter la contrainte).
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, email_change, email_change_token_new, recovery_token)
  values
    ('00000000-0000-0000-0000-000000000000', v_teacher_ba,      'authenticated', 'authenticated', 'ousmane.ba@ekelasi.demo',   crypt('demo1234', gen_salt('bf')), now(), '{}','{}', now(), now(), '','','',''),
    ('00000000-0000-0000-0000-000000000000', v_teacher_camara,  'authenticated', 'authenticated', 'mme.camara@ekelasi.demo',   crypt('demo1234', gen_salt('bf')), now(), '{}','{}', now(), now(), '','','',''),
    ('00000000-0000-0000-0000-000000000000', v_teacher_ndiaye,  'authenticated', 'authenticated', 'mme.ndiaye@ekelasi.demo',   crypt('demo1234', gen_salt('bf')), now(), '{}','{}', now(), now(), '','','',''),
    ('00000000-0000-0000-0000-000000000000', v_teacher_adeyemi, 'authenticated', 'authenticated', 'adeyemi@ekelasi.demo',      crypt('demo1234', gen_salt('bf')), now(), '{}','{}', now(), now(), '','','',''),
    ('00000000-0000-0000-0000-000000000000', v_teacher_traore,  'authenticated', 'authenticated', 'm.traore@ekelasi.demo',     crypt('demo1234', gen_salt('bf')), now(), '{}','{}', now(), now(), '','','','')
  on conflict (id) do nothing;

  insert into profiles (id, email, full_name, role, locale) values
    (v_teacher_ba,      'ousmane.ba@ekelasi.demo',   'M. Ousmane Bâ', 'teacher', 'fr'),
    (v_teacher_camara,  'mme.camara@ekelasi.demo',   'Mme Camara',    'teacher', 'fr'),
    (v_teacher_ndiaye,  'mme.ndiaye@ekelasi.demo',   'Mme Ndiaye',    'teacher', 'fr'),
    (v_teacher_adeyemi, 'adeyemi@ekelasi.demo',      'Mr. Adeyemi',   'teacher', 'en'),
    (v_teacher_traore,  'm.traore@ekelasi.demo',     'M. Traoré',     'teacher', 'fr')
  on conflict (id) do nothing;

  -- ── school_staff ───────────────────────────────────────────────────
  insert into school_staff (school_id, user_id, role) values
    (v_school_id, v_teacher_ba,      'teacher'),
    (v_school_id, v_teacher_camara,  'teacher'),
    (v_school_id, v_teacher_ndiaye,  'teacher'),
    (v_school_id, v_teacher_adeyemi, 'teacher'),
    (v_school_id, v_teacher_traore,  'teacher')
  on conflict (school_id, user_id) do nothing;

  -- ── Matières ───────────────────────────────────────────────────────
  insert into subjects (school_id, name, short_name, color)
  values
    (v_school_id, 'Mathématiques', 'Math', '#3A6DBC'),
    (v_school_id, 'Français',      'Fr',   '#9747BB'),
    (v_school_id, 'Histoire-Géo',  'H-G',  '#C28728'),
    (v_school_id, 'Sciences',      'SVT',  '#1D6650'),
    (v_school_id, 'Anglais',       'En',   '#B8475B'),
    (v_school_id, 'EPS',           'EPS',  '#E0701E')
  on conflict do nothing;

  select id into v_subj_math from subjects where school_id = v_school_id and name = 'Mathématiques';
  select id into v_subj_fr   from subjects where school_id = v_school_id and name = 'Français';
  select id into v_subj_hg   from subjects where school_id = v_school_id and name = 'Histoire-Géo';
  select id into v_subj_sci  from subjects where school_id = v_school_id and name = 'Sciences';
  select id into v_subj_eng  from subjects where school_id = v_school_id and name = 'Anglais';
  select id into v_subj_eps  from subjects where school_id = v_school_id and name = 'EPS';

  -- ── Élève : Amina Diallo ───────────────────────────────────────────
  insert into students (id, school_id, full_name, grade_level, class_name, birth_date)
  values (v_amina_id, v_school_id, 'Amina Diallo', '5e', '5ème B', '2013-09-12')
  on conflict (id) do nothing;

  -- ── Notes d'Amina ──────────────────────────────────────────────────
  insert into grades (student_id, subject_id, teacher_id, kind, score, max_score, coefficient, graded_at, comment) values
    (v_amina_id, v_subj_math, v_teacher_ba,      'Contrôle · Géométrie',     17, 20, 3, '2026-05-21', 'Très bonne maîtrise des théorèmes.'),
    (v_amina_id, v_subj_fr,   v_teacher_camara,  'Dictée préparée',          14, 20, 1, '2026-05-20', 'Quelques accords manqués.'),
    (v_amina_id, v_subj_sci,  v_teacher_ndiaye,  'Compte-rendu TP',          16, 20, 2, '2026-05-18', 'Excellent rapport, bien structuré.'),
    (v_amina_id, v_subj_eng,  v_teacher_adeyemi, 'Oral · Présentation',      11, 20, 2, '2026-05-15', 'Plus de pratique orale recommandée.'),
    (v_amina_id, v_subj_hg,   v_teacher_traore,  'Quiz chapitre 4',          13, 20, 1, '2026-05-14', null)
  on conflict do nothing;

  -- ── Devoirs (rattachés à des matières, classe 5ème B) ─────────────
  insert into homework (subject_id, teacher_id, class_name, title, description, due_at, status) values
    (v_subj_math, v_teacher_ba,      '5ème B', 'Exercices p.142 · 1 à 7',          'Faire les exercices 1 à 7 page 142, sur les triangles.', now() + interval '1 day',  'todo'),
    (v_subj_fr,   v_teacher_camara,  '5ème B', 'Lire chapitre 6 — Le Petit Prince','Lire le chapitre 6 et préparer 3 questions.',           now() + interval '3 days', 'inprogress'),
    (v_subj_sci,  v_teacher_ndiaye,  '5ème B', 'Schéma de la cellule à compléter', 'Compléter le schéma fourni avec les organites.',         now() + interval '4 days', 'todo'),
    (v_subj_eng,  v_teacher_adeyemi, '5ème B', 'Revoir vocabulaire unit 5',         'Revoir vocab unit 5 pour interrogation.',               now() + interval '7 days', 'todo'),
    (v_subj_hg,   v_teacher_traore,  '5ème B', 'Frise chronologique Moyen-Âge',     'Compléter la frise sur le Moyen-Âge.',                  now() - interval '1 day',  'done')
  on conflict do nothing;
end $$;

-- ── Fatou (parent) + auth user + lien parent-enfant ─────────────────
-- Fait dans un bloc séparé pour pouvoir être ré-exécuté.
do $$
declare
  v_fatou_id uuid;
  v_amina_id uuid := '00000000-0000-0000-0000-000000000a01';
  v_teacher_camara  uuid := '00000000-0000-0000-0000-000000000b02';
  v_teacher_ba      uuid := '00000000-0000-0000-0000-000000000b01';
  v_teacher_ndiaye  uuid := '00000000-0000-0000-0000-000000000b03';
  v_school_id uuid;
  v_conv_camara uuid;
  v_conv_ba uuid;
  v_conv_direction uuid;
  v_conv_ndiaye uuid;
begin
  select id into v_school_id from schools where slug = 'lycee-albert-camus';

  -- auth.users.Fatou
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, email_change, email_change_token_new, recovery_token)
  select '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
         'fatou.diallo@exemple.com', crypt('demo1234', gen_salt('bf')), now(),
         '{"provider":"email","providers":["email"]}', '{}', now(), now(), '','','',''
  where not exists (select 1 from auth.users where email = 'fatou.diallo@exemple.com');

  select id into v_fatou_id from auth.users where email = 'fatou.diallo@exemple.com';

  -- profil
  insert into profiles (id, email, full_name, role, locale, phone)
  values (v_fatou_id, 'fatou.diallo@exemple.com', 'Fatou Diallo', 'parent', 'fr', '+221 77 123 45 67')
  on conflict (id) do update set role = 'parent', full_name = 'Fatou Diallo';

  -- parent_link Fatou ↔ Amina
  insert into parent_links (parent_id, student_id, relation, is_primary)
  values (v_fatou_id, v_amina_id, 'mère', true)
  on conflict (parent_id, student_id) do nothing;

  -- ── Conversations + messages ──────────────────────────────────────
  -- Conv 1 : Mme Camara (Français) — unread
  v_conv_camara := gen_random_uuid();
  insert into conversations (id, school_id, subject, topic, last_message_at)
  values (v_conv_camara, v_school_id, 'Français', 'Progrès en lecture', now() - interval '10 minutes');
  insert into conversation_participants (conversation_id, user_id) values
    (v_conv_camara, v_fatou_id),
    (v_conv_camara, v_teacher_camara);
  insert into messages (conversation_id, sender_id, body, created_at) values
    (v_conv_camara, v_teacher_camara, 'Bonjour, j''ai voulu vous faire un retour sur Amina. Elle progresse vraiment bien en compréhension écrite cette semaine.', now() - interval '3 hours'),
    (v_conv_camara, v_teacher_camara, 'Continuez la lecture du soir, ça porte ses fruits 🙂', now() - interval '3 hours' + interval '2 minutes'),
    (v_conv_camara, v_fatou_id,       'Merci beaucoup pour ce retour ! On va continuer. Le chapitre 6 est prévu pour ce soir.', now() - interval '2 hours'),
    (v_conv_camara, v_teacher_camara, 'Amina a fait beaucoup de progrès cette semaine, je vous joins le plan de lecture du trimestre.', now() - interval '10 minutes');

  -- Conv 2 : M. Ousmane Bâ (Math) — lu
  v_conv_ba := gen_random_uuid();
  insert into conversations (id, school_id, subject, topic, last_message_at)
  values (v_conv_ba, v_school_id, 'Mathématiques', 'Correction du dernier contrôle', now() - interval '1 day');
  insert into conversation_participants (conversation_id, user_id) values
    (v_conv_ba, v_fatou_id),
    (v_conv_ba, v_teacher_ba);
  insert into messages (conversation_id, sender_id, body, read_at, created_at) values
    (v_conv_ba, v_teacher_ba, 'Merci pour le retour, voici le corrigé du dernier contrôle en pièce jointe.', now() - interval '23 hours', now() - interval '1 day');

  -- Conv 3 : Direction (school broadcast)
  v_conv_direction := gen_random_uuid();
  insert into conversations (id, school_id, subject, topic, last_message_at)
  values (v_conv_direction, v_school_id, 'École', 'Réunion parents-profs', now() - interval '4 days');
  insert into conversation_participants (conversation_id, user_id) values
    (v_conv_direction, v_fatou_id);
  insert into messages (conversation_id, sender_id, body, read_at, created_at) values
    (v_conv_direction, v_teacher_camara, 'Réunion parents-profs vendredi prochain à 17h. Merci de confirmer votre présence.', now() - interval '3 days', now() - interval '4 days');

  -- Conv 4 : Mme Ndiaye (Sciences) — unread
  v_conv_ndiaye := gen_random_uuid();
  insert into conversations (id, school_id, subject, topic, last_message_at)
  values (v_conv_ndiaye, v_school_id, 'Sciences', 'Matériel TP', now() - interval '4 days');
  insert into conversation_participants (conversation_id, user_id) values
    (v_conv_ndiaye, v_fatou_id),
    (v_conv_ndiaye, v_teacher_ndiaye);
  insert into messages (conversation_id, sender_id, body, created_at) values
    (v_conv_ndiaye, v_teacher_ndiaye, 'Le TP de demain nécessitera une blouse blanche. Merci.', now() - interval '4 days');

  -- ── Notifications pour Fatou ──────────────────────────────────────
  insert into notifications (user_id, kind, body, created_at) values
    (v_fatou_id, 'grade',    'Nouvelle note en Mathématiques : 17/20',       now() - interval '12 minutes'),
    (v_fatou_id, 'message',  'Mme Camara vous a envoyé un message',          now() - interval '1 hour'),
    (v_fatou_id, 'hw',       'Nouveau devoir : Exercices p.142',             now() - interval '3 hours'),
    (v_fatou_id, 'school',   'Bulletin du 2e trimestre disponible',          now() - interval '1 day'),
    (v_fatou_id, 'reminder', 'Rappel : signer le bulletin avant lundi',      now() - interval '1 day');

  -- ── Subscription Stripe stub ──────────────────────────────────────
  insert into subscriptions (parent_id, school_id, stripe_customer_id, stripe_subscription_id,
                             plan, status, amount_cents, currency,
                             current_period_start, current_period_end)
  values (v_fatou_id, v_school_id, 'cus_demo_fatou', 'sub_demo_fatou',
          'famille', 'active', 1900, 'EUR',
          date_trunc('month', now()), date_trunc('month', now()) + interval '1 month')
  on conflict (stripe_subscription_id) do nothing;
end $$;
