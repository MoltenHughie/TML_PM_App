# PM App access via Tailscale (tailnet)

This guide assumes you have the PM App running on a host machine and you want to reach it securely from other devices on your **Tailscale tailnet**.

## 0) Prereqs
- Tailscale installed and logged in on:
  - the **host** (where pm-app runs)
  - the **client** device (phone/laptop)
- The pm-app server is listening on a port (default in our docs: **3000**).

## 1) Start pm-app on the host
From `~/TML/pm-app`:

```bash
nvm install
nvm use
npm ci
npm run build
PORT=3000 CLAWD_HOME=/Users/tlittau/clawd npm run start
```

Notes:
- `CLAWD_HOME` must point at the clawd workspace so `/api/sprint-state` can read:
  - `${CLAWD_HOME}/memory/sprints/state.json`
  - `${CLAWD_HOME}/memory/projects/PROJECTS.json`

## 2) Find the host’s Tailscale IP
On the host:

```bash
tailscale ip -4
```

This prints something like `100.x.y.z`.

## 3) Access from another device on the tailnet
From the client device (browser):

- `http://<TAILSCALE_IP>:3000/`

Example:
- `http://100.101.102.103:3000/`

## 4) Recommended: use a stable tailnet DNS name
If MagicDNS is enabled in your tailnet, you can use the host name:

- `http://<hostname>:3000/`

You can check the hostname in the Tailscale admin console.

## 5) Firewall / bind notes
- The SvelteKit node server binds to `0.0.0.0` by default in adapter-node output, which is OK for LAN/tailnet access.
- If you can’t reach the port, verify:
  - the process is listening (`lsof -i :3000`)
  - macOS firewall rules allow inbound connections
  - your tailnet ACLs allow the client → host connection

## 6) Optional: restrict exposure to tailnet only
If you want to avoid exposing the port on your LAN interface, you can:
- Bind to the Tailscale interface IP only (advanced), or
- Use tailnet ACLs to restrict who can access the host.

## Quick smoke-test checklist
- `GET /api/sprint-state` returns non-null rotation and sprint data.
- Kanban page shows RotationStatus panel updating after an autopilot run.
