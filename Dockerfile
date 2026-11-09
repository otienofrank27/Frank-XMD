FROM node:20-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install --omit=dev --legacy-peer-deps

COPY . .
RUN mkdir -p /app/session /app/temp /app/data \
    && chown -R node:node /app

USER node
CMD ["node", "index.js"]
