# FRANK-XMD

**Universal multi-user WhatsApp assistant** built with Node.js and Baileys v7.0.0-rc14.

FRANK-XMD now runs as a shared service with an authenticated web dashboard. Each dashboard user can connect up to three WhatsApp accounts independently using either a QR code or a phone-number pairing code.

> Every WhatsApp account must be deliberately linked by its owner (or an authorized user) through WhatsApp Linked Devices. FRANK-XMD does not create WhatsApp accounts, bypass WhatsApp authorization, or link an account without its approval.

## Features

- Multi-user dashboard with email/password registration and login.
- QR-code linking and phone-number pairing-code linking.
- Independent credentials, sockets, reconnection lifecycle, group settings, bot settings, rate limits and status cache for each linked account.
- Restore linked accounts after a service restart when persistent storage is available.
- Up to three WhatsApp accounts per dashboard user.
- Existing modular command registry, group moderation, media tools, games and owner commands.
- Per-session command ownership: owner commands apply to the WhatsApp account linked to that session.
- No export, automatic forwarding or logging of WhatsApp session credentials.
- Docker support and automated Node.js tests.

## Requirements

- Node.js 20.9+ (Node 20 LTS recommended)
- npm 10+
- Persistent writable storage for `data/` and `sessions/`
- FFmpeg and yt-dlp for commands that use media conversion or supported downloads

## Run locally

```bash
git clone https://github.com/otienofrank27/Frank-XMD.git
cd Frank-XMD
npm install
```

Copy `.env.example` to `.env` if you need to customize the service:

**PowerShell**
```powershell
Copy-Item .env.example .env
```

Start the service:

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000), create a dashboard account, then choose one of the linking methods.

### QR code linking

1. Sign in to the FRANK-XMD dashboard.
2. Choose **QR code** and create a session.
3. On the WhatsApp account you want to connect, open **Settings → Linked devices → Link a device**.
4. Scan the QR shown in your dashboard.
5. Wait until the session status changes to **connected**.

### Phone-number pairing

1. Sign in to the dashboard.
2. Choose **Pairing code**.
3. Enter the WhatsApp phone number with its country code, digits only (for example, `2547XXXXXXXX`).
4. On that phone, open **Settings → Linked devices → Link a device → Link with phone number instead**.
5. Enter the code displayed in the dashboard and approve linking.

The phone number is used only to request a WhatsApp pairing code. The phone owner must still approve the linked device.

## Multi-user isolation

Each dashboard user receives a private directory below `sessions/`. Each linked account has its own hashed session directory containing:

- `auth/`: Baileys authentication credentials and signal keys.
- `data/group-settings.json`: that account's group moderation settings.
- `data/bot-state.json`: that account's bot preferences and command prefix.

The dashboard registry is stored at `data/multiuser/registry.json`. Passwords are stored as salted scrypt hashes. Dashboard cookies are HTTP-only and SameSite=Strict.

Never copy an `auth/` folder between users or publish the `sessions/` or `data/multiuser/` directories. Use HTTPS whenever the dashboard is reachable over a network. Set `NODE_ENV=production` behind HTTPS so the session cookie receives the Secure attribute.

The old shareable `sessionId` export/import flow is disabled. A session ID is not a safe way to distribute WhatsApp credentials.

## Configuration

The root `settings` file and `.env` contain service defaults such as:

| Variable | Purpose |
|---|---|
| `BOT_NAME` | WhatsApp client display name |
| `PREFIX` | Default command prefix |
| `TIMEZONE` | Timezone for time commands |
| `PORT` | Dashboard port (default `3000`) |
| `HOST` | Dashboard bind address (default `0.0.0.0`) |
| `LOG_LEVEL` | Logging level |
| `REMOVEBG_API_KEY` | Optional background-removal API key |

`OWNER_NUMBER` is retained for compatibility with the original settings format; in multi-user mode, owner permission is assigned to each WhatsApp identity only after that identity links successfully. Do not use one global number to represent all connected users.

## Commands

The default prefix is `.`. Use `.menu` or `.help` in WhatsApp for the live command list. Existing group-management commands require the linked account to have the appropriate WhatsApp group-admin privileges. Owner-only commands apply only to the WhatsApp account connected in that session.

The `.restart` and `.shutdown` commands do not terminate the shared service; use the dashboard to remove a session without affecting other users.

## Tests

```bash
npm test
```

The automated tests cover command parsing/registration/execution, permissions, rate limiting and credential-export safeguards. They do not replace live WhatsApp authorization tests or verify WhatsApp-side group-admin actions.

## Docker

Build:

```bash
docker build -t frank-xmd .
```

Run with persistent volumes:

```bash
docker run -d --name frank-xmd --restart unless-stopped \
  -p 3000:3000 \
  -v frank-xmd-data:/app/data \
  -v frank-xmd-sessions:/app/sessions \
  -v frank-xmd-logs:/app/logs \
  frank-xmd
```

Open `http://localhost:3000` (or your server's HTTPS URL when deployed). Keep the data and sessions volumes persistent: losing them means losing dashboard accounts or linked-device credentials.

## Security and responsible use

- Only link WhatsApp accounts you own or are authorized to administer.
- Never share QR codes, pairing codes, session folders, cookies or dashboard passwords.
- Use HTTPS for remote access and restrict dashboard exposure with a firewall or reverse proxy.
- Keep the server and dependencies updated; back up `data/` and `sessions/` securely.
- Respect WhatsApp terms, privacy and local laws. Automated messaging can lead to account restrictions if misused.

FRANK-XMD is an independent project and is not affiliated with WhatsApp or Meta.
