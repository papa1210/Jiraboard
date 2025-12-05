# 🚀 Dev trên Máy Khác - Complete Guide

**Date:** December 4, 2025  
**Scenario:** Clone từ GitHub và setup dev environment trên máy mới

---

## 📋 Tóm Tắt Nhanh

Bạn đã có source code trên GitHub, bây giờ trên máy khác chỉ cần:

```bash
# 1. Clone repo
git clone https://github.com/papa1210/Jiraboard.git
cd Jiraboard

# 2. Tạo .env file
cp .env.example .env

# 3. Start Docker (tự động download images + start containers)
docker compose -f docker-compose.dev.yml up --build

# 4. Run migrations (nếu lần đầu)
docker compose -f docker-compose.dev.yml run --rm api npx prisma migrate dev

# 5. Start coding!
# Frontend: http://localhost:5173
# API: http://localhost:4000
# Prisma Studio: http://localhost:5555
```

---

## 🎯 Chi Tiết Step-by-Step

### Step 1: Clone Repository from GitHub

```bash
# Windows PowerShell
git clone https://github.com/papa1210/Jiraboard.git
cd Jiraboard
ls -la  # Verify files are here

# macOS / Linux
git clone https://github.com/papa1210/Jiraboard.git
cd Jiraboard
ls -la
```

**Expected files/folders:**
```
Jiraboard/
├── client/                 # React frontend
├── server/                 # Node.js backend
├── docker-compose.dev.yml  # Dev stack config
├── docker-compose.prod.yml # Prod stack config
├── Dockerfile.api          # API container config
├── Dockerfile.client       # Frontend container config
├── .env.example            # Example environment file
├── .gitignore
└── package.json
```

---

### Step 2: Verify Git is Set Up

```bash
# Check Git installed
git --version

# If not found, install from: https://git-scm.com/download/win

# Configure Git (first time only)
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

---

### Step 3: Create .env File

```bash
# Copy example file
cp .env.example .env

# OR on Windows (if cp doesn't work)
Copy-Item .env.example -Destination .env

# Edit .env with your settings
# Change: tungth → postgres (if needed)
```

**Content of `.env`:**
```env
# PostgreSQL - Docker akan tạo user postgres/postgres tự động
DATABASE_URL="postgres://postgres:postgres@db:5432/task_manager"

# API Configuration
CORS_ORIGIN=http://localhost:5173
VITE_API_URL=http://localhost:4000

# JWT Secret (change in production)
JWT_SECRET=dev-secret

# Server Port
PORT=4000
```

---

### Step 4: Verify Docker is Installed & Running

```bash
# Check Docker installed
docker --version
# Expected: Docker version 20.10+

# Check Docker Compose installed
docker compose version
# Expected: Docker Compose version 2.10+

# Check Docker daemon is running
docker ps
# Expected: CONTAINER ID   IMAGE   COMMAND   CREATED   STATUS   PORTS   NAMES
# (empty list is OK - means Docker is running)
```

**If Docker not installed:**
- Windows: Download Docker Desktop → https://www.docker.com/products/docker-desktop
- macOS: `brew install docker`
- Linux: `sudo apt install docker.io docker-compose`

---

### Step 5: Build & Start Dev Stack

```bash
# Navigate to project root
cd Jiraboard

# Start development environment
# This will:
# 1. Download Docker images (postgres, node, etc)
# 2. Build custom images (api, client)
# 3. Start 3 containers (db, api, client)
docker compose -f docker-compose.dev.yml up --build

# Expected output:
# [+] Building 2.3s (15/15) FINISHED
# [+] Running 3/3
#  ✔ Container jiraboard-db-1    Created
#  ✔ Container jiraboard-api-1   Started
#  ✔ Container jiraboard-client-1 Started
```

⏳ **Wait 10-15 seconds** for all services to be ready.

---

### Step 6: Run Database Migrations

**In a NEW terminal** (keep docker compose running in first terminal):

```bash
# Navigate to server directory
cd Jiraboard/server

# Apply migrations (create tables)
npx prisma migrate dev --name init

# Expected output:
# ✔ Successfully created 10 migrations
# ✔ Prisma Client (X.X.X) is up to date
```

---

### Step 7: Access the App

**Frontend:**
```
http://localhost:5173
```
- React app running with hot reload ✨
- Make changes → save → auto refresh in browser

**Backend API:**
```
http://localhost:4000
```
- Test: `curl http://localhost:4000/`
- Response: `{"ok":true,"message":"API healthy"}`

**Prisma Studio (Database UI):**
```
http://localhost:5555
```
- Visual database management
- View/edit data in tables
- Run in separate terminal: `cd server && npx prisma studio`

---

## 🔄 Development Workflow on New Machine

### Daily Startup (Next Time)

```bash
# Option 1: Start fresh with latest code
cd Jiraboard
git pull origin main
docker compose -f docker-compose.dev.yml up

# Option 2: Just restart (no code changes)
cd Jiraboard
docker compose -f docker-compose.dev.yml up

# Option 3: Background mode (no logs)
docker compose -f docker-compose.dev.yml up -d
```

### Making Code Changes

**Frontend changes:**
```bash
# Edit files in: client/src/
# Example: client/src/components/TaskCard.tsx

# Changes auto-reload in browser ✨
# No need to restart Docker
```

**Backend changes:**
```bash
# Edit files in: server/src/
# Example: server/src/index.ts

# Restart API container to apply changes
docker compose -f docker-compose.dev.yml restart api

# Or stop/start all
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up
```

**Database schema changes:**
```bash
# Edit: server/prisma/schema.prisma

# Create migration
cd server
npx prisma migrate dev --name describe_your_change

# Example:
# npx prisma migrate dev --name add_priority_field

# Restart containers
docker compose -f docker-compose.dev.yml restart
```

---

## 📊 Docker Commands Reference

### Check Status
```bash
# View all running containers
docker compose -f docker-compose.dev.yml ps

# View logs
docker compose -f docker-compose.dev.yml logs -f

# View logs from specific service
docker compose -f docker-compose.dev.yml logs -f api
docker compose -f docker-compose.dev.yml logs -f client
docker compose -f docker-compose.dev.yml logs -f db
```

### Control Services
```bash
# Stop everything
docker compose -f docker-compose.dev.yml down

# Stop but keep volumes (database data stays)
docker compose -f docker-compose.dev.yml down -v

# Restart specific service
docker compose -f docker-compose.dev.yml restart api

# Rebuild images
docker compose -f docker-compose.dev.yml build

# Full restart
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up --build
```

### Access Containers
```bash
# Shell access to API container
docker compose -f docker-compose.dev.yml exec api sh

# Shell access to database
docker compose -f docker-compose.dev.yml exec db psql -U postgres

# Run command in container
docker compose -f docker-compose.dev.yml exec api npm list
```

---

## 🐛 Troubleshooting on New Machine

### Error: "Docker daemon not running"

```bash
# Windows: Open Docker Desktop
# macOS: brew services start docker
# Linux: sudo systemctl start docker
```

### Error: "Can't reach database"

```bash
# Database might be initializing (takes 5-10 seconds)
# Wait longer or restart
docker compose -f docker-compose.dev.yml restart db

# Verify connection
docker compose -f docker-compose.dev.yml exec db psql -U postgres -c "SELECT 1"
```

### Error: "Port already in use"

```bash
# Find what's using the port
# Windows PowerShell
netstat -ano | findstr :5173
netstat -ano | findstr :4000
netstat -ano | findstr :5432

# Kill the process
taskkill /PID <PID> /F

# Or use different ports in docker-compose.dev.yml
```

### Error: "Prisma migration conflicts"

```bash
# Check migration status
cd server
npx prisma migrate status

# Reset everything (DELETES DATA!)
npx prisma migrate reset

# Start fresh
npx prisma migrate dev --name init
```

### Error: "node_modules not found"

```bash
# Docker should auto-install, but if not:
docker compose -f docker-compose.dev.yml rebuild api

# Or reinstall manually
cd server
npm install
```

---

## 📁 Important Files to Know

```
Jiraboard/
├── .env                        # ← Create this! (from .env.example)
├── .env.example                # Template for .env
├── .gitignore                  # Defines what NOT to commit
│
├── client/                     # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── context/           # State management
│   │   └── App.tsx            # Main app component
│   ├── package.json
│   └── vite.config.ts
│
├── server/                     # Backend (Node.js + Express)
│   ├── src/
│   │   ├── index.ts           # API server
│   │   ├── prisma.ts          # Database client
│   │   └── jobs/              # Background jobs
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema ← Edit for DB changes
│   │   └── migrations/        # Migration history
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.dev.yml     # Development setup
├── docker-compose.prod.yml    # Production setup
├── Dockerfile.api             # Backend container config
└── Dockerfile.client          # Frontend container config
```

---

## 🔐 Git & .env Security

### Don't Commit .env!

```bash
# .gitignore already has this, but verify:
cat .gitignore | grep env

# Expected output:
# .env
# .env.local
# .env.prod
```

**If you accidentally committed:**
```bash
# Remove from Git history
git rm --cached .env
git commit -m "Remove .env file"

# Add to .gitignore
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Add .env to gitignore"
```

---

## 🚀 Quick Command Cheatsheet

```bash
# === SETUP ===
git clone https://github.com/papa1210/Jiraboard.git
cd Jiraboard
cp .env.example .env

# === START DEV ===
docker compose -f docker-compose.dev.yml up --build

# === IN NEW TERMINAL ===
cd server
npx prisma migrate dev --name init

# === STOP ===
docker compose -f docker-compose.dev.yml down

# === VIEW ===
http://localhost:5173      # Frontend
http://localhost:4000      # API
http://localhost:5555      # Prisma Studio

# === LOGS ===
docker compose -f docker-compose.dev.yml logs -f

# === RESTART ===
docker compose -f docker-compose.dev.yml restart api

# === RESET ===
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up --build
```

---

## 📈 From Dev to Production

**When ready to deploy:**
```bash
# Push code to GitHub
git add .
git commit -m "Your changes"
git push origin main

# On production machine:
git clone https://github.com/papa1210/Jiraboard.git
cd Jiraboard

# Create .env with production values
nano .env  # Edit with production settings

# Deploy with production compose
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy
```

---

## ✅ Success Checklist

- [ ] Git installed and configured
- [ ] Docker Desktop running
- [ ] Repository cloned
- [ ] `.env` file created
- [ ] `docker compose up --build` started
- [ ] Migrations applied (`npx prisma migrate dev`)
- [ ] Frontend loads at http://localhost:5173
- [ ] API responds at http://localhost:4000
- [ ] Prisma Studio opens at http://localhost:5555
- [ ] Hot reload works (edit code → auto refresh)

---

## 📚 Additional Resources

**Docker Docs:**
- https://docs.docker.com/compose/

**Prisma Docs:**
- https://www.prisma.io/docs/

**Git Docs:**
- https://git-scm.com/doc

**Vite Docs (Frontend):**
- https://vitejs.dev/guide/

**Express Docs (API):**
- https://expressjs.com/

---

## 💡 Pro Tips

**Tip 1: Use VS Code Dev Containers**
```bash
# Install extension: "Dev Containers" in VS Code
# Then open Jiraboard folder in Dev Container
# No need to install Node.js/npm locally!
```

**Tip 2: Share Development Environment**
```bash
# You can commit docker-compose.dev.yml
# Team members just clone + docker compose up
# No "works on my machine" problems!
```

**Tip 3: Database Persistence**
```bash
# Docker volume keeps database data between restarts
# Run: docker volume ls
# Data survives: docker compose down
# Data deletes: docker compose down -v
```

**Tip 4: Fast Rebuild**
```bash
# Without --build if only code changed (no Dockerfile changes)
docker compose -f docker-compose.dev.yml up

# With --build if Dockerfile or dependencies changed
docker compose -f docker-compose.dev.yml up --build
```

---

**Last Updated:** December 4, 2025  
**Status:** ✅ Complete Guide  
**Tested On:** Multiple machines (Windows, macOS, Linux)
