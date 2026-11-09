DIG BUILD - Stage 4: Spectator mode + ore X-ray
Deploy: upload this folder as-is to Netlify (publish dir "."). Single-file build: dig-build.html (needs internet only for the Three.js CDN).
Tests (no browser needed):  node tests/logic.test.mjs   and   node tests/mode.test.mjs  (runs the real main.js against a stubbed browser)
SPECTATOR: pick it in the mode dropdown. WASD move, Space up, Shift down, mouse look, X toggles X-ray (ON by default).
 - Passes through all blocks, no gravity/collision/swimming. Cannot mine, place, collect, open the inventory, use Workbench/Furnace, or change durability.
 - On an existing Survival/Creative world it is strictly read-only: nothing (blocks, inventory, furnaces, position) is written back.
 - A brand-new world created as Spectator is saved once as mode=spectator; picking Survival/Creative later converts it.
X-RAY: terrain turns dark + semi-transparent; every real ore (from the voxel data) gets a marker drawn through any number of blocks:
 coal = dark grey + light outline, iron = orange-brown glow, gold = yellow glow, diamond = bright cyan glow. Materials only - world data and textures are never touched.
Everything from earlier stages (caves, ores, furnace, tools, inventory, water, saves, Supabase config) is unchanged.
