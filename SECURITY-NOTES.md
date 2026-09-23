# Security review — v2.26

## Fixed in this branch

- Highscore names and numeric fields no longer interpolate untrusted HTML.
- The legacy SQL migration and its text copy no longer contain a fixed admin credential or overwrite an existing one. Fresh installations get a random server-generated code.
- Automated tests mock external services before page load, so fixtures cannot create production records.

## Action needed before production rollout

A fixed admin code was previously committed to this public repository. Removing it from the current files does **not** remove it from Git history or invalidate it in Supabase. Treat the old code as exposed. In the authenticated Supabase dashboard, replace the stored admin code with a newly generated private value and invalidate any sessions using the old value. Do not paste the new value into this repository, a pull request or chat.

No live admin login was attempted and no SQL migration was executed during this review. Whether the historical code is still active is unknown. Review access/activity logs if it was used in production.

## Existing architectural limits

- Public scores and several statistics are submitted by the browser. A motivated caller can forge them; the practice flag is a UX/data-quality boundary, not an anti-cheat boundary.
- Device UUIDs identify ownership of Café messages; they are not authenticated user sessions.
- The admin portal uses a shared code and session storage, not individual accounts. Moving to Supabase Auth with roles, rate limiting and revocable sessions is a separate backend change.
- Public aggregate analytics are intentionally granted to `anon` by SQL 007. Confirm that these aggregates are intended to be public.
- The publishable Supabase key in config.js is client configuration, not an admin credential. RLS and RPC authorization must enforce backend permissions.

The checked-in migrations do not prove the current database schema or policies. Live RLS, backups, migrations, real browser audio, real-device touch behavior and actual server-side persistence require a staging/production verification pass.
