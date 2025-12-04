# 🚀 Production Deploy Guide with Docker Compose

**Date:** December 4, 2025  
**Status:** ✅ Ready for Production

---

## ❓ Câu hỏi: "docker compose build && up -d có start PostgreSQL không?"

### ✅ **CÓ - PostgreSQL sẽ start tự động**

Khi bạn chạy:
```bash
docker compose -f docker-compose.prod.yml build && docker compose -f docker-compose.prod.yml up -d
```

Nó sẽ:
1. ✅ **Build** 2 Docker images (api + client)
2. ✅ **Start 3 services:**
   - `db` (PostgreSQL)
   - `api` (Node.js backend)
   - `client` (Nginx frontend)

---

## 📋 Services trong docker-compose.prod.yml

| Service | Image | Port | Status |
|---------|-------|------|--------|
| **db** | postgres:16-alpine | 5432 | ✅ **STARTS** |
| **api** | Node.js (Dockerfile.api) | 4000 | ✅ Waits for DB |
| **client** | Nginx (Dockerfile.client) | 80 | ✅ Waits for API |

### Service Dependency Flow:
```
db (PostgreSQL)
  ↓ (waits for healthy)
api (Node.js)
  ↓ (waits for healthy)
client (Nginx)
```

---

## 🎯 Complete Production Deployment

### Step 1: Prepare Environment File

Create `.env` in project root:

```bash
# .env
# ===== DATABASE =====
DATABASE_URL=postgres://postgres:postgres@db:5432/task_manager

# ===== JWT =====
JWT_SECRET=your-very-strong-jwt-secret-at-least-32-characters-long

# ===== URLS =====
CORS_ORIGIN=https://yourdomain.com
VITE_API_URL=https://yourdomain.com/api

# ===== NODE =====
NODE_ENV=production
PORT=4000
```

### Step 2: Generate Strong JWT Secret

```bash
# macOS / Linux
openssl rand -base64 32

# Windows PowerShell
$random = [System.Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
Write-Host $random
```

**Example output:**
```
abc123xyz789==/Random/String/Here/At/Least/32/Chars
```

Copy this and paste in `.env` as `JWT_SECRET`

---

### Step 3: Build and Start

```bash
# Navigate to project
cd /path/to/jira-clone---task-manager

# Build Docker images
docker compose -f docker-compose.prod.yml build

# Start all services (db, api, client) in background
docker compose -f docker-compose.prod.yml up -d

# Wait for PostgreSQL to be ready (5-10 seconds)
sleep 10
```

---

### Step 4: Run Database Migrations

**IMPORTANT:** Migrations are NOT run automatically. You must run manually:

```bash
# Create database schema and tables
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy

# Expected output:
# ✔ Applied migration `20250101000000_init`
# ✔ Applied migration `20250102000000_add_users`
# ...
```

---

### Step 5: Verify All Services are Running

```bash
# Check status
docker compose -f docker-compose.prod.yml ps

# Expected output:
# NAME                     COMMAND                 SERVICE   STATUS           PORTS
# jira-db-1                postgres                db        Up (healthy)     5432/tcp
# jira-api-1               node dist/src/index.js  api       Up (healthy)     0.0.0.0:4000->4000/tcp
# jira-client-1            nginx -g daemon        client    Up               0.0.0.0:80->80/tcp
```

**Look for:**
- ✅ All 3 services show `Up`
- ✅ `db` and `api` show `(healthy)`
- ✅ Ports are mapped correctly

---

### Step 6: Test the Application

**Test Backend:**
```bash
curl http://localhost:4000/
# Expected response: { "ok": true, "message": "API healthy" }
```

**Test Frontend:**
```bash
# Open in browser
http://localhost:80
# Should see the Jira-like task manager UI
```

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a strong random string (32+ characters)
- [ ] Set `CORS_ORIGIN` to your actual domain (not localhost)
- [ ] Set `VITE_API_URL` to your actual API domain
- [ ] Use HTTPS (get SSL certificate from Let's Encrypt)
- [ ] Never commit `.env` file to Git
- [ ] Add `.env` to `.gitignore`
- [ ] Use Docker secrets for sensitive data (production best practice)
- [ ] Implement rate limiting on API
- [ ] Setup database backups with `pg_dump`

---

## 📊 What's New in Updated docker-compose.prod.yml

### ✨ Health Checks

```yaml
# Database health check
db:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U postgres"]
    interval: 10s
    timeout: 5s
    retries: 5

# API health check
api:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:4000/"]
    interval: 30s
    timeout: 10s
    retries: 3
```

**Benefits:**
- ✅ Services won't start until dependencies are truly healthy
- ✅ Automatic restart on failure
- ✅ Better reliability

### 🔗 Proper Dependency Ordering

```yaml
api:
  depends_on:
    db:
      condition: service_healthy  # ← Waits for DB health check

client:
  depends_on:
    api:
      condition: service_healthy  # ← Waits for API health check
```

### 🔧 Environment Variables from .env

```yaml
api:
  environment:
    CORS_ORIGIN: ${CORS_ORIGIN:-http://localhost}
    JWT_SECRET: ${JWT_SECRET:-change-me-in-production}

client:
  build:
    args:
      VITE_API_URL: ${VITE_API_URL:-http://localhost:4000}
```

**Syntax:** `${VARIABLE_NAME:-default_value}`
- Uses value from `.env` if exists
- Falls back to default if not set

---

## 📝 Common Deployment Scenarios

### Scenario 1: Deploy on Ubuntu Server

```bash
# SSH into server
ssh user@your-server.com

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repo
git clone https://github.com/papa1210/Jiraboard.git
cd Jiraboard

# Create .env
cat > .env << EOF
DATABASE_URL=postgres://postgres:postgres@db:5432/task_manager
JWT_SECRET=$(openssl rand -base64 32)
CORS_ORIGIN=https://yourdomain.com
VITE_API_URL=https://yourdomain.com
NODE_ENV=production
EOF

# Deploy
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy

# Verify
docker compose -f docker-compose.prod.yml ps
```

---

### Scenario 2: Deploy on VPS with SSL (Let's Encrypt)

```bash
# Install Certbot & Nginx
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Generate SSL certificate
sudo certbot certonly --standalone -d yourdomain.com

# Update nginx.conf to use SSL
# volumes:
#   - /etc/letsencrypt/live/yourdomain.com:/certs:ro

# Rebuild client container
docker compose -f docker-compose.prod.yml build client

# Restart
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

---

### Scenario 3: Rollback to Previous Version

```bash
# Stop current services
docker compose -f docker-compose.prod.yml down

# Go back to previous Git commit
git checkout <previous-commit-hash>

# Rebuild and restart
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy
```

---

## 🐛 Troubleshooting

### Error: "db service is not ready"

```bash
# Check DB logs
docker compose -f docker-compose.prod.yml logs db

# If DB crashed, restart it
docker compose -f docker-compose.prod.yml restart db

# Wait and check health
docker compose -f docker-compose.prod.yml ps db
```

### Error: "API cannot connect to database"

```bash
# Check API logs
docker compose -f docker-compose.prod.yml logs api

# Verify DATABASE_URL in .env
cat .env | grep DATABASE_URL

# Should be: postgres://postgres:postgres@db:5432/task_manager
# (NOT localhost - use 'db' as hostname inside Docker)
```

### Error: "Port 80 already in use"

```bash
# Find what's using port 80
sudo lsof -i :80

# Option 1: Kill the process
sudo kill -9 <PID>

# Option 2: Use different port in docker-compose
# Change: - "80:80"
# To:     - "8080:80"
# Then access via http://yourdomain:8080
```

### Error: "Migrations failed"

```bash
# Check migration status
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate status

# Reset everything (DELETES ALL DATA)
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate reset

# Try migrations again
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy
```

---

## 🔄 Updating Production

### To Deploy New Code:

```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild images
docker compose -f docker-compose.prod.yml build

# 3. Stop old services
docker compose -f docker-compose.prod.yml down

# 4. Start new services
docker compose -f docker-compose.prod.yml up -d

# 5. Run any new migrations
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy

# 6. Verify
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

---

## 💾 Database Backup & Restore

### Backup Database

```bash
# Dump database to file
docker compose -f docker-compose.prod.yml exec db pg_dump -U postgres task_manager > backup.sql

# Compressed backup
docker compose -f docker-compose.prod.yml exec db pg_dump -U postgres task_manager | gzip > backup-$(date +%Y%m%d).sql.gz
```

### Restore Database

```bash
# From SQL file
docker compose -f docker-compose.prod.yml exec -T db psql -U postgres task_manager < backup.sql

# From compressed file
gunzip -c backup-20250104.sql.gz | docker compose -f docker-compose.prod.yml exec -T db psql -U postgres task_manager
```

### Automated Daily Backups

```bash
# Add to crontab
crontab -e

# Add this line (backup every day at 2 AM)
0 2 * * * cd /path/to/jira && docker compose -f docker-compose.prod.yml exec db pg_dump -U postgres task_manager | gzip > backups/backup-$(date +\%Y\%m\%d).sql.gz
```

---

## 📊 Monitoring Production

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f db
docker compose -f docker-compose.prod.yml logs -f client

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100
```

### Check Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df

# Prune unused images
docker system prune -a
```

---

## 🎯 Production Deployment Checklist

- [ ] `.env` file created with strong `JWT_SECRET`
- [ ] `CORS_ORIGIN` set to actual domain
- [ ] `VITE_API_URL` set to actual API URL
- [ ] `.env` added to `.gitignore`
- [ ] Docker & Docker Compose installed on server
- [ ] Ports 80, 443 open on firewall
- [ ] SSL certificate obtained (Let's Encrypt)
- [ ] `docker compose build` successful
- [ ] `docker compose up -d` starts all services
- [ ] Migrations run successfully
- [ ] All 3 services show `Up (healthy)`
- [ ] Frontend loads at http://yourdomain.com
- [ ] API responds at http://yourdomain.com:4000
- [ ] Database backups configured
- [ ] Monitoring logs setup

---

## 🆘 Quick Reference

```bash
# Build
docker compose -f docker-compose.prod.yml build

# Start
docker compose -f docker-compose.prod.yml up -d

# Stop
docker compose -f docker-compose.prod.yml down

# Migrate
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy

# Logs
docker compose -f docker-compose.prod.yml logs -f

# Status
docker compose -f docker-compose.prod.yml ps

# Restart service
docker compose -f docker-compose.prod.yml restart api

# Backup
docker compose -f docker-compose.prod.yml exec db pg_dump -U postgres task_manager > backup.sql

# Shell access
docker compose -f docker-compose.prod.yml exec api sh
docker compose -f docker-compose.prod.yml exec db psql -U postgres
```

---

**Last Updated:** December 4, 2025  
**Status:** ✅ Production Ready  
**Tested On:** Ubuntu 22.04 LTS, Docker 24.0+
