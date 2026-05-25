-- E-KELASI · Initial Postgres schema (Supabase)
-- Tables: organizations (schools), profiles (users), students, enrollments,
--         subjects, grades, homework, messages, subscriptions, audit_logs.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────
-- Roles & profiles (one row per Supabase auth user)
-- ─────────────────────────────────────────────────────────────────────
create type user_role as enum ('super_admin', 'school_admin', 'teacher', 'parent');

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role user_role not null default 'parent',
  avatar_url text,
  locale text not null default 'fr',
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────
-- Schools (partner organizations)
-- ─────────────────────────────────────────────────────────────────────
create type school_status as enum ('onboarding', 'trial', 'active', 'suspended', 'churned');
create type school_plan as enum ('standard', 'pro');

create table if not exists schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  city text not null,
  country_code char(2) not null,
  plan school_plan not null default 'standard',
  status school_status not null default 'onboarding',
  brand_color text,
  logo_url text,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- staff: which users belong to a school (teachers, school_admins)
create table if not exists school_staff (
  school_id uuid not null references schools(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role user_role not null check (role in ('school_admin', 'teacher')),
  created_at timestamptz not null default now(),
  primary key (school_id, user_id)
);

-- ─────────────────────────────────────────────────────────────────────
-- Students & enrollments (a student belongs to a school; parents are linked)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete restrict,
  full_name text not null,
  grade_level text not null,
  class_name text,
  birth_date date,
  created_at timestamptz not null default now()
);

create table if not exists parent_links (
  parent_id uuid not null references profiles(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  relation text not null default 'parent',
  is_primary boolean not null default false,
  primary key (parent_id, student_id)
);

-- ─────────────────────────────────────────────────────────────────────
-- Subjects, grades, homework
-- ─────────────────────────────────────────────────────────────────────
create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null,
  short_name text not null,
  color text not null default '#3A6DBC'
);

create table if not exists grades (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete restrict,
  teacher_id uuid references profiles(id) on delete set null,
  kind text not null,
  score numeric(5,2) not null,
  max_score numeric(5,2) not null default 20,
  coefficient numeric(4,2) not null default 1,
  graded_at date not null default current_date,
  comment text,
  created_at timestamptz not null default now()
);

create type homework_status as enum ('todo', 'inprogress', 'done', 'late');

create table if not exists homework (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  teacher_id uuid references profiles(id) on delete set null,
  class_name text not null,
  title text not null,
  description text,
  due_at timestamptz not null,
  status homework_status not null default 'todo',
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────
-- Messaging (1-to-1 between parent and teacher, or school broadcast)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  subject text not null,
  topic text,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists conversation_participants (
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete restrict,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_conv on messages(conversation_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────
-- Subscriptions (Stripe-backed; one per paying parent)
-- ─────────────────────────────────────────────────────────────────────
create type subscription_plan as enum ('essentiel', 'famille', 'premium');
create type subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'unpaid');

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references profiles(id) on delete cascade,
  school_id uuid references schools(id) on delete set null,
  stripe_customer_id text not null,
  stripe_subscription_id text unique,
  plan subscription_plan not null default 'essentiel',
  status subscription_status not null default 'trialing',
  amount_cents int not null,
  currency char(3) not null default 'EUR',
  current_period_start timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references subscriptions(id) on delete set null,
  parent_id uuid not null references profiles(id) on delete restrict,
  stripe_invoice_id text,
  amount_cents int not null,
  currency char(3) not null default 'EUR',
  status text not null,  -- paid | failed | refunded | pending
  failure_reason text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────
-- Support tickets (super admin console)
-- ─────────────────────────────────────────────────────────────────────
create type ticket_status as enum ('new', 'pending', 'waiting', 'resolved');
create type ticket_priority as enum ('P0', 'P1', 'P2', 'P3');

create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,  -- e.g. "#1503"
  reporter_id uuid references profiles(id) on delete set null,
  school_id uuid references schools(id) on delete set null,
  title text not null,
  body text,
  tag text not null,  -- bug | question | feature | sales | billing | account
  priority ticket_priority not null default 'P3',
  status ticket_status not null default 'new',
  assignee_id uuid references profiles(id) on delete set null,
  message_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────
-- Notifications (parent app)
-- ─────────────────────────────────────────────────────────────────────
create type notification_kind as enum ('grade', 'message', 'hw', 'school', 'reminder', 'billing');

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind notification_kind not null,
  body text not null,
  payload jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notif_user on notifications(user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────
-- Audit log (security screen)
-- ─────────────────────────────────────────────────────────────────────
create type log_severity as enum ('info', 'warn', 'critical');

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  severity log_severity not null default 'info',
  actor text not null,  -- "system" | email | "stripe-webhook"
  source text not null, -- auth | metrics | cron | admin | webhook | storage | deploy | reports
  message text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_created on audit_logs(created_at desc);
create index if not exists idx_audit_severity on audit_logs(severity, created_at desc);

-- ─────────────────────────────────────────────────────────────────────
-- Updated-at trigger
-- ─────────────────────────────────────────────────────────────────────
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at := now(); return new; end;
$$ language plpgsql;

create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();
create trigger trg_schools_updated before update on schools
  for each row execute function set_updated_at();
create trigger trg_subscriptions_updated before update on subscriptions
  for each row execute function set_updated_at();
create trigger trg_support_updated before update on support_tickets
  for each row execute function set_updated_at();
