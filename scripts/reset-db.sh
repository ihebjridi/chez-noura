#!/bin/bash

# Database reset script for Chez Noura Platform
# Drops the database, reapplies all migrations, and runs the seed script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.prod"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if docker-compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    log_error "Docker compose file not found: $COMPOSE_FILE"
    exit 1
fi

# Compose invocation: use env file if present
COMPOSE_CMD="docker compose -f $COMPOSE_FILE"
if [ -f "$ENV_FILE" ]; then
    COMPOSE_CMD="$COMPOSE_CMD --env-file $ENV_FILE"
else
    log_warn "Env file not found: $ENV_FILE (using default env)"
fi

# Check if backend service is running
if ! $COMPOSE_CMD ps backend | grep -q "Up"; then
    log_error "Backend service is not running. Please start it first with: $COMPOSE_CMD up -d"
    exit 1
fi

log_info "Resetting database (drop, migrate, seed)..."

# Run Prisma migrate reset in backend container (--force for non-interactive)
$COMPOSE_CMD exec backend sh -lc 'cd /app/apps/backend && pnpm prisma migrate reset --force' || {
    log_error "Database reset failed!"
    exit 1
}

log_info "Database reset completed successfully."
