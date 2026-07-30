# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
# VITE_API_URL is intentionally left unset here — nginx.conf below reverse-proxies
# /api and /uploads to the backend container on the same origin, so the app's
# default relative "/api" base URL works correctly with no build-time config.
RUN npm run build

# ---- Serve stage ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
