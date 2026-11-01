require('dotenv').config();

const settings = {
  packname: 'FrankXMD',
  author: '‎',
  botName: "FrankXMD",
  botOwner: 'Marvin Frank',
  ownerNumber: '254748642275',
  giphyApiKey: process.env.GIPHY_API_KEY || '',
  commandMode: "public",
  maxStoreMessages: 20,
  storeWriteInterval: 10000,
  description: "FrankXMD WhatsApp multi-device bot maintained by Marvin Frank.",
  version: "3.0.8",
  // Set UPDATE_ZIP_URL to your own FrankXMD repository ZIP before using .update.
  updateZipUrl: process.env.UPDATE_ZIP_URL || "",
  // Media API integrations (song, video, cards, etc.)
  knightApiUrl: process.env.KNIGHT_API_URL || 'https://knightbotapi.stream',
  knightApiKey: process.env.KNIGHT_API_KEY || 'knight',
  mediaApiUrl: process.env.MEDIA_API_URL || 'https://knightbotapi.stream',
  mediaApiKey: process.env.MEDIA_API_KEY || 'knight',
  princeApiUrl: process.env.PRINCE_API_URL || 'https://api.princetechn.com',
  princeApiKey: process.env.PRINCE_API_KEY || 'prince',
};

module.exports = settings;
