-- Safe to rerun: existing meal data is preserved.
-- Existing installations already using user_id need no migration for the v2 app.
-- The complete app snapshot is stored atomically in nf_week.data; the other
-- tables remain available to import favorites/history written by older versions.
begin;
create table if not exists public.nf_week (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data text not null,
  updated_at timestamptz default now()
);
create table if not exists public.nf_favorites (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data text not null,
  updated_at timestamptz default now()
);
create table if not exists public.nf_history (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data text not null,
  updated_at timestamptz default now()
);
alter table public.nf_week enable row level security;
alter table public.nf_favorites enable row level security;
alter table public.nf_history enable row level security;
drop policy if exists "Users own their week" on public.nf_week;
drop policy if exists "Users own their favorites" on public.nf_favorites;
drop policy if exists "Users own their history" on public.nf_history;
create policy "Users own their week" on public.nf_week for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users own their favorites" on public.nf_favorites for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users own their history" on public.nf_history for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
commit;
-- Authentication settings: enable Email, set Site URL to the deployment URL,
-- allow the /?recovery=1 redirect, and disable new signups for a personal app.
