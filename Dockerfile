
FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    ffmpeg \
    python3 \
    python3-pip \
    libvips42 \
  && pip3 install --break-system-packages --no-cache-dir yt-dlp \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY index.js ./
COPY settings ./
COPY src ./src
COPY assets ./assets

RUN mkdir -p auth data logs \
  && chown -R node:node /app

USER node

EXPOSE 3000\n\nVOLUME ["/app/auth", "/app/data", "/app/logs", "/app/sessions"]

CMD ["node", "index.js"]
