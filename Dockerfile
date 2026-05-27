# syntax=docker/dockerfile:1

FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS app
WORKDIR /app/backend

ENV NODE_ENV=production

COPY backend/package*.json ./
RUN npm install --omit=dev

COPY backend/ ./
COPY --from=frontend-build /app/frontend/build /app/frontend/build

EXPOSE 5000

CMD ["node", "server.js"]