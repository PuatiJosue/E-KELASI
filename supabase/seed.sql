-- E-KELASI · Demo seed data (matches the prototype mocks)
-- Run after migrations on a fresh database.

insert into schools (name, slug, city, country_code, plan, status, joined_at) values
  ('Lycée Albert-Camus',     'lycee-albert-camus',    'Dakar',      'SN', 'pro',      'active',     '2024-09-01'),
  ('École Sainte-Thérèse',   'ecole-sainte-therese',  'Montréal',   'CA', 'pro',      'active',     '2025-01-15'),
  ('Institut Lumière',       'institut-lumiere',      'Abidjan',    'CI', 'standard', 'active',     '2025-03-10'),
  ('Collège Saint-Joseph',   'college-saint-joseph',  'Lyon',       'FR', 'standard', 'active',     '2025-09-01'),
  ('École les Acacias',      'ecole-les-acacias',     'Yaoundé',    'CM', 'standard', 'trial',      '2026-05-01'),
  ('Lycée Lumière',          'lycee-lumiere',         'Casablanca', 'MA', 'pro',      'onboarding', '2026-05-15'),
  ('École Tunis-Centre',     'ecole-tunis-centre',    'Tunis',      'TN', 'standard', 'active',     '2025-11-04'),
  ('Collège Mermoz',         'college-mermoz',        'Nouakchott', 'MR', 'standard', 'active',     '2025-04-20')
on conflict (slug) do nothing;

-- audit log demo events
insert into audit_logs (severity, actor, source, message, created_at) values
  ('info',     'system',         'cron',     'Sauvegarde quotidienne terminée · 8.4 GB',                       now() - interval '2 min'),
  ('info',     'fatou.diallo',   'auth',     'Connexion réussie · iOS',                                        now() - interval '4 min'),
  ('warn',     'system',         'metrics',  'Latence DB élevée détectée (p95 = 412ms)',                       now() - interval '7 min'),
  ('info',     'yann.mbaye',     'admin',    'Modification plan tarifaire · École Lumière',                    now() - interval '14 min'),
  ('critical', 'security-bot',   'auth',     '5 tentatives login échouées · IP 41.83.x.x · bloquée 24h',       now() - interval '21 min'),
  ('info',     'stripe-webhook', 'webhook',  'invoice.payment_succeeded · cust_4QzN…',                         now() - interval '24 min'),
  ('warn',     'system',         'storage',  'Quota S3 à 78% · bucket ekelasi-uploads-prod',                   now() - interval '37 min'),
  ('info',     'aicha.traore',   'auth',     'Mot de passe changé',                                            now() - interval '50 min'),
  ('info',     'system',         'deploy',   'Déploiement v2.4.1 · 0 erreur',                                  now() - interval '62 min'),
  ('info',     'lycee-camus.adm','reports',  'Export bulletin PDF · 312 élèves',                               now() - interval '71 min');
