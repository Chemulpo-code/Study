# Multi-stage Dockerfile for Portainer / Git Deployment

# 1. Сборка React фронтенда
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app

LABEL version="1.9.7"
LABEL description="Chinese Study App v1.9.7"

# Устанавливаем Python 3 и edge-tts для озвучки в Docker
RUN apk add --no-cache python3 py3-pip && \
    pip3 install --no-cache-dir edge-tts --break-system-packages

COPY package*.json ./
RUN npm install --omit=dev

# Копируем бэкенд и собранный фронтенд
COPY server/ ./server/
COPY --from=builder /app/dist ./dist

# Создаем папки для хранения данных
RUN mkdir -p server/data server/tts_cache

EXPOSE 5005
ENV NODE_ENV=production
ENV PORT=5005

CMD ["node", "server/server.js"]
