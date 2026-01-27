# syntax=docker/dockerfile:1.6

FROM node:24-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache openssl

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY apps/backend/package.json ./apps/backend/package.json
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter "./packages/*" build \
 && DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dummy" pnpm -C apps/backend prisma:generate \
 && pnpm -C apps/backend build


FROM node:24-alpine AS runtime
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache openssl

ENV CI=true
ENV NODE_ENV=production

# Allow prisma engines scripts if needed
RUN pnpm config set ignore-scripts false

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY apps/backend/package.json ./apps/backend/package.json
RUN pnpm install --frozen-lockfile --prod

COPY --from=build /app/packages/contracts/dist ./packages/contracts/dist
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=build /app/apps/backend/prisma.config.ts ./apps/backend/prisma.config.ts

# IMPORTANT: run from the backend directory (no -C) so --schema resolves correctly
WORKDIR /app/apps/backend
RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dummy" \
    pnpm dlx prisma@7.2.0 generate --schema ./prisma/schema.prisma

EXPOSE 3000
CMD ["node", "dist/main.js"]
