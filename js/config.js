// Public values only (anon/publishable key is safe in the browser; RLS protects data). NEVER put a service-role key here.
export const SUPABASE_URL = '';      // e.g. https://xxxx.supabase.co
export const SUPABASE_ANON_KEY = ''; // anon / publishable key
export const GEN_VERSION = 5;        // Stage 9: biome terrain and vegetation. Existing worlds retain their saved generation version.
export const SAVE_FORMAT = 4;        // bump + add a migration in save.js when save shape changes
