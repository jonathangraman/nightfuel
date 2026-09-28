-- Run once in the existing project's SQL editor. Safe to rerun; no existing meal data changes.
begin;
create table if not exists public.nf_recipes (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists nf_recipes_user_id_idx on public.nf_recipes(user_id);
alter table public.nf_recipes enable row level security;
revoke all on public.nf_recipes from anon;
grant select, insert, update, delete on public.nf_recipes to authenticated;
drop policy if exists "Own cookbook recipes" on public.nf_recipes;
create policy "Own cookbook recipes" on public.nf_recipes for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
commit;
