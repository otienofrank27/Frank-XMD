<div align="center">

  <img src="assets/frankxmd-banner.png.png" alt="FrankXMD Official Banner" width="100%">



  <h1>FrankXMD</h1>
  <p><strong>A powerful, feature-rich WhatsApp Multi-Device automation bot.</strong></p>
  <p>Group management · Media utilities · AI integrations · Stickers · Persistent reminders · Group insights · Entertainment</p>

  

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
- [Personal reminders and group insights](#personal-reminders-and-group-insights)
- [Public and private bot modes](#public-and-private-bot-modes)
- [Speech generation](#speech-generation-say-and-tts)
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

Configure only the optional integrations you plan to use in your local `.env` file or your hosting provider's private environment-variable settings. Keep all credentials out of documentation, source control, screenshots, and public logs. Never commit your real `.env` file or publish API credentials.



## Configuration & WhatsApp pairing

1. Start FrankXMD using `npm start`.
2. By default, FrankXMD requests a WhatsApp **pairing code** instead of generating a QR code. It uses the owner phone number configured as `ownerNumber` in `settings.js`. Enter the full international number with country code, digits only (for example, Kenya: `2547XXXXXXXX`).
3. When the pairing code appears in the terminal logs, open WhatsApp on that phone → **Linked Devices** → **Link a Device** → **Link with phone number instead**, then enter the code.
4. If running interactively, you can enter a different phone number when prompted. Keep the terminal/log viewer open until linking completes.
5. Keep the linked session files private and backed up securely.

The pairing-code service referenced by the project is external to this repository. If you operate your own pairing service, configure the project to use your own trusted endpoint.



## Start FrankXMD

Start the bot:

```bash
npm start
```

## Personal reminders and group insights

FrankXMD includes a persistent reminder scheduler and extra group information commands.

### Personal reminders

```text
.remind 10m Drink water       Create a reminder in 10 minutes
.remind 2h Check the oven     Create a reminder in 2 hours
.remind 1d Submit assignment  Create a reminder in 1 day
.reminders                   List your reminders in this chat
.cancelreminder ABC12        Cancel one of your reminders by ID
```

Durations support seconds (`s`), minutes (`m`), hours (`h`), and days (`d`). The minimum delay is 10 seconds and the maximum is 30 days. Pending reminders are stored in `data/reminders.json` and are resumed when the WhatsApp connection returns. Each user can list or cancel only their own reminders in the chat where they created them. Reminders created in groups are delivered privately to the creator; reminders created in private chats are delivered in that chat. Failed deliveries are retried after one minute. Keep the host's persistent storage enabled so reminder data survives redeployments.

### Group insights

```text
.groupstats   Show group name, member/admin counts, owner and available settings
.userinfo     Show information about yourself, a mentioned member, or a replied-to member
```

Use `.userinfo` while replying to a member's message or mention that member in the command. These commands display information already available to the linked WhatsApp account; they do not bypass WhatsApp privacy settings.


## Always-online presence

The owner or an authorized sudo user can control the bot's WhatsApp presence:

```text
.alwaysonline on       Keep the linked account's presence online while connected
.alwaysonline off      Stop periodic online presence updates
.alwaysonline status   Show the current setting
.alwaysonline         Toggle the setting
```

The setting is saved locally and resumes when the WhatsApp connection opens. WhatsApp may still control how presence is displayed to other users. The regression suite checks that the `.on`, `.off`, and `.status` arguments are parsed from the command text.

## Public and private bot modes

The owner or an authorized sudo user can control who may use FrankXMD:

```text
.mode public    Allow everyone to use bot commands and chatbot responses
.mode private   Restrict bot commands and chatbot responses to the owner and sudo users
.mode           Show the current mode and usage
```

The selected mode is saved in `data/messageCount.json` and persists across restarts. Group moderation protections continue to run in private mode.

## Utility commands

```text
.calc (25 + 5) * 2       Safely calculate an expression
.qr https://example.com  Generate a QR code
.currency 100 USD to KES Convert currencies using current rates
.ip 8.8.8.8              Look up public IP information
.unit 10 km to mi        Convert supported units
.google search terms     Open a Google search link
.define word             Look up an English definition
.wikipedia topic         Get a Wikipedia summary
.time                    Show the current Nairobi date and time
```

Other text utilities include `.b64e`, `.b64d`, `.reverse`, `.upper`, `.lower`, and `.poll`. Group utilities include `.grouplink`, `.getpp`, `.membercount`, and `.members`.

## Speech generation (.say and .tts)

FrankXMD can generate spoken audio in English, Kiswahili, Kikuyu, Kikamba, and Luo:

```text
.say english Hello everyone
.say swahili Habari za asubuhi
.say kikuyu Wĩ mwega
.say kikamba Mwasya atĩa
.say luo Misawa
.tts Hello everyone
```

English speech and the legacy `.tts` command use the existing Google TTS package. Swahili, Kikuyu, and Luo use Khaya's African-language TTS service; Kikamba uses Gemini TTS. Configure any required provider credentials privately in your local `.env` file or hosting environment settings. Do not put credential names or values in public documentation.

The bot sends generated audio as a WhatsApp audio attachment. WAV responses are converted to MP3 when FFmpeg is available; otherwise the WAV audio is sent directly. Run `npm test` to syntax-check all JavaScript files, validate local imports and package scripts, verify menu routing, and run reminder, group-insight, utility-input, and speech tests. API access, usage limits, and provider availability are controlled by the respective services.

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
| `npm test` | Syntax-check every JavaScript file, verify local imports and package scripts, and run menu-routing, reminder, group-insight, utility-input, and speech tests |

GitHub Actions installs project dependencies and runs the validation suite on Node.js 20 and 22. These automated checks cover static routing and local behavior; commands that depend on a live WhatsApp connection or third-party provider still require runtime verification.
| `npm run check` | Check JavaScript syntax, verify actual menu dispatch cases and command import paths, and run local command unit tests |
| `npm run docker:build` | Build the FrankXMD Docker image |

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

</div>



### Docker deployment

The repository includes a Docker image definition with FFmpeg for media conversion. Build the image:

```bash
docker build -t frankxmd .
```

Run it with persistent storage for the WhatsApp session and application data:

```bash
docker run -d --name frankxmd --restart unless-stopped \
  --env-file .env \
  -v frankxmd-session:/app/session \
  -v frankxmd-data:/app/data \
  frankxmd
```

View runtime logs with `docker logs -f frankxmd`. Keep the session and data volumes private. Supply credentials using a private environment file or your container platform's secret/environment settings; never bake them into the image.

### General hosting steps

1. Create a Node.js application or upload/clone the repository on your host.
2. Select **Node.js 18 or later**.
3. Install dependencies with `npm install` (or the host-compatible install command).
4. Add any required credentials through your host's private environment-variable settings.
5. Set the startup file/command to `index.js` or `npm start`, according to your host.
6. Start the application and complete WhatsApp authentication.
7. Keep the process running and ensure session storage persists between restarts.

For a deployment walkthrough, watch the [FrankXMD YouTube tutorial](https://youtu.be/-oz_u1iMgf8).



## Security & session safety

Your WhatsApp session is sensitive. Treat it like a password.

- Never share QR codes, pairing codes, `creds.json`, or session folders.
- Never commit `.env`, API keys, or personal session files to GitHub.
- Use private environment variables in your hosting dashboard.
- The `.clearsession` owner command logs out through Baileys; restart the bot and link it again afterward. For a manual reset, stop the process first and run `npm run reset-session`.
- The default startup path uses WhatsApp pairing-code login. Set the correct international phone number in `settings.js` (or enter it at the interactive prompt). Never share a pairing code.
- Provider credentials belong only in private environment settings. Credentials previously committed to Git history should be revoked and replaced with new values.
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
