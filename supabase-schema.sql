-- Run this in your Supabase dashboard → SQL Editor
-- Creates the 3 tables NightFuel needs

-- Week plan
create table if not exists nf_week (
  household_id text primary key,
  data text not null,
  updated_at timestamptz default now()
);

-- Favorites
create table if not exists nf_favorites (
  household_id text primary key,
  data text not null,
  updated_at timestamptz default now()
);

-- Meal history
create table if not exists nf_history (
  household_id text primary key,
  data text not null,
  updated_at timestamptz default now()
);

-- Enable Row Level Security (open read/write for anon key — fine for personal app)
alter table nf_week enable row level security;
alter table nf_favorites enable row level security;
alter table nf_history enable row level security;

create policy "allow all" on nf_week for all using (true) with check (true);
create policy "allow all" on nf_favorites for all using (true) with check (true);
create policy "allow all" on nf_history for all using (true) with check (true);
