# PM App on TrueNAS SCALE + Cloudflare Tunnel (optional)

This is the **“accessible from anywhere”** option. It’s more moving parts than Tailscale, so keep it optional.

Threat model note: Cloudflare Tunnel is an Internet-facing entrypoint. Lock it down with Cloudflare Access, service auth, and (ideally) a zero-trust policy. If you only need personal access, **Tailscale is simpler**.

## Assumptions
- TrueNAS SCALE can run Docker apps (either Apps UI or Compose).
- You have a dataset (or host path) for persistent storage.
- You have a Cloudflare account + a domain under Cloudflare DNS.

## 1) Put the pm-app container on TrueNAS
### Option A: Use docker-compose.yml
1) Copy the `pm-app` repo to a location the TrueNAS host can access.
2) Ensure you mount two persistent volumes:
   - `/app/.data` — SQLite persistence
   - a **read-only** mount for `clawd` (if you want rotation/sprint UI): `/home/node/clawd`

Example compose (repo’s `docker-compose.yml`) expects:
- `./.data:/app/.data`
- `${CLAWD_HOME}:/home/node/clawd:ro`

Set env vars:
- `PORT=3000`
- `CLAWD_HOME=/home/node/clawd`

### Option B: TrueNAS Apps UI
- Create a custom app/container pointing at the built image.
- Add the same env vars and mounts.

## 2) Install cloudflared on TrueNAS (or a small sidecar)
Cloudflare Tunnel typically runs via `cloudflared`.

You can run `cloudflared`:
- directly on the NAS (preferred), or
- in a small container (sidecar) on the same Docker network.

High-level steps:
1) Authenticate:
   - `cloudflared tunnel login`
2) Create a tunnel:
   - `cloudflared tunnel create pm-app`
3) Configure a hostname route:
   - e.g. `pm.yourdomain.com` → `http://pm-app:3000`
4) Run the tunnel:
   - `cloudflared tunnel run pm-app`

## 3) Lock down access (strongly recommended)
Use Cloudflare Access:
- Require login to your identity provider (Google/GitHub/etc), or
- Use a service token for machine access.

Set Access policies so only your account(s) can reach `pm.yourdomain.com`.

## 4) Smoke-test checklist
- `https://pm.yourdomain.com/` loads.
- `https://pm.yourdomain.com/api/sprint-state` returns rotation/sprint data.
- Restart the container and confirm `.data/pm.sqlite` persists.

## Troubleshooting notes
- If `/api/sprint-state` returns null rotation:
  - confirm `CLAWD_HOME` and the `/home/node/clawd` mount.
- If the app can’t write SQLite:
  - verify permissions on the `.data` dataset.

## When to choose this option
Pick TrueNAS + Cloudflare Tunnel if you need:
- always-on uptime, and
- access from anywhere without tailnet constraints.

Otherwise, prefer the **Tailscale** guide (`ACCESS_TAILSCALE.md`).
