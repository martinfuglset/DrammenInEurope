-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create tables (if they don't exist)
create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  display_name text not null,
  role text default 'participant'
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

-- Enable RLS
alter table profiles enable row level security;
alter table trip_days enable row level security;
alter table activities enable row level security;
alter table signups enable row level security;

-- Drop existing policies to avoid "policy already exists" errors
drop policy if exists "Enable all access for profiles" on profiles;
drop policy if exists "Enable all access for trip_days" on trip_days;
drop policy if exists "Enable all access for activities" on activities;
drop policy if exists "Enable all access for signups" on signups;

-- Create policies
create policy "Enable all access for profiles" on profiles for all using (true) with check (true);
create policy "Enable all access for trip_days" on trip_days for all using (true) with check (true);
create policy "Enable all access for activities" on activities for all using (true) with check (true);
create policy "Enable all access for signups" on signups for all using (true) with check (true);

-- Optional: Seed Data (Uncomment if you want to insert sample data)
/*
insert into profiles (id, full_name, display_name, role) values
('u1', 'Elena Svendsen', 'Elena S.', 'participant'),
('u2', 'Jonas Berg', 'Jonas B.', 'participant'),
('u3', 'Isak Håland', 'Isak H.', 'participant'),
('u4', 'Maria Nilsen', 'Maria N.', 'participant');

insert into trip_days (id, date, title, description, is_choice_day, schedule_items) values
('d1', '2026-06-20', 'Dag 1: Ankomst & Velkomst', 'Vi lander i paradiset. Innsjekk og felles middag.', false, 
'[{"time": "14:00", "activity": "Ankomst Gardermoen", "location": "Oppmøte ved tog"}, {"time": "18:00", "activity": "Landing i Nice", "location": "Terminal 1"}, {"time": "20:30", "activity": "Velkomstmiddag", "location": "Hotel Plaza"}]'),
('d2', '2026-06-21', 'Dag 2: Utforsk Drammen (i Europa)', 'Valgfri aktivitetsdag! Velg hva du vil gjøre på formiddagen.', true, 
'[{"time": "09:00", "activity": "Frokost", "location": "Hotellet"}, {"time": "10:00", "activity": "VALGFRI AKTIVITET", "location": "Ulike steder"}, {"time": "19:00", "activity": "Felles Pizza", "location": "Piazza del Popolo"}]'),
('d3', '2026-06-22', 'Dag 3: Hjemreise', 'Takk for turen!', false, 
'[{"time": "10:00", "activity": "Utsjekk"}, {"time": "12:00", "activity": "Buss til flyplassen"}]');

insert into activities (id, title, time_start, time_end, location, meeting_point, transport, description, tags, capacity_max) values
('act1', 'Via Ferrata Klatring', '10:00', '14:00', 'Fjellveggen Øst', 'Lobbyen', 'Minibuss (20 min)', 'For de som liker høyder og adrenalin.', ARRAY['Adrenalin', 'Fysisk', 'Utsikt'], 8),
('act2', 'Byvandring & Gelato', '11:00', '13:00', 'Gamlebyen', 'Fontenen', 'Gange', 'En rolig tur gjennom historiske gater.', ARRAY['Rolig', 'Kultur', 'Mat'], 20),
('act3', 'Strand & Volleyball', '10:30', '15:00', 'Blue Beach', 'Lobbyen', 'Trikk (10 min)', 'Vi reserverer en del av stranden.', ARRAY['Sosialt', 'Badetøy', 'Sport'], 15);
*/
