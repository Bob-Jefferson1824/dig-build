-- Safe to re-run. NEVER add DROP TABLE here. Back up before any destructive migration.
create table if not exists public.worlds(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 name text not null, seed text not null, mode text not null default 'survival',
 gen_version int not null default 1, save_format int not null default 1,
 data jsonb not null default '{}', settings jsonb not null default '{}',
 created_at timestamptz not null default now(), last_played timestamptz not null default now(),
 unique(user_id,name));
create table if not exists public.world_backups(
 id uuid primary key default gen_random_uuid(), world_id uuid not null references public.worlds(id) on delete cascade,
 user_id uuid not null, data jsonb not null, created_at timestamptz not null default now());
alter table public.worlds enable row level security;
alter table public.world_backups enable row level security;
do $$ begin
 if not exists(select 1 from pg_policies where tablename='worlds' and policyname='own worlds') then
  create policy "own worlds" on public.worlds for all using (auth.uid()=user_id) with check (auth.uid()=user_id); end if;
 if not exists(select 1 from pg_policies where tablename='world_backups' and policyname='own backups') then
  create policy "own backups" on public.world_backups for all using (auth.uid()=user_id) with check (auth.uid()=user_id); end if;
end $$;
