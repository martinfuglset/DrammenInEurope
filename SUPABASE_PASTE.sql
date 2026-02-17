-- =============================================================================
-- UTUR – Complete Supabase Setup
-- Paste in: Dashboard → SQL Editor → New query → Run
-- Safe to run multiple times (idempotent).
--
-- BEFORE running this, enable Anonymous Auth:
--   Dashboard → Authentication → Providers → Anonymous Sign-Ins → Enable
-- =============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- =============================================================================
-- 2. TABLES
-- =============================================================================

-- Participants / users
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

-- Trip day cards (program)
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

-- Activity options (for choice days)
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

-- Signups (participant → activity)
create table if not exists signups (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  activity_id uuid references activities(id) on delete cascade,
  status text default 'confirmed',
  created_at timestamptz default now(),
  unique(user_id, activity_id)
);

-- Editable info/content pages (noticeboard, packing list, rules, etc.)
create table if not exists info_pages (
  slug text primary key,
  title text,
  content text,
  updated_at timestamptz default now()
);

-- Feedback from participants
create table if not exists feedback (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete set null,
  message text not null,
  ratings jsonb,
  highlights text,
  improvements text,
  created_at timestamptz default now()
);

-- Quotes (photodrop)
create table if not exists quotes (
  id uuid primary key default uuid_generate_v4(),
  text text not null,
  author text not null,
  submitted_by uuid references profiles(id) on delete set null,
  likes int default 0,
  created_at timestamptz default now()
);

-- Photos (photodrop)
create table if not exists photos (
  id uuid primary key default uuid_generate_v4(),
  url text not null,
  caption text,
  uploaded_by uuid references profiles(id) on delete set null,
  width int,
  height int,
  created_at timestamptz default now()
);

-- Payment plans
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

-- Payment transactions
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

-- Monthly payment tracking (vipps or dugnad per month)
create table if not exists payment_months (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  month text not null,
  paid boolean default false,
  paid_at timestamptz,
  dugnad boolean default false,
  unique(user_id, month)
);

-- Admin users (participants granted admin access)
create table if not exists admin_users (
  user_id uuid primary key references profiles(id) on delete cascade
);

-- Hoodie merch registration (one per participant)
create table if not exists hoodie_registrations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  size text not null check (size in ('XS', 'S', 'M', 'L', 'XL', 'XXL')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- App settings (key-value store for config)
create table if not exists app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- Minor events (feast, gathering, etc.)
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
  equipment_needed text,
  rain_plan text,
  reminders text,
  reminder_list jsonb default '[]'::jsonb,
  tagged_participant_ids jsonb default '[]'::jsonb,
  notes text,
  todos jsonb default '[]'::jsonb,
  program jsonb default '[]'::jsonb,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trip places (admin map)
create table if not exists trip_places (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  country text,
  lat double precision,
  lon double precision,
  is_airport boolean default false,
  notes text,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Admin notes and lists (admin scratchpad)
create table if not exists admin_notes_lists (
  id uuid primary key default uuid_generate_v4(),
  kind text not null check (kind in ('note', 'list')),
  title text not null default '',
  content text default '',
  items jsonb default '[]'::jsonb,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references profiles(id) on delete set null
);

-- Budget items (admin only)
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

-- =============================================================================
-- 3. MIGRATIONS – add columns if they don't exist yet (safe for existing DBs)
-- =============================================================================
do $$
begin
  -- profiles
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='email') then
    alter table profiles add column email text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='phone') then
    alter table profiles add column phone text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='birth_date') then
    alter table profiles add column birth_date date;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='age') then
    alter table profiles add column age int;
  end if;

  -- feedback
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='feedback' and column_name='ratings') then
    alter table feedback add column ratings jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='feedback' and column_name='highlights') then
    alter table feedback add column highlights text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='feedback' and column_name='improvements') then
    alter table feedback add column improvements text;
  end if;

  -- activities
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='activities' and column_name='price') then
    alter table activities add column price text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='activities' and column_name='driving_length') then
    alter table activities add column driving_length text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='activities' and column_name='link') then
    alter table activities add column link text;
  end if;

  -- budget_items
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='budget_items' and column_name='due_date') then
    alter table budget_items add column due_date date;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='budget_items' and column_name='deposit') then
    alter table budget_items add column deposit decimal(12,2);
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='budget_items' and column_name='alert_days_before') then
    alter table budget_items add column alert_days_before int;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='budget_items' and column_name='attachments') then
    alter table budget_items add column attachments jsonb default '[]'::jsonb;
  end if;

  -- minor_events
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='minor_events' and column_name='goal') then
    alter table minor_events add column goal text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='minor_events' and column_name='expected_attendees') then
    alter table minor_events add column expected_attendees int;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='minor_events' and column_name='duration') then
    alter table minor_events add column duration text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='minor_events' and column_name='status') then
    alter table minor_events add column status text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='minor_events' and column_name='event_type') then
    alter table minor_events add column event_type text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='minor_events' and column_name='tagged_participant_ids') then
    alter table minor_events add column tagged_participant_ids jsonb default '[]'::jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='minor_events' and column_name='preparation_deadline') then
    alter table minor_events add column preparation_deadline date;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='minor_events' and column_name='equipment_list') then
    alter table minor_events add column equipment_list jsonb default '[]'::jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='minor_events' and column_name='reminder_list') then
    alter table minor_events add column reminder_list jsonb default '[]'::jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='minor_events' and column_name='rain_plan') then
    alter table minor_events add column rain_plan text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='minor_events' and column_name='reminders') then
    alter table minor_events add column reminders text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='minor_events' and column_name='equipment_needed') then
    alter table minor_events add column equipment_needed text;
  end if;

  -- payment_months
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='payment_months' and column_name='dugnad') then
    alter table payment_months add column dugnad boolean default false;
  end if;

  -- trip_places
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='trip_places' and column_name='country') then
    alter table trip_places add column country text;
  end if;

  -- admin_notes_lists
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='admin_notes_lists' and column_name='created_by') then
    alter table admin_notes_lists add column created_by uuid references profiles(id) on delete set null;
  end if;
end $$;

-- Budget category constraint (refresh to include all categories)
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
    check (category in ('meals','activities','transportation','staying_places','equipment','administration','buffer','other'));
exception
  when duplicate_object then null;
end $$;

-- =============================================================================
-- 4. ROW LEVEL SECURITY (enable + open policies for anon access)
-- =============================================================================
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
alter table hoodie_registrations enable row level security;
alter table app_settings enable row level security;
alter table minor_events enable row level security;
alter table trip_places enable row level security;
alter table admin_notes_lists enable row level security;
alter table budget_items enable row level security;

-- Drop then re-create so it's always clean
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
drop policy if exists "Enable all access for hoodie_registrations" on hoodie_registrations;
drop policy if exists "Enable all access for app_settings" on app_settings;
drop policy if exists "Enable all access for minor_events" on minor_events;
drop policy if exists "Enable all access for trip_places" on trip_places;
drop policy if exists "Enable all access for admin_notes_lists" on admin_notes_lists;
drop policy if exists "Enable all access for budget_items" on budget_items;

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
create policy "Enable all access for hoodie_registrations" on hoodie_registrations for all using (true) with check (true);
create policy "Enable all access for app_settings" on app_settings for all using (true) with check (true);
create policy "Enable all access for minor_events" on minor_events for all using (true) with check (true);
create policy "Enable all access for trip_places" on trip_places for all using (true) with check (true);
create policy "Enable all access for admin_notes_lists" on admin_notes_lists for all using (true) with check (true);
create policy "Enable all access for budget_items" on budget_items for all using (true) with check (true);

-- =============================================================================
-- 5. STORAGE BUCKETS (photos + budget attachments)
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('budget-attachments', 'budget-attachments', true)
on conflict (id) do update set public = true;

-- (storage.objects RLS is already enabled by Supabase)

-- Photos bucket policies
drop policy if exists "Public read photos" on storage.objects;
create policy "Public read photos"
  on storage.objects for select
  using (bucket_id = 'photos');

drop policy if exists "Public insert photos" on storage.objects;
create policy "Public insert photos"
  on storage.objects for insert
  with check (bucket_id = 'photos');

-- Budget attachments bucket policies
drop policy if exists "Public read budget-attachments" on storage.objects;
create policy "Public read budget-attachments"
  on storage.objects for select
  using (bucket_id = 'budget-attachments');

drop policy if exists "Public insert budget-attachments" on storage.objects;
create policy "Public insert budget-attachments"
  on storage.objects for insert
  with check (bucket_id = 'budget-attachments');

-- =============================================================================
-- 6. REALTIME (live updates for quotes, photos, payment tracking)
-- =============================================================================
alter table quotes replica identity full;
alter table photos replica identity full;
alter table payment_months replica identity full;

do $$ begin
  alter publication supabase_realtime add table quotes;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table photos;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table payment_months;
exception when duplicate_object then null;
end $$;

-- =============================================================================
-- 7. DEFAULT DATA
-- =============================================================================

-- Default app settings (empty hidden sections = everything visible)
insert into app_settings (key, value, updated_at)
values ('participant_hidden_sections', '[]'::jsonb, now())
on conflict (key) do nothing;

-- Default info pages (so they exist for editing)
insert into info_pages (slug, title, content, updated_at) values
  ('noticeboard', 'Oppslagstavle', '', now()),
  ('groups', 'Grupper', '', now()),
  ('todays-plans', 'Dagens Planer', '', now()),
  ('packing-list', 'Pakkeliste', '', now()),
  ('rules', 'Regler', '', now())
on conflict (slug) do nothing;

-- =============================================================================
-- DONE! Next steps:
--   1. Enable Anonymous Auth: Dashboard → Authentication → Providers
--      → Anonymous Sign-Ins → toggle ON
--   2. Copy your project URL and anon key into .env:
--      VITE_SUPABASE_URL=https://your-project.supabase.co
--      VITE_SUPABASE_ANON_KEY=your-anon-key
--   3. Run: npm run dev
-- =============================================================================
