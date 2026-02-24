# PM App Sync API (draft)

Goal: expose a **read-only** Web API so agents (and other tooling) can pull projects/tasks/sprint state from a deployed PM app (including TrueNAS + optional Cloudflare Tunnel deployments).

## Design principles
- **Read-only first**: no mutations until we’re confident about auth + auditability.
- **Single JSON schema**: stable, typed, versioned.
- **Local-first compatibility**: the server reads from `CLAWD_HOME` (clawd memory files) and from the app DB where applicable.

## Auth model
Two modes (same codepath):
1. **Tailscale-only (default)**: run behind tailnet; no auth header required.
2. **Shared token (for Cloudflare/public exposure)**:
   - Env var: `PM_SYNC_TOKEN` (random string)
   - Client sends header: `x-pm-sync-token: <token>`
   - If `PM_SYNC_TOKEN` is set, requests **must** include the correct header.

Implementation note: all `/api/sync/v1/*` endpoints enforce this guard when `PM_SYNC_TOKEN` is set.

Notes:
- This is intentionally simple and deployment-friendly.
- Later we can replace/augment with proper user auth (sessions/OAuth) if needed.

## Endpoints (v1)
All endpoints return JSON and set `Cache-Control: no-store`.

### `GET /api/sync/v1/meta`
Returns server metadata:
```json
{
  "version": "v1",
  "server_time": "2026-02-24T08:00:00+01:00",
  "clawd_home": "/path/or/null",
  "auth": { "mode": "none" | "token" }
}
```

### `GET /api/sync/v1/projects`
Returns active projects as known by clawd:
```json
{
  "projects": [
    {
      "project_id": "QA2",
      "name": "QuASAr 2.0",
      "status": "active",
      "priority": 1
    }
  ]
}
```
Source: `CLAWD_HOME/memory/projects/PROJECTS.json`

### `GET /api/sync/v1/sprints`
Returns sprint state + today’s sprint log snapshot:
```json
{
  "state": {
    "day": "2026-02-24",
    "active_project_id": "QA2",
    "active_sprint": "2026-02-23.5",
    "completed_project_ids": ["QA2", "TML"],
    "last_updated_at": "..."
  },
  "today": {
    "day": "2026-02-24",
    "sprints": [/* as in daily log */],
    "autopilot_runs": [/* as in daily log */]
  }
}
```
Sources:
- `CLAWD_HOME/memory/sprints/state.json`
- `CLAWD_HOME/memory/sprints/YYYY-MM-DD.json`

### `GET /api/sync/v1/tasks` (optional, phase 2)
If/when we want tasks from the app DB (ideas/kanban cards/etc.) we can add:
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "...",
      "status": "TODO",
      "project_id": "QA2",
      "created_at": "..."
    }
  ]
}
```
Source: PM app DB (Drizzle/SQLite).

## Minimal local pull workflow (clawd)
A local script can pull `/api/sync/v1/sprints` and write a cache file, e.g.
`~/clawd/memory/pm-app-cache.json`, so agents can read a single consolidated snapshot.

## Open questions
- Do we want to expose *only* clawd-backed data first (projects/sprints), or also DB-backed kanban/ideas immediately?
- Should we support `?project_id=...` filtering at the API level, or let the client filter?
