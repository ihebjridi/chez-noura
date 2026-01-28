#!/bin/bash

# Database seed script for Chez Noura Platform
# This script runs the Prisma seed script in the backend container

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"

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

# Check if backend service is running
if ! docker compose -f "$COMPOSE_FILE" ps backend | grep -q "Up"; then
    log_error "Backend service is not running. Please start it first with: docker compose -f $COMPOSE_FILE up -d"
    exit 1
fi

log_info "Running database seed script..."

# Run seed script
docker compose -f "$COMPOSE_FILE" exec backend pnpm --filter backend prisma:seed || {
    log_error "Seed failed!"
    exit 1
}

log_info "Seed completed successfully!"
