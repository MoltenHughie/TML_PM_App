# PM App deployment notes (TML/pm-app)

This document captures the **deployment approach decision** and tradeoffs for the PM App.

## Goal
Provide a simple way to run the PM App for personal use, with access either:
1) **inside the home network / tailnet** (Tailscale), or
2) (optional) **from anywhere** (TrueNAS + Cloudflare Tunnel).

## Recommended approach (default)
### Option A — Run on the Mac (or a single Linux host) + Tailscale
**Why this is the default:** lowest operational complexity, fastest iteration, no extra infra.

**How it works (high level):**
- Build a Node server using SvelteKit’s `adapter-node` output.
- Run it as a local service (systemd/launchd) bound to a LAN/Tailscale interface.
- Use Tailscale to reach it securely from other devices.

**Pros**
- Very quick to set up and maintain.
- Easy to iterate and redeploy.
- No reverse proxy required.

**Cons**
- The host must be on to access the app.
- Less “appliance-like” than NAS deployment.

## Alternative (more infra)
### Option B — TrueNAS SCALE (Docker) + optional Cloudflare Tunnel
**Why/when:** you want the PM App to run as a “home server app” with higher uptime and an appliance feel.

**How it works (high level):**
- Package the app as a Docker container.
- Persist the SQLite database + any required state via host volumes.
- Expose it on the LAN; for offsite access use either:
  - Tailscale on the NAS, or
  - Cloudflare Tunnel + auth hardening.

**Pros**
- Centralized always-on host.
- Containerized deploy is repeatable.

**Cons / risks**
- More moving parts (container lifecycle, volumes, permissions, upgrades).
- Cloudflare Tunnel adds an Internet-facing entrypoint; must be locked down.

## Data persistence notes (important)
The PM App reads from clawd memory files for sprint focus/rotation and now also exposes a **sync API**.

### clawd file access (required)
The server must be able to read:
- `${CLAWD_HOME}/memory/sprints/state.json`
- `${CLAWD_HOME}/memory/sprints/YYYY-MM-DD.json`
- `${CLAWD_HOME}/memory/projects/PROJECTS.json`

Configure via environment variable:
- `CLAWD_HOME=/path/to/clawd` (defaults to `~/clawd`)

In Docker/TrueNAS, mount your `clawd` folder into the container and set `CLAWD_HOME` accordingly.

### Sync API (optional)
Read-only endpoints:
- `GET /api/sync/v1/meta`
- `GET /api/sync/v1/projects`
- `GET /api/sync/v1/sprints`

Auth:
- If `PM_SYNC_TOKEN` is **unset**, endpoints are open (intended for Tailscale-only deployments).
- If `PM_SYNC_TOKEN` is **set**, clients must send header `x-pm-sync-token: <token>`.

## Next implementation steps
- Add production deploy artifacts:
  - Dockerfile / compose (Option B), or
  - Node build + service instructions (Option A)
- Add an access guide:
  - Tailscale steps (mandatory) — see `ACCESS_TAILSCALE.md`
  - TrueNAS + Cloudflare Tunnel steps (optional) — see `ACCESS_TRUENAS_CLOUDFLARE.md`
