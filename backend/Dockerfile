FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Local-disk uploads persist via a volume mount in docker-compose.yml.
# If S3_* env vars are set instead, this directory is simply unused.
RUN mkdir -p uploads

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server.js"]
