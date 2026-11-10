-- DIG BUILD stage 5: multiple independent worlds per player.  Safe to run more than once; adds only, never drops or rewrites existing data.
-- Existing rows (Stage 4 worlds) keep working: the game assigns them a world_id on the player's next login.
alter table public.worlds add column if not exists world_id text;       -- unique id of the world (client generated). NULL for Stage-4 rows until migrated by the game.
alter table public.worlds add column if not exists display_name text;   -- what the player calls the world; several worlds may share a name
alter table public.worlds add column if not exists playtime_s integer not null default 0;
-- one row per (player, world). NULL world_ids (not yet migrated rows) are allowed to repeat.
create unique index if not exists worlds_user_world_id_idx on public.worlds (user_id, world_id);
-- Row Level Security from 001_init.sql ("own worlds": auth.uid() = user_id for select/insert/update/delete) already covers the new columns.
-- Re-assert it defensively (no-ops if already enabled / present):
alter table public.worlds enable row level security;
do $$ begin
 if not exists(select 1 from pg_policies where tablename='worlds' and policyname='own worlds') then
  create policy "own worlds" on public.worlds for all using (auth.uid()=user_id) with check (auth.uid()=user_id); end if;
end $$;
-- NOTE: new worlds store their id in the existing "name" column too, so the old unique(user_id,name) rule keeps holding without being changed.
-- Deleting a world deletes only that row (and, through the existing ON DELETE CASCADE, that world's own backups in world_backups).
