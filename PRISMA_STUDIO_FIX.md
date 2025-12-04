# 🔧 Fix Prisma Studio Errors - Complete Guide

**Date:** December 4, 2025  
**Status:** ✅ Solution Provided

---

## 🚨 Common Prisma Client Errors

### Error 1: "Can't reach database server"
```
error: P1000 Authentication failed against database server at `localhost:5432`
```
**Cause:** 
- ❌ PostgreSQL not running
- ❌ Wrong DATABASE_URL in `.env`
- ❌ Wrong credentials (username/password)

### Error 2: "Can't find .env file"
```
error: Environment variable not found: DATABASE_URL
```
**Cause:**
- ❌ Prisma not loading `.env` file
- ❌ Missing `import "dotenv/config"` in prisma client

### Error 3: "Prisma Client not generated"
```
error: @prisma/client not found. Make sure to run `prisma generate`
```
**Cause:**
- ❌ Prisma schema changed but not regenerated
- ❌ node_modules corrupted

### Error 4: "Connection pool exhausted"
```
error: P2024: Failed to start a new database session: exhausted all available connections
```
**Cause:**
- ❌ Too many concurrent connections
- ❌ Memory leak in connection handling

---

## ✅ Solution Steps

### Step 1: Verify PostgreSQL is Running

**Option A: Docker (Recommended)**
```bash
# Check if PostgreSQL container is running
docker ps | grep postgres

# If not running, start it
docker compose -f docker-compose.dev.yml up -d db

# Verify connection
docker compose -f docker-compose.dev.yml exec db psql -U postgres -c "SELECT 1"
```

**Option B: Local PostgreSQL**
```bash
# Windows PowerShell
Get-Service postgresql* | Start-Service

# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

**Option C: Test Connection**
```bash
# Using psql directly
psql -U postgres -d postgres -c "SELECT 1"

# Expected output: 1 (meaning connection successful)
```

---

### Step 2: Update `.env` File

**❌ BEFORE (Wrong):**
```env
DATABASE_URL="postgres://tungth:123456@localhost:5432/task_manager"
```

**✅ AFTER (Correct):**
```env
# PostgreSQL Connection String
DATABASE_URL="postgres://postgres:postgres@localhost:5432/task_manager"

# CORS and API Configuration
CORS_ORIGIN=http://localhost:5173
VITE_API_URL=http://localhost:4000

# JWT Secret (change in production)
JWT_SECRET=dev-secret

# Server Port
PORT=4000
```

**⚠️ Key Points:**
- Default PostgreSQL user: `postgres`
- Default PostgreSQL password: `postgres`
- Database name: `task_manager`
- Host: `localhost:5432` (local) or `db:5432` (Docker)

---

### Step 3: Fix Prisma Client

**❌ BEFORE (Missing dotenv):**
```typescript
// server/src/prisma.ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
```

**✅ AFTER (With dotenv):**
```typescript
// server/src/prisma.ts
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" 
    ? ["query", "error", "warn"]
    : ["error"],
});
```

---

### Step 4: Regenerate Prisma Client

```bash
cd server

# Clear old generation
rm -r node_modules/.prisma

# Regenerate
npx prisma generate

# Expected output:
# ✔ Generated Prisma Client (X.X.X) to .\node_modules\.prisma\client in XXXms
```

---

### Step 5: Run Prisma Studio

**Option A: From Terminal (Recommended)**
```bash
cd server

# Start Prisma Studio (opens in browser at http://localhost:5555)
npx prisma studio

# Expected output:
# Environment variables loaded from .env
# Prisma Studio is running on http://localhost:5555
```

**Option B: Docker Environment**
```bash
# If using Docker Compose dev
docker compose -f docker-compose.dev.yml run --rm api npx prisma studio

# Note: May need to expose port 5555 in docker-compose
```

---

## 🐛 Troubleshooting Steps

### If Still Getting "Can't reach database server"

**Step 1: Test PostgreSQL Connection**
```bash
# Test with psql
psql -U postgres -d task_manager -h localhost -c "SELECT 1"

# If fails: PostgreSQL is not running or credentials are wrong
```

**Step 2: Verify Credentials in Docker**
```bash
# Check PostgreSQL environment in docker-compose.dev.yml
docker compose -f docker-compose.dev.yml logs db | head -50

# Should show:
# PostgreSQL Database directory appears to contain a database; Skipping initdb
# PostgreSQL started...
```

**Step 3: Reset Database Connection**
```bash
cd server

# Stop all connections
npx prisma db execute --stdin <<EOF
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'task_manager'
  AND pid <> pg_backend_pid();
EOF

# Try again
npx prisma studio
```

---

### If Getting "Prisma Client not generated" Error

```bash
cd server

# Step 1: Clear Prisma cache
rm -r node_modules/.prisma

# Step 2: Reinstall @prisma/client
npm install @prisma/client --save

# Step 3: Force generate
npx prisma generate --force

# Step 4: Verify
ls -la node_modules/.prisma/client
```

---

### If Getting Connection Pool Exhausted

**Problem:** Too many Prisma clients or connections not closed

**Solution:**
```typescript
// server/src/prisma.ts

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" 
      ? ["query", "error", "warn"]
      : ["error"],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClientSingleton };

export const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**In API routes (proper cleanup):**
```typescript
app.listen(port, async () => {
  console.log(`API running at http://localhost:${port}`);
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    await prisma.$disconnect();
    process.exit(0);
  });
});
```

---

## 📋 Complete Checklist

### Before Running Prisma Studio

- [ ] PostgreSQL is running (`docker compose up -d` or `brew services start postgresql`)
- [ ] `.env` file exists in `server/` directory
- [ ] `DATABASE_URL` in `.env` has correct credentials
- [ ] `dotenv/config` imported in `server/src/prisma.ts`
- [ ] Prisma Client generated (`npx prisma generate`)
- [ ] No other Prisma instances running

### Quick Fix Script (Run in PowerShell)

```powershell
# Navigate to server directory
cd server

# 1. Stop any running services
Write-Host "Stopping services..." -ForegroundColor Yellow
docker compose -f ../docker-compose.dev.yml down 2>/dev/null

# 2. Start PostgreSQL
Write-Host "Starting PostgreSQL..." -ForegroundColor Yellow
docker compose -f ../docker-compose.dev.yml up -d db
Start-Sleep -Seconds 5

# 3. Clear Prisma cache
Write-Host "Clearing Prisma cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue

# 4. Regenerate Prisma
Write-Host "Regenerating Prisma Client..." -ForegroundColor Green
npx prisma generate

# 5. Run Prisma Studio
Write-Host "Starting Prisma Studio..." -ForegroundColor Green
npx prisma studio
```

---

## 🔐 Security Notes

### Production .env (NEVER COMMIT)

```env
# Production - Strong credentials required
DATABASE_URL="postgres://prod_user:STRONG_PASSWORD@prod.db.host:5432/task_manager"

# Use environment variables or secrets manager
JWT_SECRET=$(echo $PROD_JWT_SECRET)  # Load from secrets
CORS_ORIGIN=https://app.example.com
```

### .env.example (Share with team)

```env
# Example - Change these for your environment
DATABASE_URL="postgres://postgres:postgres@localhost:5432/task_manager"
CORS_ORIGIN=http://localhost:5173
VITE_API_URL=http://localhost:4000
JWT_SECRET=dev-secret-change-in-prod
PORT=4000
```

---

## 📚 Useful Prisma Commands

```bash
cd server

# View database schema
npx prisma db push

# View pending migrations
npx prisma migrate status

# Create a new migration
npx prisma migrate dev --name add_new_field

# Apply migrations
npx prisma migrate deploy

# Reset database (DESTRUCTIVE - loses all data)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Generate Prisma Client
npx prisma generate

# Format schema.prisma
npx prisma format

# Validate schema
npx prisma validate
```

---

## 🎯 Expected Output

**When Prisma Studio Works:**
```
Environment variables loaded from .env
Prisma Studio is running on http://localhost:5555
✔ Connected to database

Tables:
- DailyHeadcount
- User
- Project
- Task
- Comment
- Sprint
- TaskActualLog
- TaskScopeLog
- DailyReportSnapshot
- PermissionSetting

Click http://localhost:5555 in browser to open Prisma Studio
```

---

## 🆘 If All Else Fails

### Nuclear Option: Full Reset
```bash
cd server

# 1. Stop everything
docker compose -f ../docker-compose.dev.yml down

# 2. Remove volumes (DELETES DATA!)
docker compose -f ../docker-compose.dev.yml down -v

# 3. Clean node_modules
rm -Recurse -Force node_modules
rm package-lock.json

# 4. Reinstall
npm install

# 5. Start fresh
docker compose -f ../docker-compose.dev.yml up --build

# 6. Run migration
docker compose -f ../docker-compose.dev.yml run --rm api npx prisma migrate deploy

# 7. Open Prisma Studio
npx prisma studio
```

---

## 📞 Common Issues & Solutions

| Issue | Error Message | Solution |
|-------|---------------|----------|
| PostgreSQL down | P1000 Authentication failed | `docker compose up -d db` |
| Wrong credentials | P1000 Authentication failed | Check `.env` DATABASE_URL |
| Missing .env | ENOENT: no such file | Create `.env` in `server/` |
| Prisma not generated | @prisma/client not found | `npx prisma generate --force` |
| DB not created | P1002 Database does not exist | `npx prisma db push` |
| Port in use | Error: listen EADDRINUSE :::5555 | `netstat -ano \| findstr :5555` (Windows) |
| Connection pool exhausted | P2024 Exhausted connections | See pooling solution above |

---

**Last Updated:** December 4, 2025  
**Status:** ✅ Ready to Use
