# FRANK-XMD deployment guide

This file supplements the existing README. The original `README.md` is intentionally left unchanged.

FRANK-XMD is a long-running Node.js service. It maintains live Baileys sockets and must have persistent storage. Do not deploy it as a serverless function or on a host that deletes local files between restarts.

## Required persistent paths

| Path | Contents | Required |
|---|---|---|
| `/app/data` | Dashboard users, registry and per-session bot/group settings | Yes |
| `/app/sessions` | Independent Baileys credentials for every linked WhatsApp account | Yes |
| `/app/logs` | Runtime logs | Recommended |

Back up these paths securely. Never publish them, share QR codes or pairing codes, or place WhatsApp credentials in GitHub Actions artifacts.

## 1. Docker Compose (recommended)

Requirements: Docker Engine and the Docker Compose plugin.

```bash
git clone https://github.com/otienofrank27/Frank-XMD.git
cd Frank-XMD
cp .env.example .env
docker compose up -d --build
docker compose logs -f frank-xmd
```

Open `http://YOUR_SERVER_IP:3000`. The compose file creates named persistent volumes for data, sessions and logs. To change the public port, set `PORT=8080` in the host environment or edit the compose port mapping.

Update:

```bash
git pull origin main
docker compose up -d --build
```

Stop without deleting data:

```bash
docker compose down
```

Do not use `docker compose down -v` unless you intentionally want to delete all persistent volumes and linked-device credentials.

## 2. Docker without Compose

```bash
docker build -t frank-xmd .
docker volume create frank-xmd-data
docker volume create frank-xmd-sessions
docker volume create frank-xmd-logs
docker run -d --name frank-xmd --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=production -e HOST=0.0.0.0 -e PORT=3000 \
  -v frank-xmd-data:/app/data \
  -v frank-xmd-sessions:/app/sessions \
  -v frank-xmd-logs:/app/logs \
  frank-xmd
docker logs -f frank-xmd
```

## 3. Render

The repository includes a `render.yaml` Blueprint starter.

1. Push the repository to GitHub.
2. In Render, choose **New → Blueprint** and select this repository.
3. Review the service settings and create the service.
4. In the service's **Disks** settings, ensure persistent storage is mounted at both `/app/data` and `/app/sessions`. The Blueprint declares the data disk; add a second disk named for sessions at `/app/sessions`.
5. Keep `NODE_ENV=production`; Render provides the service port and HTTPS endpoint.
6. Wait for the `/api/health` health check to pass, then open the service URL and register a dashboard account.

Use a paid persistent-disk capable instance. An ephemeral filesystem is not suitable for WhatsApp auth state.

## 4. Railway

1. Create a Railway project and deploy the GitHub repository (or deploy from the repository's Dockerfile).
2. Set the service start command to `npm start` only if not using the Dockerfile.
3. Add a Railway Volume mounted at `/app/data`.
4. Add a second Railway Volume mounted at `/app/sessions`. Do not combine them with temporary storage.
5. Set variables: `NODE_ENV=production`, `HOST=0.0.0.0`, `DATA_DIR=/app/data`, `SESSIONS_DIR=/app/sessions`, and `TIMEZONE=Africa/Nairobi`.
6. Enable a public domain and configure the health check path as `/api/health` if available.
7. Redeploy, open the HTTPS domain and create your dashboard account.

Check the current Railway plan and volume limits before deployment. Both persistent mount paths must survive redeployments.

## 5. Fly.io

Use a Docker-based Fly app with persistent volumes.

1. Install `flyctl`, sign in and run `fly launch --no-deploy` from the repository.
2. Configure the app to listen on internal port `3000` and set `NODE_ENV=production`.
3. Create two volumes in the same region as the app:

```bash
fly volumes create frankxmd_data --size 1
fly volumes create frankxmd_sessions --size 1
```

4. Add mounts in `fly.toml`:

```toml
[[mounts]]
  source = "frankxmd_data"
  destination = "/app/data"

[[mounts]]
  source = "frankxmd_sessions"
  destination = "/app/sessions"

[http_service]
  internal_port = 3000
  force_https = true
  auto_start_machines = true
  auto_stop_machines = "off"
  min_machines_running = 1
```

5. Deploy with `fly deploy` and verify `https://YOUR_APP.fly.dev/api/health`.

Run one app instance unless you deliberately design shared storage and distributed session ownership. Baileys sessions must not be started simultaneously by multiple replicas.

## 6. Ubuntu/Debian VPS with PM2

Install Node.js 20 or newer, npm 10 or newer, FFmpeg, Python 3 and yt-dlp. Then:

```bash
git clone https://github.com/otienofrank27/Frank-XMD.git
cd Frank-XMD
npm ci
cp .env.example .env
mkdir -p data sessions logs
npm start
```

For process supervision, install PM2 and run:

```bash
npm install -g pm2
pm2 start index.js --name frank-xmd
pm2 save
pm2 startup
```

Use Nginx or Caddy as an HTTPS reverse proxy to port 3000. Set `NODE_ENV=production` so the dashboard uses Secure cookies. Keep the Node process on one VPS instance and back up `data/` and `sessions/`.

## 7. systemd service

For a VPS where the repository is installed at `/opt/Frank-XMD`, create `/etc/systemd/system/frank-xmd.service`:

```ini
[Unit]
Description=FRANK-XMD WhatsApp service
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=frankxmd
WorkingDirectory=/opt/Frank-XMD
Environment=NODE_ENV=production
Environment=HOST=127.0.0.1
Environment=PORT=3000
Environment=DATA_DIR=/opt/Frank-XMD/data
Environment=SESSIONS_DIR=/opt/Frank-XMD/sessions
ExecStart=/usr/bin/node /opt/Frank-XMD/index.js
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Create the service user and grant it ownership of the app and persistent directories. Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now frank-xmd
sudo systemctl status frank-xmd
sudo journalctl -u frank-xmd -f
```

## Production security checklist

- Serve the dashboard over HTTPS. Do not expose the plain HTTP dashboard to the public internet without a TLS reverse proxy.
- Keep `/app/data` and `/app/sessions` on persistent, private storage.
- Use strong unique dashboard passwords; do not share user accounts.
- Restrict dashboard access with a firewall or reverse-proxy access policy if it is not intended to be public.
- Do not commit `.env`, WhatsApp auth files, database files, QR codes or pairing codes.
- Keep a secure backup of persistent data. Encrypt backups and limit access.
- Use one active application replica unless you have implemented a distributed session lock and shared persistent storage.
- Only link WhatsApp accounts whose owners have explicitly approved the Linked Device connection.
- Test each WhatsApp account independently after deployment. Group moderation commands also require the linked bot account to be a group admin.
- External services such as YouTube downloads, Spotify lookups or background removal depend on the target service, network access, API keys and upstream availability.

## Health check and troubleshooting

- Health endpoint: `GET /api/health` (returns `{"ok":true}` while the HTTP service is running).
- Dashboard: `http://localhost:3000` locally or your HTTPS deployment URL.
- Logs: `docker compose logs -f frank-xmd`, `pm2 logs frank-xmd`, or `journalctl -u frank-xmd -f`.
- QR not appearing: confirm outbound network access and inspect the session's status in the dashboard.
- Session lost after redeploy: check that `/app/sessions` is a persistent volume, not ephemeral storage.
- Dashboard accounts missing: check that `/app/data` is persistent.
- Group commands fail: make sure the linked WhatsApp account is a group admin and that WhatsApp grants the required permissions.
- Media commands fail: install FFmpeg/yt-dlp or provide the required API key and verify that the upstream source permits access.
