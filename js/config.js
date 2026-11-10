// Public values only (anon/publishable key is safe in the browser; RLS protects data). NEVER put a service-role key here.
export const SUPABASE_URL = '';      // e.g. https://xxxx.supabase.co
export const SUPABASE_ANON_KEY = ''; // anon / publishable key
export const GEN_VERSION = 3;        // generation used for NEW worlds (v2 = more water, v3 = caves + ores). Saved worlds keep their own gen_version (v1 stays identical).
export const SAVE_FORMAT = 4;        // bump + add a migration in save.js when save shape changes
