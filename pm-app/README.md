# pm-app

## Node version

This repo expects **Node 24+** (see `.nvmrc`).

Quick start:
```bash
cd ~/TML/pm-app
nvm install
nvm use
npm ci
npm run dev
```

---

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv create --template minimal --types ts --install npm pm-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

Run the production server (adapter-node output):

```sh
npm run start
```

You can preview the production build with `npm run preview`.

## Deployment

See:
- `DEPLOYMENT.md`
- `ACCESS_TAILSCALE.md`
- `ACCESS_TRUENAS_CLOUDFLARE.md`

Docker (local):

```sh
docker compose up --build
```

For sprint/rotation UI: set `CLAWD_HOME` (or mount clawd to `/home/node/clawd` in the container) so `/api/sprint-state` can read sprint files.

## Smoke-test checklist (prod-ish)
1. `npm run build` and `PORT=3000 CLAWD_HOME=... npm run start`
2. Open `/` and confirm Kanban + Active Sprint + RotationStatus render
3. Hit `/api/sprint-state` and confirm it returns non-null rotation + sprint data
4. Trigger/await an autopilot run and confirm the rotation visited list updates:
   - check `~/clawd/memory/sprints/state.json` shows `completed_project_ids` appended with the just-visited project
   - refresh `/` and confirm the RotationStatus “Visited” list matches that file

## Developer note — Idea Capture (DB-backed)

Run:

```sh
cd pm-app
nvm install
nvm use
npm ci
npm run dev -- --open
```

What exists:
- `GET/POST /ideas`: add ideas (title required, optional description), newest-first list
- Mark ideas as done + optional “Show done” filter
- **Persistence:** SQLite + Drizzle (no migrations yet; bootstrap `CREATE TABLE IF NOT EXISTS` for prototype)

DB location:
- Default: `pm-app/.data/pm.sqlite`
- Override: set env var `TML_PM_DB=/absolute/path/to/pm.sqlite`

Reset DB (local dev):
```sh
rm -f .data/pm.sqlite
```

Next steps:
1. Add drizzle-kit migrations + schema evolution
2. Add tags/search + “convert idea to kanban card”
3. Add auth + per-user scoping

## Smoke test — Kanban filters & active sprint panel

1. Start the dev server (`npm run dev`).
2. Use the multi-project filter chips at the top of the Kanban board to toggle QA2/TML/MT workstreams and confirm the cards update in place.
3. The Active Sprint panel (top-left) shows the current sprint goal pulled from `~/clawd/memory/sprints/<today>.json` and highlights the next incomplete subtask.
4. Smoke-test by toggling between QA2, TML, and MT to ensure each sprint goal appears and the next subtask reflects real data.

Document the smoke-test results in `~/clawd/memory/2026-02-20.md`.

## Sprint-state API

### Endpoint

`GET /api/sprint-state` returns:

```json
{
  "sprint": "SprintData | null",
  "rotation": "RotationSnapshot | null"
}
```

It reads `~/clawd/memory/sprints/state.json` first so it follows `active_sprint`, and falls back to the today file when the state pointer is missing.

Query param:
- `?project=<PROJECT_ID>`: get that project’s sprint directly.

### SprintData fields (subset)

The returned `sprint` object may include:
- `last_progress_at` (ISO timestamp)
- `change_log`: array of `{ timestamp, text }`

The Active Sprint panel surfaces the last progress time and latest change.

### RotationSnapshot fields

The returned `rotation` object contains (derived from clawd memory files):
- `active_projects: string[]` — active projects sorted by priority (from `PROJECTS.json`)
- `visited_project_ids: string[]` — projects already visited in the current rotation
- `active_project_id: string | null`
- `active_sprint_id: string | null`

This is rendered in the Kanban page via the `RotationStatus` prototype component.
