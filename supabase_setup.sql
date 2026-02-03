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

-- Budget items (admin only: meals, activities, transportation, staying places, other)
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
alter table budget_items enable row level security;

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
drop policy if exists "Enable all access for budget_items" on budget_items;

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
create policy "Enable all access for budget_items" on budget_items for all using (true) with check (true);

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
  if not exists (select 1 from information_schema.columns where table_name = 'activities' and column_name = 'price') then
    alter table activities add column price text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'activities' and column_name = 'driving_length') then
    alter table activities add column driving_length text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'activities' and column_name = 'link') then
    alter table activities add column link text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'budget_items' and column_name = 'due_date') then
    alter table budget_items add column due_date date;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'budget_items' and column_name = 'deposit') then
    alter table budget_items add column deposit decimal(12,2);
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'budget_items' and column_name = 'alert_days_before') then
    alter table budget_items add column alert_days_before int;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'budget_items' and column_name = 'attachments') then
    alter table budget_items add column attachments jsonb default '[]'::jsonb;
  end if;
end $$;

-- Extend budget_items category check to include new categories (for existing DBs)
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
  when duplicate_object then null; -- constraint already exists with new values
end $$;

-- STORAGE SETUP INSTRUCTIONS:
-- 1. Create a public bucket named 'photos' in Supabase Storage.
-- 2. Add policy to allow public access (SELECT, INSERT) to 'photos' bucket.

-- STORAGE SETUP (SQL): creates bucket + policies if missing
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do update set public = true;

alter table storage.objects enable row level security;

drop policy if exists "Public read photos" on storage.objects;
create policy "Public read photos"
  on storage.objects for select
  using (bucket_id = 'photos');

drop policy if exists "Public insert photos" on storage.objects;
create policy "Public insert photos"
  on storage.objects for insert
  with check (bucket_id = 'photos');

-- Budget attachments bucket (avtaler, kvitteringer osv.)
insert into storage.buckets (id, name, public)
values ('budget-attachments', 'budget-attachments', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read budget-attachments" on storage.objects;
create policy "Public read budget-attachments"
  on storage.objects for select
  using (bucket_id = 'budget-attachments');

drop policy if exists "Public insert budget-attachments" on storage.objects;
create policy "Public insert budget-attachments"
  on storage.objects for insert
  with check (bucket_id = 'budget-attachments');

-- Enable realtime for feed updates (optional but recommended)
alter table quotes replica identity full;
alter table photos replica identity full;
alter publication supabase_realtime add table quotes;
alter publication supabase_realtime add table photos;
