-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create tables (if they don't exist)
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
  sort_order serial
);

create table if not exists signups (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  activity_id uuid references activities(id) on delete cascade,
  status text default 'confirmed',
  created_at timestamptz default now(),
  unique(user_id, activity_id)
);

-- New tables for subpages
create table if not exists info_pages (
  slug text primary key,
  title text,
  content text, -- Can be JSON or HTML
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

-- Quotes Table
create table if not exists quotes (
  id uuid primary key default uuid_generate_v4(),
  text text not null,
  author text not null,
  submitted_by uuid references profiles(id) on delete set null,
  likes int default 0,
  created_at timestamptz default now()
);

-- Photos Table
create table if not exists photos (
  id uuid primary key default uuid_generate_v4(),
  url text not null,
  caption text,
  uploaded_by uuid references profiles(id) on delete set null,
  width int,
  height int,
  created_at timestamptz default now()
);

-- Payment Plans Table
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

-- Payment Transactions Table
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

-- Payment Month Tracking
create table if not exists payment_months (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  month text not null, -- YYYY-MM
  paid boolean default false,
  paid_at timestamptz,
  unique(user_id, month)
);

-- Enable RLS
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

-- Drop existing policies to avoid "policy already exists" errors
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

-- Create policies
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

-- Optional: Add columns if table already exists (migrations)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'email') then
    alter table profiles add column email text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'phone') then
    alter table profiles add column phone text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'birth_date') then
    alter table profiles add column birth_date date;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'age') then
    alter table profiles add column age int;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'feedback' and column_name = 'ratings') then
    alter table feedback add column ratings jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'feedback' and column_name = 'highlights') then
    alter table feedback add column highlights text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'feedback' and column_name = 'improvements') then
    alter table feedback add column improvements text;
  end if;
end $$;

-- STORAGE SETUP INSTRUCTIONS:
-- 1. Create a public bucket named 'photos' in Supabase Storage.
-- 2. Add policy to allow public access (SELECT, INSERT) to 'photos' bucket.
