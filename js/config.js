// Public values only (anon/publishable key is safe in the browser; RLS protects data). NEVER put a service-role key here.
export const SUPABASE_URL = '';      // e.g. https://xxxx.supabase.co
export const SUPABASE_ANON_KEY = ''; // anon / publishable key
export const GEN_VERSION = 4;        // Stage 9: 192-block worlds, connected cave networks and natural ore veins. Existing worlds retain their generation.
export const SAVE_FORMAT = 4;        // bump + add a migration in save.js when save shape changes
