#!/bin/bash

# Deployment script for Chez Noura Platform
# This script handles pulling latest images, running migrations, and restarting services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

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

# Check if .env file exists
if [ ! -f ".env" ]; then
    log_warn ".env file not found. Please create it from docker-compose.prod.env.example"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

log_info "Starting deployment process..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup current database (if running)
if docker compose -f "$COMPOSE_FILE" ps postgres | grep -q "Up"; then
    log_info "Creating database backup..."
    docker compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U "${POSTGRES_USER:-postgres}" "${POSTGRES_DB:-db_chez-noura}" > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql" || log_warn "Database backup failed, continuing..."
fi

# Login to GHCR (if not already logged in)
if [ -n "$GITHUB_TOKEN" ] && [ -n "$GITHUB_USERNAME" ]; then
    log_info "Logging in to GitHub Container Registry..."
    echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_USERNAME" --password-stdin 2>/dev/null || log_warn "GHCR login failed, continuing..."
else
    log_warn "GITHUB_TOKEN or GITHUB_USERNAME not set. Skipping GHCR login (may already be logged in)"
fi

# Pull latest images
log_info "Pulling latest images..."
docker compose -f "$COMPOSE_FILE" pull

# Run database migrations
log_info "Running database migrations..."
docker compose -f "$COMPOSE_FILE" run --rm backend pnpm --filter backend prisma migrate deploy || {
    log_error "Migration failed!"
    exit 1
}

# Stop services gracefully
log_info "Stopping services..."
docker compose -f "$COMPOSE_FILE" down

# Start services
log_info "Starting services..."
docker compose -f "$COMPOSE_FILE" up -d

# Wait for services to be healthy
log_info "Waiting for services to be healthy..."
sleep 30

# Health check
log_info "Checking service health..."
if docker compose -f "$COMPOSE_FILE" ps | grep -q "unhealthy"; then
    log_error "Some services are unhealthy!"
    docker compose -f "$COMPOSE_FILE" ps
    exit 1
fi

# Show service status
log_info "Service status:"
docker compose -f "$COMPOSE_FILE" ps

log_info "Deployment completed successfully!"
log_info "Services are running. Check logs with: docker compose -f $COMPOSE_FILE logs -f"
