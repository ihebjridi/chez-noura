FROM node:24-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache openssl

ENV CI=true
ENV NODE_ENV=production

# Install deps (workspace)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY apps/backend/package.json ./apps/backend/package.json
RUN pnpm install --frozen-lockfile

# Copy code
COPY . .

# Build contracts + generate prisma types + build backend
RUN pnpm --filter "./packages/*" build \
 && pnpm -C apps/backend prisma:generate \
 && pnpm -C apps/backend build

# Prune to prod deps
RUN pnpm prune --prod

# Re-generate prisma client for the pruned prod node_modules (runtime safety)
RUN pnpm -C apps/backend add -D prisma@^7.2.0 \
 && pnpm -C apps/backend prisma:generate \
 && pnpm -C apps/backend remove prisma

WORKDIR /app/apps/backend
EXPOSE 3000
CMD ["node", "dist/main.js"]
