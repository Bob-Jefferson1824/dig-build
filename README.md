# DIG BUILD – Stage 1
Run locally: `npx serve .` (ES modules need http, not file://), open the URL in Chrome/Edge/Firefox. Works offline-only until Supabase is configured.
Supabase: create a project, run `supabase/migrations/001_init.sql` in the SQL editor, enable Email auth, put the project URL and anon/publishable key in `js/config.js`. Never use the service-role key in the browser.
Netlify: drag-drop this folder or connect the repo (publish dir `.`). Deploys only replace website files; player data lives in Supabase and is never touched. Add new migrations as 002_*.sql, 003_*.sql; never edit applied ones.
Save format changes: bump SAVE_FORMAT in config.js and add a step in `migrate()` in js/save.js.
