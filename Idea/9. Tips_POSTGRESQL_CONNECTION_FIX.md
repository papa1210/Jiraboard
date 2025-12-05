# 🚀 Fix: Can't reach database server at localhost:5432

**Error:** PostgreSQL connection failed  
**Cause:** PostgreSQL container/server is NOT running  
**Date:** December 4, 2025

---

## ⚡ Quick Fix (Copy & Paste)

### Windows PowerShell

```powershell
# Navigate to project
cd "c:\Users\Huu Tung\Downloads\jira-clone---task-manager"

# Start PostgreSQL container
docker compose -f docker-compose.dev.yml up -d db

# Wait 5 seconds for DB to start
Start-Sleep -Seconds 5

# Verify connection
docker compose -f docker-compose.dev.yml exec db psql -U postgres -c "SELECT 1"

# Expected output: 1 (connection successful)
```

### macOS / Linux Bash

```bash
cd ~/Downloads/jira-clone---task-manager

# Start PostgreSQL
docker compose -f docker-compose.dev.yml up -d db

# Wait for startup
sleep 5

# Test connection
docker compose -f docker-compose.dev.yml exec db psql -U postgres -c "SELECT 1"
```

---

## 📋 Step-by-Step Instructions

### Step 1: Check Docker is Running

**Windows:**
```powershell
# Verify Docker daemon is running
docker ps

# Expected output: CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS   PORTS   NAMES
# (empty list is OK - means Docker is running but no containers)
```

**If Docker not running:**
- Open Docker Desktop application
- Wait 30 seconds for Docker daemon to start
- Try `docker ps` again

---

### Step 2: Start PostgreSQL

```powershell
cd "c:\Users\Huu Tung\Downloads\jira-clone---task-manager"

# Start only the database container
docker compose -f docker-compose.dev.yml up -d db

# Expected output:
# [+] Running 1/1
#  ✔ Container jira-clone---task-manager-db-1  Started

# Wait for database to be ready (usually 5-10 seconds)
Start-Sleep -Seconds 5
```

---

### Step 3: Verify PostgreSQL is Running

```powershell
# Check if container is running
docker compose -f docker-compose.dev.yml ps db

# Expected output:
# NAME                              COMMAND      SERVICE   STATUS      PORTS
# jira-clone---task-manager-db-1    postgres     db        Up (healthy)   5432/tcp
```

---

### Step 4: Test Database Connection

```powershell
# Test with psql
docker compose -f docker-compose.dev.yml exec db psql -U postgres -c "SELECT 1"

# Expected output:
#  ?column?
# ----------
#         1
# (1 row)
```

If you see "1", PostgreSQL is working! ✅

---

### Step 5: Create Database (if needed)

```powershell
# Check if database exists
docker compose -f docker-compose.dev.yml exec db psql -U postgres -c "SELECT datname FROM pg_database WHERE datname = 'task_manager'"

# If empty, create it
docker compose -f docker-compose.dev.yml exec db psql -U postgres -c "CREATE DATABASE task_manager"

# Expected output:
# CREATE DATABASE
```

---

### Step 6: Run Prisma Migrations

```powershell
cd server

# Navigate to server directory
# Run migrations to create tables
npx prisma migrate deploy

# Expected output:
# ✔ Applied migration from ./prisma/migrations/...
# ✔ Applied migration from ./prisma/migrations/...
```

---

### Step 7: Open Prisma Studio

```powershell
cd server

# Open Prisma Studio (will automatically open in browser)
npx prisma studio

# Expected output:
# Environment variables loaded from .env
# Prisma Studio is running on http://localhost:5555
```

**Browser opens automatically to:** http://localhost:5555 ✨

---

## 🔍 Troubleshooting

### Error: "Docker daemon not running"

**Windows:**
```powershell
# Option 1: Open Docker Desktop manually
# Click Start → search for "Docker Desktop" → Launch it
# Wait 30 seconds

# Option 2: Command line
# (If Docker is installed via WSL2)
wsl --update
docker ps  # Try again
```

---

### Error: "Can't connect to Docker daemon"

```powershell
# Check if WSL is running
wsl -l -v

# If not found, reinstall Docker Desktop with WSL2 backend
# https://docs.docker.com/desktop/install/windows-install/
```

---

### Error: "Database still says 'cannot connect'"

**Step 1: Check if container is healthy**
```powershell
docker compose -f docker-compose.dev.yml logs db | tail -20

# Look for errors like:
# - "FATAL: listen on IPv6 port failed"
# - "FATAL: could not create listen socket"
```

**Step 2: Force recreate container**
```powershell
# Stop and remove
docker compose -f docker-compose.dev.yml down db

# Start fresh
docker compose -f docker-compose.dev.yml up -d db

# Wait
Start-Sleep -Seconds 10

# Test
docker compose -f docker-compose.dev.yml exec db psql -U postgres -c "SELECT 1"
```

**Step 3: Check if port 5432 is blocked**
```powershell
# Find process using port 5432
netstat -ano | findstr :5432

# If found, kill it
taskkill /PID <PID> /F

# Or change docker-compose port mapping to 5433
# Edit docker-compose.dev.yml:
#   services:
#     db:
#       ports:
#         - "5433:5432"  # Change to 5433
#
# Then update .env DATABASE_URL
```

---

### Error: "Prisma migration fails"

```powershell
# If tables don't exist, create schema first
cd server
npx prisma db push

# Then try again
npx prisma migrate deploy

# If still fails, reset everything
npx prisma migrate reset  # ⚠️ WARNING: DELETES ALL DATA!
```

---

## 📊 Complete Checklist

- [ ] Docker Desktop is running (verify with `docker ps`)
- [ ] PostgreSQL container started: `docker compose -f docker-compose.dev.yml up -d db`
- [ ] Database is healthy: `docker compose -f docker-compose.dev.yml ps db` shows "Up"
- [ ] Connection works: `docker compose -f docker-compose.dev.yml exec db psql -U postgres -c "SELECT 1"` returns "1"
- [ ] Database created: `task_manager` database exists
- [ ] Migrations applied: All migrations successful
- [ ] Prisma Studio opens: `npx prisma studio` works at http://localhost:5555

---

## 🎯 Success Indicators

**✅ PostgreSQL is running when you see:**
```
CONTAINER ID   IMAGE                COMMAND                SERVICE   STATUS      PORTS
abc123def456   postgres:16-alpine   "docker-entrypoint..."  db        Up (healthy)  5432/tcp
```

**✅ Connection works when you see:**
```
?column?
----------
       1
```

**✅ Prisma Studio loads when:**
- Browser opens to http://localhost:5555
- You see tables listed (User, Project, Task, Sprint, etc.)
- You can click on a table to view data

---

## 🛑 If All Else Fails: Nuclear Reset

```powershell
cd "c:\Users\Huu Tung\Downloads\jira-clone---task-manager"

# 1. Stop everything
Write-Host "Stopping all containers..." -ForegroundColor Red
docker compose -f docker-compose.dev.yml down

# 2. Remove volumes (DELETES DATABASE!)
Write-Host "Removing volumes (data will be lost)..." -ForegroundColor Red
docker compose -f docker-compose.dev.yml down -v

# 3. Clean images
Write-Host "Cleaning Docker images..." -ForegroundColor Red
docker image prune -f

# 4. Start fresh
Write-Host "Starting fresh..." -ForegroundColor Green
docker compose -f docker-compose.dev.yml up -d db

# 5. Wait
Start-Sleep -Seconds 10

# 6. Test
Write-Host "Testing connection..." -ForegroundColor Green
docker compose -f docker-compose.dev.yml exec db psql -U postgres -c "SELECT 1"

# 7. Migrate
Write-Host "Running migrations..." -ForegroundColor Green
cd server
npx prisma migrate deploy

# 8. Studio
Write-Host "Opening Prisma Studio..." -ForegroundColor Green
npx prisma studio
```

---

## 📞 Quick Commands Reference

```bash
# Start database only
docker compose -f docker-compose.dev.yml up -d db

# Start everything (API + Frontend + Database)
docker compose -f docker-compose.dev.yml up -d

# Stop everything
docker compose -f docker-compose.dev.yml down

# View logs
docker compose -f docker-compose.dev.yml logs db

# Check status
docker compose -f docker-compose.dev.yml ps

# Access PostgreSQL CLI
docker compose -f docker-compose.dev.yml exec db psql -U postgres

# Run migrations
cd server && npx prisma migrate deploy

# Open Prisma Studio
cd server && npx prisma studio

# Restart database
docker compose -f docker-compose.dev.yml restart db
```

---

## 🔐 Database Credentials

**For `.env` file:**
```env
DATABASE_URL="postgres://postgres:postgres@localhost:5432/task_manager"
```

**Breakdown:**
- `postgres://` — Protocol
- `postgres:postgres` — Username:Password (default is postgres/postgres)
- `localhost:5432` — Host:Port (Docker exposes as localhost:5432 on your machine)
- `task_manager` — Database name

---

## ✅ Expected Success Flow

```
1. Run: docker compose -f docker-compose.dev.yml up -d db
   ↓
2. See: "jira-clone---task-manager-db-1  Started"
   ↓
3. Run: docker compose -f docker-compose.dev.yml exec db psql -U postgres -c "SELECT 1"
   ↓
4. See: "1" (the number one)
   ↓
5. Run: cd server && npx prisma studio
   ↓
6. Browser opens at http://localhost:5555
   ↓
7. See Prisma Studio dashboard with tables listed
   ↓
✅ SUCCESS!
```

---

**Last Updated:** December 4, 2025  
**Status:** Ready to Use  
**Tested On:** Docker Desktop for Windows
