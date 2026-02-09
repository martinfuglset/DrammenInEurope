-- =============================================================================
-- Paste this in Supabase: Dashboard → SQL Editor → New query → Run
-- Creates tables, RLS policies (anon can read/write), storage buckets, realtime.
-- Safe to run multiple times (uses "if not exists" / "drop policy if exists").
-- =============================================================================

create extension if not exists "uuid-ossp";

create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  display_name text not null,
  role text default 'participant',
  email text,
  phone text,
  birth_date date,
  age int
);

create table if not exists trip_days (
  id uuid primary key default uuid_generate_v4(),
  date date not null,
  title text not null,
  description text,
  is_choice_day boolean default false,
  is_locked boolean default false,
  choice_block_id text,
  schedule_items jsonb default '[]'::jsonb,
  sort_order serial
);

create table if not exists activities (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  time_start text,
  time_end text,
  location text,
  meeting_point text,
  transport text,
  description text,
  tags text[],
  capacity_max int default 20,
  sort_order serial,
  price text,
  driving_length text,
  link text
);

create table if not exists signups (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  activity_id uuid references activities(id) on delete cascade,
  status text default 'confirmed',
  created_at timestamptz default now(),
  unique(user_id, activity_id)
);

create table if not exists info_pages (
  slug text primary key,
  title text,
  content text,
  updated_at timestamptz default now()
);

create table if not exists feedback (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete set null,
  message text not null,
  ratings jsonb,
  highlights text,
  improvements text,
  created_at timestamptz default now()
);

create table if not exists quotes (
  id uuid primary key default uuid_generate_v4(),
  text text not null,
  author text not null,
  submitted_by uuid references profiles(id) on delete set null,
  likes int default 0,
  created_at timestamptz default now()
);

create table if not exists photos (
  id uuid primary key default uuid_generate_v4(),
  url text not null,
  caption text,
  uploaded_by uuid references profiles(id) on delete set null,
  width int,
  height int,
  created_at timestamptz default now()
);

create table if not exists payment_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  plan_type text not null,
  amount decimal(10,2) not null,
  currency text default 'NOK',
  status text default 'active',
  start_date date not null,
  end_date date,
  billing_cycle_start date,
  next_billing_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists payment_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  plan_id uuid references payment_plans(id) on delete set null,
  amount decimal(10,2) not null,
  currency text default 'NOK',
  status text default 'pending',
  payment_method text,
  transaction_id text,
  created_at timestamptz default now()
);

create table if not exists payment_months (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  month text not null,
  paid boolean default false,
  paid_at timestamptz,
  dugnad boolean default false,
  unique(user_id, month)
);

create table if not exists admin_users (
  user_id uuid primary key references profiles(id) on delete cascade
);

-- Hoodie merch: one registration per participant (user_id), size selection, pay via Vipps 550383
create table if not exists hoodie_registrations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  size text not null check (size in ('XS', 'S', 'M', 'L', 'XL', 'XXL')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

create table if not exists app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- Minor events: goal, attendees, duration, status, type, tagged participants, notes, todos, program
create table if not exists minor_events (
  id uuid primary key default uuid_generate_v4(),
  title text not null default 'Ny arrangement',
  event_date date,
  location text,
  goal text,
  expected_attendees int,
  duration text,
  status text,
  event_type text,
  preparation_deadline date,
  equipment_list jsonb default '[]'::jsonb,
  rain_plan text,
  reminder_list jsonb default '[]'::jsonb,
  notes text,
  todos jsonb default '[]'::jsonb,
  program jsonb default '[]'::jsonb,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists budget_items (
  id uuid primary key default uuid_generate_v4(),
  category text not null check (category in ('meals', 'activities', 'transportation', 'staying_places', 'equipment', 'administration', 'buffer', 'other')),
  name text not null,
  budgeted decimal(12,2) not null default 0,
  actual decimal(12,2),
  notes text,
  sort_order int default 0,
  due_date date,
  deposit decimal(12,2),
  alert_days_before int,
  attachments jsonb default '[]'::jsonb
);

-- RLS
alter table profiles enable row level security;
alter table trip_days enable row level security;
alter table activities enable row level security;
alter table signups enable row level security;
alter table info_pages enable row level security;
alter table feedback enable row level security;
alter table quotes enable row level security;
alter table photos enable row level security;
alter table payment_plans enable row level security;
alter table payment_transactions enable row level security;
alter table payment_months enable row level security;
alter table admin_users enable row level security;
alter table app_settings enable row level security;
alter table minor_events enable row level security;
alter table budget_items enable row level security;
alter table hoodie_registrations enable row level security;

drop policy if exists "Enable all access for profiles" on profiles;
drop policy if exists "Enable all access for trip_days" on trip_days;
drop policy if exists "Enable all access for activities" on activities;
drop policy if exists "Enable all access for signups" on signups;
drop policy if exists "Enable all access for info_pages" on info_pages;
drop policy if exists "Enable all access for feedback" on feedback;
drop policy if exists "Enable all access for quotes" on quotes;
drop policy if exists "Enable all access for photos" on photos;
drop policy if exists "Enable all access for payment_plans" on payment_plans;
drop policy if exists "Enable all access for payment_transactions" on payment_transactions;
drop policy if exists "Enable all access for payment_months" on payment_months;
drop policy if exists "Enable all access for admin_users" on admin_users;
drop policy if exists "Enable all access for app_settings" on app_settings;
drop policy if exists "Enable all access for minor_events" on minor_events;
drop policy if exists "Enable all access for budget_items" on budget_items;
drop policy if exists "Enable all access for hoodie_registrations" on hoodie_registrations;

create policy "Enable all access for profiles" on profiles for all using (true) with check (true);
create policy "Enable all access for trip_days" on trip_days for all using (true) with check (true);
create policy "Enable all access for activities" on activities for all using (true) with check (true);
create policy "Enable all access for signups" on signups for all using (true) with check (true);
create policy "Enable all access for info_pages" on info_pages for all using (true) with check (true);
create policy "Enable all access for feedback" on feedback for all using (true) with check (true);
create policy "Enable all access for quotes" on quotes for all using (true) with check (true);
create policy "Enable all access for photos" on photos for all using (true) with check (true);
create policy "Enable all access for payment_plans" on payment_plans for all using (true) with check (true);
create policy "Enable all access for payment_transactions" on payment_transactions for all using (true) with check (true);
create policy "Enable all access for payment_months" on payment_months for all using (true) with check (true);
create policy "Enable all access for admin_users" on admin_users for all using (true) with check (true);
create policy "Enable all access for app_settings" on app_settings for all using (true) with check (true);
create policy "Enable all access for minor_events" on minor_events for all using (true) with check (true);
create policy "Enable all access for budget_items" on budget_items for all using (true) with check (true);
create policy "Enable all access for hoodie_registrations" on hoodie_registrations for all using (true) with check (true);

-- Migrations: add columns if missing
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'email') then
    alter table profiles add column email text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'phone') then
    alter table profiles add column phone text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'birth_date') then
    alter table profiles add column birth_date date;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'age') then
    alter table profiles add column age int;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'feedback' and column_name = 'ratings') then
    alter table feedback add column ratings jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'feedback' and column_name = 'highlights') then
    alter table feedback add column highlights text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'feedback' and column_name = 'improvements') then
    alter table feedback add column improvements text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'activities' and column_name = 'price') then
    alter table activities add column price text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'activities' and column_name = 'driving_length') then
    alter table activities add column driving_length text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'activities' and column_name = 'link') then
    alter table activities add column link text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'budget_items' and column_name = 'due_date') then
    alter table budget_items add column due_date date;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'budget_items' and column_name = 'deposit') then
    alter table budget_items add column deposit decimal(12,2);
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'budget_items' and column_name = 'alert_days_before') then
    alter table budget_items add column alert_days_before int;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'budget_items' and column_name = 'attachments') then
    alter table budget_items add column attachments jsonb default '[]'::jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'minor_events' and column_name = 'goal') then
    alter table minor_events add column goal text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'minor_events' and column_name = 'expected_attendees') then
    alter table minor_events add column expected_attendees int;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'minor_events' and column_name = 'duration') then
    alter table minor_events add column duration text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'minor_events' and column_name = 'status') then
    alter table minor_events add column status text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'minor_events' and column_name = 'event_type') then
    alter table minor_events add column event_type text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'minor_events' and column_name = 'tagged_participant_ids') then
    alter table minor_events add column tagged_participant_ids jsonb default '[]'::jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'minor_events' and column_name = 'preparation_deadline') then
    alter table minor_events add column preparation_deadline date;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'minor_events' and column_name = 'equipment_list') then
    alter table minor_events add column equipment_list jsonb default '[]'::jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'minor_events' and column_name = 'reminder_list') then
    alter table minor_events add column reminder_list jsonb default '[]'::jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'minor_events' and column_name = 'rain_plan') then
    alter table minor_events add column rain_plan text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'minor_events' and column_name = 'reminders') then
    alter table minor_events add column reminders text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'minor_events' and column_name = 'equipment_needed') then
    alter table minor_events add column equipment_needed text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payment_months' and column_name = 'dugnad') then
    alter table payment_months add column dugnad boolean default false;
  end if;
end $$;

-- Budget category constraint
do $$
declare
  conname text;
begin
  select c.conname into conname
  from pg_constraint c
  join pg_class t on c.conrelid = t.oid
  where t.relname = 'budget_items' and c.contype = 'c'
  limit 1;
  if conname is not null then
    execute format('alter table budget_items drop constraint if exists %I', conname);
  end if;
  alter table budget_items add constraint budget_items_category_check
    check (category in ('meals', 'activities', 'transportation', 'staying_places', 'equipment', 'administration', 'buffer', 'other'));
exception
  when duplicate_object then null;
end $$;

-- Storage: cannot be set up here (storage.objects is owned by Supabase).
-- Create buckets in Dashboard → Storage: add buckets "photos" and "budget-attachments",
-- set them to Public, and add policies to allow SELECT and INSERT for all.

-- Realtime (optional)
alter table quotes replica identity full;
alter table photos replica identity full;
alter table payment_months replica identity full;
do $$
begin
  alter publication supabase_realtime add table quotes;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table photos;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table payment_months;
exception when duplicate_object then null;
end $$;
