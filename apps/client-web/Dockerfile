# Client Web Dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts/package.json ./packages/contracts/
COPY apps/client-web/package.json ./apps/client-web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS build

# Copy all source files
COPY . .

# Build packages first
RUN pnpm --filter "./packages/*" build

# Build Next.js app with standalone output
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN pnpm --filter client-web build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy standalone output from build
COPY --from=build /app/apps/client-web/.next/standalone ./
COPY --from=build /app/apps/client-web/.next/static ./apps/client-web/.next/static
COPY --from=build /app/apps/client-web/public ./apps/client-web/public

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "apps/client-web/server.js"]
