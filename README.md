<div align="center"><a href="#"><img src="https://i.imgur.com/LyHic3i.gif" alt="Frank-XMD banner" width="100%"></a>
FRANK-XMD
A Feature-Rich Multi-Device WhatsApp Bot Built with Baileys
<img src="assets/logo.png" alt="Frank-XMD Logo" width="220"><a href="https://github.com/"><img src="https://img.shields.io/badge/WhatsApp-Baileys%20v7.0.0--rc14-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="Baileys"></a>
<a href="#"><img src="https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"></a>
<a href="#"><img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="MIT License"></a>

Developed and maintained by Frank.

<a href="https://i.imgur.com/LyHic3i.gif"><img src="https://i.imgur.com/LyHic3i.gif" alt="separator" width="100%"></a>
</div> About Frank-XMD
Frank-XMD is a modular, multi-device WhatsApp bot built with Node.js and Baileys v7.0.0-rc14. It includes general utilities, group administration, media tools, downloaders, games, owner controls and status utilities.

The project uses a command registry that loads commands by category, configurable group settings, permission checks, rate limiting, structured logging and automatic reconnection handling.
Use this project responsibly and comply with WhatsApp's terms and applicable laws.

Features
- Multi-device WhatsApp connection using Baileys.
- Modular command system with automatically loaded commands.
- Group moderation: antilink, antiword, antispam, warnings and member management.
- Welcome and goodbye messages.
- Media conversion, sticker tools and media compression.
- Media download commands for supported public URLs.
- Games and entertainment commands.
- Owner-only controls and broadcast tools.
- Custom menu artwork and configurable menu appearance.
- Persistent authentication, bot state and group settings.
- Reconnection handling, command cooldowns and rate limiting.
- Docker support.
  
Tech Stack

| Technology	         | Purpose                       |
|----------------------|-------------------------------|
| Node.js 20+	         | JavaScript runtime            |
| Baileys 7.0.0-rc14	 | WhatsApp Web connection       |
| dotenv	             | Environment configuration     |
| Pino / pino-pretty   | Logging                       |
| QRCode	             | Terminal QR rendering         |
| Sharp                | Image processing              |
| yt-dlp	             | Supported media downloads     |
| FFmpeg	             | Audio/video processing        |
| Docker	             | Container deployment          |

Getting Started

1. Fork or clone the repository
git clone https://github.com/otienofrank27/Frank-XMD.git
cd Frank-XMD
If your repository uses a different GitHub URL, replace the clone URL above with your repository URL.
2. Install dependencies
Requirements: Node.js 20 or newer and npm 10 or newer.
npm install
For media conversion and downloader commands, install FFmpeg and yt-dlp and ensure both are available on your system PATH.
3. Configure the bot
The project includes a settings JSON configuration file. Open it and set your bot and owner details:
{
  "botName": "Frank-XMD",
  "ownerName": "Frank",
  "ownerNumber": "YOUR_WHATSAPP_NUMBER",
  "ownerCountry": "KE",
  "sessionId": "",
  "prefix": ".",
  "timezone": "Africa/Nairobi"
}
Keep the existing settings properties when editing the file. Use your WhatsApp number with country code and digits only (no +, spaces or dashes).

You can also copy .env.example to .env and configure supported environment variables there. Environment variables take precedence over matching values in settings.
cp .env.example .env
On Windows PowerShell:
Copy-Item .env.example .env
Set REMOVEBG_API_KEY in .env only if you want to use the background-removal command. Never publish API keys or session credentials.
4. Link your WhatsApp account
Start the bot:
npm start
On first launch, a QR code is printed in the terminal.
1. Open WhatsApp on your phone.
2. Go to Settings → Linked devices.
3. Select Link a device.
4. Scan the QR code shown in the terminal.
5. Wait for the bot to connect.
After a successful connection, the bot captures its session credentials and sends the session ID to the configured owner account. Treat that session ID like a password: anyone who obtains it may be able to access the linked WhatsApp account.

The auth/ directory also stores authentication files. Keep it private and persistent when deploying.
5. Run tests
npm test
Docker Deployment
The repository includes a Dockerfile with Node.js 20, FFmpeg, Python, yt-dlp and the image-processing runtime libraries.

Build the image:
docker build -t frank-xmd .
Run the container:
docker run -d \
  --name frank-xmd \
  --restart unless-stopped \
  -v frank-xmd-auth:/app/auth \
  -v frank-xmd-data:/app/data \
  -v frank-xmd-logs:/app/logs \
  frank-xmd
View logs and the QR code:
docker logs -f frank-xmd
Scan the QR code from the container logs when pairing for the first time. Keep the auth, data and logs volumes so authentication and bot settings persist when the container is restarted or recreated.

To stop the container:
docker stop frank-xmd
Commands
The default command prefix is .. If you change prefix in settings, use your new prefix instead.
General commands
Command	Description
.menu	Display the bot menu
.help	Show command help
.ping	Check response time
.alive	Check bot status
.owner	Show owner information
.groupinfo	Show group information
.runtime	Show bot uptime
.time	Show current time
.jid	Show chat or sender JID
.quote	Display a motivational quote
.sticker	Create a sticker from supported media

For command-specific syntax and options, use .help or .menu in WhatsApp. Commands that modify groups require the bot to have the necessary WhatsApp admin permissions.

Configuration
The main configuration is stored in the root settings file. Common options include:
- Setting	Purpose
- botName	Name displayed by the bot
- ownerName	Configured owner's display name
- ownerNumber	Owner's WhatsApp number
- prefix	Command prefix (default .)
- timezone	Timezone used by time-related commands
- logLevel	Logging verbosity
- workInGroups	Enable bot operation in groups
- workInPrivate	Enable bot operation in private chats
- welcomeEnabled	Default welcome-message setting
- goodbyeEnabled	Default goodbye-message setting
- maxWarnings	Warning threshold
- commandCooldownMs	Per-command cooldown
- rateLimitMax	Maximum commands in the configured rate-limit window
- trustedNumbers	Numbers exempt from selected moderation checks
- antiLinkPatterns	Link patterns blocked by antilink
- removeBgApiKey	API key for background removal

The .env.example file documents environment-based options. Do not commit real API keys, private session IDs or personal credentials.

Project Structure
``
Frank-XMD/
├── assets/                 # Logo, menu artwork and fonts
├── auth/                   # WhatsApp authentication files (private)
├── data/                   # Persistent bot and group data
├── logs/                   # Runtime logs
├── src/
│   ├── commands/
│   │   ├── admin/          # Group administration commands
│   │   ├── downloader/     # Search and download commands
│   │   ├── fun/             # Games and entertainment
│   │   ├── general/         # General utility commands
│   │   ├── media/           # Media conversion tools
│   │   ├── owner/           # Owner-only commands
│   │   └── tools/           # Status and view-once tools
│   ├── config/             # Configuration loader
│   ├── connection/         # Baileys connection manager
│   ├── database/           # Persistent state stores
│   ├── events/             # Group event handlers
│   ├── handlers/           # Command and message handlers
│   ├── middleware/         # Permissions, errors and rate limiting
│   └── utils/              # Shared helpers
├── tests/                  # Automated tests
├── .env.example            # Environment variable template
├── Dockerfile              # Docker image definition
├── index.js                # Application entry point
├── package.json
└── settings                # Main JSON configuration

Testing
Run the included automated test suite:
npm test
The tests cover command execution and handling, permissions and session utilities.

Security Notes
- Never share your auth/ directory, session ID, .env file or private API keys.
- Keep persistent storage enabled for auth/ and data/ when using Docker or a hosting provider.
- Only give owner access to a WhatsApp number you control.
- Review group moderation settings before enabling them in active groups.
- Use broadcasts and automated messaging responsibly.
- WhatsApp may restrict or suspend accounts that violate its terms or engage in abusive automation.

Disclaimer
Frank-XMD is an independent, community-developed project and is not affiliated with, endorsed by, or officially connected to WhatsApp or Meta.

This software is provided for educational and personal automation purposes. Use it at your own risk. The project maintainer is not responsible for account restrictions, data loss, misuse, or damages resulting from the use of this software. You are responsible for complying with WhatsApp's terms and all applicable laws.

Contributing
Contributions, bug reports and feature suggestions are welcome.
1. Fork the repository.
2. Create a feature branch.
3. Make and test your changes.
4. Submit a pull request with a clear description.
Please avoid committing credentials, session files, generated logs or personal data.

Connect
<div align="center"><a href="https://github.com/otienofrank27"><img src="https://img.shields.io/badge/GitHub-Frank-181717?style=for-the-badge&logo=github" alt="GitHub"></a>
<a href="https://github.com/otienofrank27/Frank-XMD/issues"><img src="https://img.shields.io/badge/Report%20an%20Issue-Frank--XMD-red?style=for-the-badge&logo=github" alt="Report an issue"></a>
</div> Support
If you find Frank-XMD useful, consider giving the repository a star ⭐. It helps the project reach more developers.
<div align="center">
<a href="#"><img src="https://i.imgur.com/LyHic3i.gif" alt="separator" width="100%"></a>

FRANK-XMD — Built with Node.js, JavaScript and Baileys.
</div>
