# ─── Build stage ────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Build tools for native modules (argon2, etc.)
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

# Remove dev dependencies to slim down
RUN npm prune --omit=dev

# ─── Production stage ──────────────────────────────────────────
FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma/

RUN mkdir -p uploads

EXPOSE 3000
CMD ["node", "dist/main.js"]
