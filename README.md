# FrankBot — Secure WhatsApp Assistant

Modular WhatsApp bot for **Frank** (`+254748642275`, KE) built on `@whiskeysockets/baileys` **7.0.0-rc14**.

> npm publishes this release as `7.0.0-rc14` (no extra dot). That is the official v7 RC14 package.

This project is **not affiliated with WhatsApp**. Use a dedicated number and never spam.

## Requirements

- Node.js 20+
- npm 10+
- Optional: `ffmpeg` for sticker/audio conversion
- Optional: `yt-dlp` for YouTube / social downloads
- Optional: `removeBgApiKey` in `settings` for `.removebg`

## Quick start

Edit the single `settings` file, then:

```bash
npm install
npm start
```

`settings` is the only configuration file. It holds owner number, session ID, and every bot option:

- `ownerNumber` — WhatsApp number in international format, no plus
- `sessionId` — paste the session ID the bot sends after a successful login
- `botName`, `ownerName`, `ownerCountry`, `prefix`, `timezone`
- `workInGroups` / `workInPrivate` — allow commands in groups and DMs
- `autoviewstatus`, `autoread`, `lastseen`, `markOnlineOnConnect`
- `welcomeEnabled`, `goodbyeEnabled`, `welcomeMessage`, `goodbyeMessage`
- `antilinkDefault`, `antiwordDefault`, `antispamDefault`, `antideleteDefault`, `antiviewonceDefault`
- rate limits, warnings, badwords, anti-link patterns, menu image paths

After QR login the bot DMs **only the session ID** to the owner. Use `.menu` any time for the image menu. Paste `sessionId` into `settings` on the deploy host so the bot reconnects without scanning again.

Commands work in private chats and WhatsApp groups. Group admin actions still require the bot to be a group admin.

## Commands

Prefix defaults to `.`.

### General

`.menu` `.help` `.ping` `.speed` `.alive` `.runtime` `.uptime` `.owner` `.creator` `.jid` `.time` `.date` `.quote`

### Group admin

`.kick` `.remove` `.add` `.invite` `.promote` `.demote` `.mute` `.closegroup` `.unmute` `.opengroup` `.tagall` `.everyone` `.hidetag` `.admins` `.groupinfo` `.groupname` `.setname` `.groupdesc` `.setdesc` `.linkgroup` `.grouplink` `.revoke` `.resetlink` `.antilink` `.antiword` `.badwords` `.antispam` `.antidelete` `.welcome` `.goodbye` `.warn` `.resetwarn` `.unwarn` `.warnings` `.delete` `.del`

Admin commands require a group admin or the owner. Group mutations also require the **bot** to be a group admin. If WhatsApp rejects an action, the bot reports failure.

### Media

`.sticker` `.s` `.toimg` `.tomp3` `.audio` `.tovn` `.ptt` `.compress` `.removebg` `.nobg`

`.removebg` needs `removeBgApiKey` in `settings`. Conversion commands need `ffmpeg`.

### Downloaders

`.ytmp3` `.play` `.ytmp4` `.video` `.ig` `.instagram` `.tiktok` `.tt` `.fb` `.facebook` `.twitter` `.x` `.google` `.wiki` `.getsong` `.spotify` `.soundcloud` `.playmusic`

Media downloads need `yt-dlp` on the host. Private, geo-blocked, or oversized links are rejected. Spotify often blocks third-party downloaders.

### Owner

`.autoviewstatus` `.autoread` `.broadcast` `.bc` `.block` `.unblock` `.join` `.leave` `.restart` `.shutdown` `.stop` `.setprefix` `.lastseen` `.privacy`

Owner commands are limited to `254748642275`.

### Fun

`.tictactoe` `.ttt` `.quiz` `.trivia` `.wordle` `.mathgame` `.roll` `.coinflip` `.dare` `.truth`

### Tools

`.savestatus` `.downloadstatus` `.sendstatus` `.antiviewonce` `.vo` `.getvo`

## Pairing and logout

1. Set `ownerNumber` in `settings`
2. Run `npm start`
3. Scan the QR
4. Confirm the owner receives the session ID
5. Paste `sessionId` into `settings` when deploying
6. Use `.menu` in chat or a group for the command menu

To reset: clear `sessionId` in `settings`, stop the process, move `auth/` aside, start again, scan a new QR.

## Tests

```bash
npm test
```

Tests cover permissions and command parsing. They do not connect to WhatsApp.

## License

MIT
