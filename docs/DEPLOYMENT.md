# Deployment Guide

This guide covers deploying the Chez Noura platform to a VPS using Docker, GitHub Container Registry (GHCR), and CI/CD.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial VPS Setup](#initial-vps-setup)
- [GitHub Configuration](#github-configuration)
- [DNS Configuration](#dns-configuration)
- [SSL Certificate Setup](#ssl-certificate-setup)
- [Environment Configuration](#environment-configuration)
- [First Deployment](#first-deployment)
- [Updating Deployment](#updating-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- VPS with Ubuntu 20.04+ or similar Linux distribution
- Docker and Docker Compose installed
- Domain name with DNS access
- GitHub account with repository access
- SSH access to VPS

## Initial VPS Setup

### 1. Install Docker and Docker Compose

If not already installed:

```bash
# Update package index
sudo apt update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and back in for group changes to take effect
```

### 2. Install Nginx

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 3. Configure Firewall

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 4. Clone Repository (Optional - for manual deployments)

```bash
cd ~
git clone https://github.com/your-username/chez-noura.git
cd chez-noura
```

## GitHub Configuration

### 1. Configure GitHub Actions Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add:

- `GITHUB_TOKEN` (automatically available, but ensure package write permissions)
- `NEXT_PUBLIC_API_URL` (optional, defaults to `https://api.chez-noura.com`)

### 2. Configure Package Permissions

1. Go to repository Settings → Actions → General
2. Under "Workflow permissions", select "Read and write permissions"
3. Save

### 3. For Automated Deployment (Optional)

Add these secrets for automated deployment:

- `VPS_HOST`: Your VPS IP address or domain
- `VPS_USER`: SSH username
- `VPS_SSH_KEY`: Private SSH key for authentication
- `VPS_SSH_PORT`: SSH port (default: 22)
- `VPS_DEPLOY_PATH`: Path on VPS where deployment files are located (e.g., `~/chez-noura`)

## DNS Configuration

Configure DNS records for your domain. Add the following A records pointing to your VPS IP:

- `api.chez-noura.com` → Your VPS IP
- `admin.chez-noura.com` → Your VPS IP
- `business.chez-noura.com` → Your VPS IP
- `client.chez-noura.com` → Your VPS IP

Wait for DNS propagation (can take up to 48 hours, usually much faster).

## SSL Certificate Setup

### 1. Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Obtain SSL Certificates

```bash
sudo certbot --nginx -d api.chez-noura.com -d admin.chez-noura.com -d business.chez-noura.com -d client.chez-noura.com
```

Follow the prompts. Certbot will automatically configure Nginx.

### 3. Set Up Auto-Renewal

Certbot sets up auto-renewal automatically. Test it:

```bash
sudo certbot renew --dry-run
```

## Environment Configuration

### 1. Create Environment File

On your VPS, create a `.env` file in the project root:

```bash
cd ~/chez-noura  # or your deployment directory
cp docker-compose.prod.env.example .env
nano .env
```

### 2. Configure Environment Variables

Edit `.env` with your values:

```env
# GitHub Container Registry Configuration
GITHUB_USERNAME=your-github-username

# Docker Image Tags
BACKEND_IMAGE=ghcr.io/your-github-username/chez-noura-backend:latest
ADMIN_WEB_IMAGE=ghcr.io/your-github-username/chez-noura-admin-web:latest
BUSINESS_WEB_IMAGE=ghcr.io/your-github-username/chez-noura-business-web:latest
CLIENT_WEB_IMAGE=ghcr.io/your-github-username/chez-noura-employee-web:latest

# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-database-password-here
POSTGRES_DB=db_chez-noura

# Backend Configuration
DATABASE_URL=postgresql://postgres:your-secure-database-password-here@postgres:5432/db_chez-noura
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
BACKEND_PORT=3000

# Frontend Configuration
NEXT_PUBLIC_API_URL=https://api.chez-noura.com
```

**Important**: 
- Use strong, unique passwords
- Generate a secure JWT_SECRET (e.g., `openssl rand -base64 32`)
- Replace `your-github-username` with your actual GitHub username

### 3. Configure Nginx

Copy the Nginx configuration:

```bash
sudo cp ~/chez-noura/nginx/nginx.conf /etc/nginx/sites-available/chez-noura
sudo ln -s /etc/nginx/sites-available/chez-noura /etc/nginx/sites-enabled/
```

Update SSL certificate paths in the config if they differ from the default Let's Encrypt paths.

Test and reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## First Deployment

### 1. Login to GHCR

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

Or use a Personal Access Token with `read:packages` and `write:packages` permissions.

### 2. Pull Images

```bash
cd ~/chez-noura
docker compose -f docker-compose.prod.yml pull
```

### 3. Start Services

```bash
docker compose -f docker-compose.prod.yml up -d
```

### 4. Run Database Migrations

```bash
docker compose -f docker-compose.prod.yml run --rm backend pnpm --filter backend prisma migrate deploy
```

### 5. Verify Deployment

Check service status:

```bash
docker compose -f docker-compose.prod.yml ps
```

Check logs:

```bash
docker compose -f docker-compose.prod.yml logs -f
```

Test endpoints:
- `https://api.chez-noura.com/health`
- `https://admin.chez-noura.com`
- `https://business.chez-noura.com`
- `https://client.chez-noura.com`

## Updating Deployment

### Manual Update

1. Pull latest images:

```bash
cd ~/chez-noura
docker compose -f docker-compose.prod.yml pull
```

2. Run migrations (if any):

```bash
./scripts/migrate.sh
```

3. Restart services:

```bash
docker compose -f docker-compose.prod.yml up -d
```

Or use the deployment script:

```bash
./scripts/deploy.sh
```

### Automated Update via GitHub Actions

1. Push to `main` branch (images are built automatically)
2. Go to Actions tab in GitHub
3. Run the "Deploy to VPS" workflow manually or wait for automatic deployment (if configured)

## Troubleshooting

### Services Not Starting

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Check specific service
docker compose -f docker-compose.prod.yml logs backend
```

### Database Connection Issues

1. Verify database is running:
```bash
docker compose -f docker-compose.prod.yml ps postgres
```

2. Check DATABASE_URL in `.env` matches docker-compose service name

3. Test connection:
```bash
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d db_chez-noura
```

### Nginx Not Routing Correctly

1. Check Nginx configuration:
```bash
sudo nginx -t
```

2. Check Nginx logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

3. Verify services are listening on correct ports:
```bash
docker compose -f docker-compose.prod.yml ps
netstat -tlnp | grep -E '3000|3001|3002|3003'
```

### Image Pull Failures

1. Verify GHCR login:
```bash
docker login ghcr.io
```

2. Check image exists:
```bash
docker pull ghcr.io/your-username/chez-noura-backend:latest
```

3. Verify GitHub Actions workflow completed successfully

### CORS Errors

1. Verify CORS_ORIGINS in backend environment (if custom)
2. Check Nginx CORS headers configuration
3. Verify frontend NEXT_PUBLIC_API_URL matches backend domain

### File Upload Issues

1. Check uploads volume:
```bash
docker volume inspect chez-noura_backend_uploads
```

2. Verify permissions:
```bash
docker compose -f docker-compose.prod.yml exec backend ls -la /app/apps/backend/uploads
```

### Database Migration Failures

1. Check migration status:
```bash
docker compose -f docker-compose.prod.yml exec backend pnpm --filter backend prisma migrate status
```

2. Review migration files in `apps/backend/prisma/migrations`

3. Backup before running migrations:
```bash
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres db_chez-noura > backup.sql
```

## Backup Strategy

### Database Backups

Create a cron job for automated backups:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * docker compose -f ~/chez-noura/docker-compose.prod.yml exec -T postgres pg_dump -U postgres db_chez-noura > ~/backups/db_$(date +\%Y\%m\%d).sql
```

### File Upload Backups

```bash
# Backup uploads volume
docker run --rm -v chez-noura_backend_uploads:/data -v ~/backups:/backup alpine tar czf /backup/uploads_$(date +%Y%m%d).tar.gz /data
```

## Monitoring

Consider setting up:

- **Log aggregation**: Use Docker logging drivers or external services
- **Health monitoring**: Monitor `/health` endpoints
- **Uptime monitoring**: Use services like UptimeRobot or Pingdom
- **Resource monitoring**: Monitor CPU, memory, disk usage

## Security Best Practices

1. **Keep Docker updated**: `sudo apt update && sudo apt upgrade docker.io`
2. **Use strong passwords**: Generate secure passwords for database and JWT
3. **Limit SSH access**: Use key-based authentication, disable password auth
4. **Regular backups**: Automate database and file backups
5. **Monitor logs**: Regularly check application and system logs
6. **Keep images updated**: Regularly pull and deploy latest images
7. **Firewall rules**: Only expose necessary ports
8. **SSL certificates**: Ensure auto-renewal is working

## Support

For issues or questions:
- Check application logs: `docker compose -f docker-compose.prod.yml logs`
- Review GitHub Actions workflow runs
- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
