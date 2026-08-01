# TODO — Fix "Container manugent-db-1 Error dependency db failed to start"

## Context
- **Error:** `✘ Container manugent-db-1 Error dependency db failed to start`
- **Root cause:** `docker/postgres/init/005_user_status_and_admin_actions.sql:87` runs
  `grant execute on function get_users_with_teams() to anon, authenticated;`
  but roles `anon`/`authenticated` only exist in Supabase, not in the standalone
  `postgres:16-alpine` container. The init aborted, so the api container's
  `depends_on: db (service_healthy)` failed.

## Steps
- [x] Diagnose: inspect docker-compose.yml, init SQL scripts, container logs
- [x] Confirm root cause in logs: `ERROR: role "anon" does not exist`
- [x] Fix `005_user_status_and_admin_actions.sql`:
      replace unconditional GRANT with a conditional DO block that only grants
      when the `anon` / `authenticated` roles actually exist
- [x] Recreate dev DB volume & rebuild: `docker compose down -v` + `docker compose up --build -d`
- [x] Verify: all 5 init scripts run without errors, both containers healthy,
      RPC functions `admin_set_user_status` / `admin_reset_user_password` exist
      (confirmed via pg_proc; `database: true` in /api/health; 5 demo users seeded)

