<div align="center">

  <img src="assets/frankxmd-banner.png.png" alt="FrankXMD Official Banner" width="100%">



  <h1>FrankXMD</h1>
  <p><strong>A powerful, feature-rich WhatsApp Multi-Device automation bot.</strong></p>
  <p>Group management · Media utilities · AI integrations · Stickers · Productivity · Entertainment</p>

  

  <a href="https://github.com/otienofrank27/Frank-XMD"><img src="https://img.shields.io/badge/Repository-Frank--XMD-181717?style=for-the-badge&logo=github" alt="GitHub repository"></a>
  <a href="https://github.com/otienofrank27/Frank-XMD/stargazers"><img src="https://img.shields.io/github/stars/otienofrank27/Frank-XMD?style=for-the-badge&logo=github&color=yellow" alt="GitHub stars"></a>
  <a href="https://github.com/otienofrank27/Frank-XMD/network/members"><img src="https://img.shields.io/github/forks/otienofrank27/Frank-XMD?style=for-the-badge&logo=github" alt="GitHub forks"></a>
  <a href="https://github.com/otienofrank27/Frank-XMD/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-ISC-blue?style=for-the-badge" alt="License"></a>
  <br>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js 18 or later"></a>
  <a href="https://github.com/WhiskeySockets/Baileys"><img src="https://img.shields.io/badge/WhatsApp-Baileys-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="Baileys"></a>
  <a href="https://github.com/otienofrank27/Frank-XMD/commits/main"><img src="https://img.shields.io/github/last-commit/otienofrank27/Frank-XMD?style=for-the-badge" alt="Last commit"></a>
  <br>
  <a href="https://github.com/otienofrank27/Frank-XMD/fork"><img src="https://img.shields.io/badge/FORK%20PROJECT-Create%20your%20copy-2F80ED?style=for-the-badge&logo=github" alt="Fork FrankXMD"></a>
  <a href="https://youtu.be/-oz_u1iMgf8"><img src="https://img.shields.io/badge/SETUP%20GUIDE-Watch%20tutorial-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="Setup tutorial"></a>

</div>



## Documentation

Use this guide to install, configure, run, and deploy FrankXMD.

- [Overview and features](#about-frankxmd)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration and WhatsApp pairing](#configuration--whatsapp-pairing)
- [Startup and package scripts](#start-frankxmd)
- [Event-driven automatic status viewing](#event-driven-automatic-status-viewing)
- [Deployment](#deployment)
- [Security and session safety](#security--session-safety)
- [Support and contact](#support-and-contact)
- [Contributing](#contributing)

## About FrankXMD

**FrankXMD** is a Node.js WhatsApp automation project built with the [Baileys](https://github.com/WhiskeySockets/Baileys) library. It brings together group administration, media utilities, entertainment, and productivity features in one WhatsApp-connected assistant.

The project is maintained by **[Marvin Frank](https://github.com/otienofrank27)** and builds on the work of its upstream authors and open-source contributors.

<div align="center">
  <a href="https://git.io/typing-svg">
    <img src="https://readme-typing-svg.demolab.com?font=Ribeye&size=28&pause=1000&color=58A6FF&center=true&vCenter=true&width=760&height=65&lines=FrankXMD;Multi+Device+WhatsApp+Bot;Maintained+By+Marvin+Frank" alt="FrankXMD typing banner">
  </a>
</div>



## Requirements

Before installing, make sure your environment has:

- **Node.js 18 or later** (matches the version range declared in `package.json`)
- **npm** (included with Node.js)
- **Git**
- **FFmpeg** — required by some sticker and media features
- A WhatsApp account to link to the bot

Check your installed versions:

```bash
node --version
npm --version
git --version
```



## Installation

### 1. Clone the repository

```bash
git clone https://github.com/otienofrank27/Frank-XMD.git
cd Frank-XMD
```

### 2. Install dependencies

```bash
npm install
```

If your hosting environment requires legacy peer dependency resolution, the project also provides:

```bash
npm run install:panel
```

### 3. Configure environment variables

Create a local `.env` file from the supplied template:

**Linux / macOS**
```bash
cp .env.example .env
```

**Windows PowerShell**
```powershell
Copy-Item .env.example .env
```

Open `.env` and add the credentials for the optional integrations you intend to use:

```env
TELEGRAM_BOT_TOKEN=
GIPHY_API_KEY=
```

- `TELEGRAM_BOT_TOKEN` — Telegram BotFather token used by Telegram sticker-pack import features.
- `GIPHY_API_KEY` — Giphy developer API key used by GIF search.

Leave a value empty if you do not use that integration. Never commit your real `.env` file or publish API credentials.



## Configuration & WhatsApp pairing

1. Start FrankXMD using the command below.
2. Follow the authentication instructions printed in your terminal.
3. Scan the QR code or use the pairing method presented by the running application, if available.
4. Keep the linked session files private and backed up securely.

The pairing-code service referenced by the project is external to this repository. If you operate your own pairing service, configure the project to use your own trusted endpoint.



## Start FrankXMD

Start the bot:

```bash
npm start
```

## Event-driven automatic status viewing

FrankXMD can react to status publications delivered to the linked WhatsApp account through Baileys' live `messages.upsert` event. It does not poll for statuses or add an artificial delay before requesting a read receipt.

Owner commands:

```text
.autostatus on       Enable automatic status viewing
.autostatus off      Disable automatic status viewing
.autostatus stats    Show runtime detection/read-request counters
.autostatus react on Enable optional status reactions
.autostatus react off Disable optional status reactions
```

The viewer processes every status message in an incoming event batch, deduplicates repeated message keys, and requests reads for accessible statuses without downloading their media. Image, video/GIF, and text status payloads are handled through the same status-message event path. WhatsApp privacy settings and the linked account's access determine which statuses can be delivered.

Timing records are appended to `data/status-view-metrics.jsonl` and are kept out of Git by `.gitignore`. They record local event detection and the time the Baileys `readMessages()` request resolves. **A resolved client call is not a server-side view acknowledgement**: Baileys does not expose a reliable per-status server-confirmed view timestamp here. WhatsApp delivery latency and server-side processing are outside FrankXMD's control, so no fixed millisecond guarantee is possible. Keep the process online with a stable connection for the lowest achievable delay.



### Available package scripts

| Command | Purpose |
|---|---|
| `npm start` | Start FrankXMD |
| `npm run start:optimized` | Start with the configured Node.js memory/optimization flags |
| `npm run cleanup` | Run the project cleanup script |
| `npm run reset-session` | Run the session reset script |
| `npm run start:clean` | Run cleanup, then start in optimized mode |
| `npm run start:fresh` | Reset the session, then start |
| `npm run install:panel` | Install dependencies using legacy peer dependency resolution |
| `npm run install:force` | Install dependencies using npm force mode |

**Use session reset commands carefully:** resetting or removing session data may require you to link WhatsApp again.



## Deployment

You can run FrankXMD on a Linux VPS or a compatible Node.js hosting panel. Choose a host that supports persistent Node.js processes, outbound network access, and storage for the WhatsApp session.

<div align="center">

  <a href="https://bot-hosting.net/?aff=1068419752923508776">
    <img src="https://img.shields.io/badge/DEPLOY-Hosting%20Panel-28a745?style=for-the-badge&logo=server&logoColor=white" alt="Deploy on hosting panel">
  </a>
  <a href="https://client.petrosky.io/aff.php?aff=394" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/badge/DEPLOY-VPS-0078E7?style=for-the-badge&logo=linux&logoColor=white" alt="Deploy on VPS">
  </a>
  <a href="https://dashboard.katabump.com/auth/login" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/badge/DEPLOY-Katabump-D6B7D6?style=for-the-badge&logo=server&logoColor=black" alt="Deploy on Katabump">
  </a>

</div>



### General hosting steps

1. Create a Node.js application or upload/clone the repository on your host.
2. Select **Node.js 18 or later**.
3. Install dependencies with `npm install` (or the host-compatible install command).
4. Add the environment variables from the [configuration section](#-configuration).
5. Set the startup file/command to `index.js` or `npm start`, according to your host.
6. Start the application and complete WhatsApp authentication.
7. Keep the process running and ensure session storage persists between restarts.

For a deployment walkthrough, watch the [FrankXMD YouTube tutorial](https://youtu.be/-oz_u1iMgf8).



## Security & session safety

Your WhatsApp session is sensitive. Treat it like a password.

- Never share QR codes, pairing codes, `creds.json`, or session folders.
- Never commit `.env`, API keys, or personal session files to GitHub.
- Use private environment variables in your hosting dashboard.
- Only install the bot from source you trust.
- Restrict access to the server and its stored session files.
- Rotate any API token that may have been exposed.
- Use group moderation features responsibly and obtain appropriate consent.

Anyone who obtains valid WhatsApp session credentials may be able to access and control the linked account.



## Support and contact

<div align="center">

  <a href="https://github.com/otienofrank27"><img src="https://img.shields.io/badge/GitHub-Follow-181717?style=for-the-badge&logo=github" alt="GitHub"></a>
  <a href="https://www.youtube.com/@FrankM-12"><img src="https://img.shields.io/badge/YouTube-Subscribe-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="YouTube"></a>
  <a href="https://www.instagram.com/frankmarvin_1/"><img src="https://img.shields.io/badge/Instagram-Follow-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram"></a>
  <a href="https://wa.me/254748642275"><img src="https://img.shields.io/badge/WhatsApp-Contact-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="WhatsApp"></a>

  <p><strong>Developer:</strong> Marvin Frank</p>

</div>

For bugs, questions, or feature requests, open an issue in the [FrankXMD repository](https://github.com/otienofrank27/Frank-XMD).



## Support the project

If FrankXMD is useful to you and you would like to support its continued development, you can contribute through **Pochi La Biashara**:

<div align="center">
  <img src="https://img.shields.io/badge/POCHI%20LA%20BIASHARA-254748642275-00A650?style=for-the-badge&logo=safaricom&logoColor=white" alt="Pochi La Biashara M-Pesa">
  <p><strong>M-Pesa Pochi La Biashara: +254 748 642 275</strong></p>
</div>



## Contributing

Contributions, bug reports, and feature requests are welcome.

1. Fork the [FrankXMD repository](https://github.com/otienofrank27/Frank-XMD).
2. Create a branch for your change.
3. Make focused changes and test them in your own environment.
4. Submit a pull request with a clear description.

Please preserve existing attribution and licensing notices.



## Credits

FrankXMD is maintained by **[Marvin Frank](https://github.com/otienofrank27)**.

This project builds on work and contributions from the original authors and open-source projects, including **Frank and Baileys**. All applicable original copyright notices and license requirements must be retained.



## Disclaimer

FrankXMD is an unofficial WhatsApp automation project. It is **not affiliated with, authorized, maintained, sponsored, or endorsed by WhatsApp or Meta**.

Use this software responsibly and in accordance with applicable laws and WhatsApp's terms. Automated activity may result in account restrictions or bans. Do not use this project for spam, harassment, privacy violations, or unlawful activity.



<div align="center">

  <h3>FrankXMD</h3>
  <p><strong>Built with passion. Maintained by Marvin Frank.</strong></p>
  <a href="https://github.com/otienofrank27/Frank-XMD">Explore the repository</a>

</div>
