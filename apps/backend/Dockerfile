FROM node:24-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache openssl

ENV CI=true
ENV NODE_ENV=production

# 1) Install all deps (needed to build)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY apps/backend/package.json ./apps/backend/package.json
RUN pnpm install --frozen-lockfile

# 2) Copy source
COPY . .

# 3) Build workspace + backend
RUN pnpm --filter "./packages/*" build \
 && cd apps/backend \
 && pnpm build

# 4) Prune to prod deps
RUN pnpm prune --prod

# 5) Ensure Prisma client is generated for the pruned prod node_modules
# Install prisma CLI temporarily, generate, then remove it.
RUN pnpm -C apps/backend add -D prisma@^7.2.0 \
 && pnpm -C apps/backend prisma:generate \
 && pnpm -C apps/backend remove prisma

WORKDIR /app/apps/backend
EXPOSE 3000
CMD ["node", "dist/main.js"]
