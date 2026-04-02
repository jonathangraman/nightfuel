-- NightFuel Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor

-- Drop old tables if migrating from household_id approach
drop table if exists nf_week;
drop table if exists nf_favorites;
drop table if exists nf_history;

-- Week plan (one row per user)
create table nf_week (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data text not null,
  updated_at timestamptz default now()
);

-- Favorites
create table nf_favorites (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data text not null,
  updated_at timestamptz default now()
);

-- Meal history
create table nf_history (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data text not null,
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table nf_week      enable row level security;
alter table nf_favorites enable row level security;
alter table nf_history   enable row level security;

-- Users can only read/write their own data
create policy "Users own their week"      on nf_week      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users own their favorites" on nf_favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users own their history"   on nf_history   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Note: Magic Link auth is enabled by default in Supabase.
-- Go to Authentication → Providers → Email and confirm it's enabled.
-- You may want to disable "Confirm email" if you want instant access after magic link.
