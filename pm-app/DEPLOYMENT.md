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
The PM App reads from `~/clawd/memory/sprints/*.json` today for sprint focus/rotation. For a server deployment, we need an explicit strategy:
- Either mount the `clawd/memory/` directory into the container/host path expected by the app, or
- Make the pm-app configurable via environment variables (preferred long-term):
  - `CLAWD_HOME=/path/to/clawd`
  - or specific paths like `CLAWD_SPRINT_DIR`, `CLAWD_PROJECTS_PATH`.

## Next implementation steps
- Add production deploy artifacts:
  - Dockerfile / compose (Option B), or
  - Node build + service instructions (Option A)
- Add an access guide:
  - Tailscale steps (mandatory) — see `ACCESS_TAILSCALE.md`
  - TrueNAS + Cloudflare Tunnel steps (optional) — see `ACCESS_TRUENAS_CLOUDFLARE.md`
