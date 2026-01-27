# Business Web Dockerfile
FROM node:24-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts/package.json ./packages/contracts/
COPY apps/business-web/package.json ./apps/business-web/

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

RUN pnpm --filter business-web build

# Production stage
FROM node:24-alpine AS production

WORKDIR /app

# Copy standalone output from build
COPY --from=build /app/apps/business-web/.next/standalone ./
COPY --from=build /app/apps/business-web/.next/static ./apps/business-web/.next/static
COPY --from=build /app/apps/business-web/public ./apps/business-web/public

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "apps/business-web/server.js"]
