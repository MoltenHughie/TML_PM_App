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

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

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
