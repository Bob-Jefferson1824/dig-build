# DIG BUILD - Stage 5: World Management

A 3D voxel sandbox (HTML + CSS + JavaScript + Three.js). Survival, Creative and Spectator (ore X-ray) modes, caves, ores, tools, crafting, furnace, water - and now **many independent worlds per player**.

## Run locally
ES modules need http (not file://):  `npx serve .`  then open the shown URL (Chrome, Edge or Firefox).
`dig-build.html` is the same game as one self-contained file (needs internet only for the Three.js CDN).

## Deploy (GitHub Pages / Netlify)
`index.html` is in the project root. **GitHub Pages:** push the files to a repo, Settings -> Pages -> deploy from branch `/ (root)`. `.nojekyll` is included. **Netlify:** drag the folder in (publish directory `.`). Deploys replace only website files; player data lives in the browser (IndexedDB) and in Supabase.

## World management
* Main Menu -> **PLAY** opens **World Select**: a scrolling list of cards (terrain thumbnail, name, mode, seed, last played, playtime, last-saved/sync status) with **PLAY, SPECTATE, RENAME, DUPLICATE, DELETE**. Empty state, Back button, responsive layout.
* **CREATE NEW WORLD**: name, Survival/Creative, seed (random button or your own text), live preview. Creating never overwrites anything.
* Every world has a unique id (names can repeat). Each world stores its own seed, mode, position + rotation, inventory/hotbar/crafting grid, tool durability, furnaces, playtime and every block change. Switching worlds saves the one you leave first and loads the other from its own record only.
* **Duplicate** = an independent copy (new id, editable name). **Delete** asks for confirmation and removes only that world (and, in the cloud, only that row). Deleting the world you are standing in returns you to World Select.
* **SPECTATE** opens any world read-only (nothing is written back).
* `world time`: the game has no day/night cycle yet, so the saved "time" is the playtime counter.

## Saves
* Local: IndexedDB database `digbuild` v2 - store `worlds` (full records, key `owner|worldId`) and store `index` (small metadata for the list). A save writes both in **one transaction** (all-or-nothing). Works with no Supabase at all.
* Stage 4 saves (keys `world-<seed>`) are converted automatically on first launch into real worlds (deterministic id, same name/seed/mode/inventory/position/edits). The old raw record is left in place as a backup; running the migration again changes nothing. Deleting a migrated world also removes its own raw copy so it cannot reappear.
* Cloud (optional): see below. Without a login worlds belong to "this device". A button on World Select imports a device's local worlds into the account you are logged in to.
* `SAVE_FORMAT` is 4; old formats are upgraded by `migrate()` in `js/save.js` (never destructive).

## Supabase
1. Create a project, enable Email auth.
2. SQL editor: run `supabase/migrations/001_init.sql`, then `supabase/migrations/002_world_management.sql` (adds `world_id`, `display_name`, `playtime_s` and a unique index; only adds, safe to re-run; Row Level Security unchanged: users only see their own rows).
3. Put your project URL and anon/publishable key in `js/config.js`. **Never** put a service-role key in the browser.
Existing Stage 4 cloud rows get their `world_id` automatically the next time that player logs in. New worlds use their id as the row's `name`, so the old unique(user_id,name) rule keeps working and several worlds can share a display name. Deleting a world deletes only that account's row for it; if you are offline the delete is remembered and retried (the world will not come back).

## Tests (Node, no browser)
`node tests/logic.test.mjs` - game logic, world storage (fake IndexedDB), cloud logic (fake Supabase with RLS rules), migration, UI card HTML.
`node tests/mode.test.mjs` - runs the real `main.js` against a stubbed browser: create/switch/rename/duplicate/delete worlds, legacy migration, modes.
(`PREV=old_world.js ORIG=older_world.js node tests/logic.test.mjs` also checks that old terrain generation is unchanged.)
These do not render pixels and do not talk to a real Supabase server.
