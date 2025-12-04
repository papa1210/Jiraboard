# 🔧 Fix: "Cannot rewrite branches: You have unstaged changes"

**Error:** `Cannot rewrite branches: You have unstaged changes`  
**Cause:** Có files thay đổi nhưng chưa commit  
**Date:** December 4, 2025

---

## ⚡ Quick Fix (Copy & Paste)

### **Windows PowerShell**

```powershell
# Check what changed
git status

# Option 1: Keep changes (RECOMMENDED)
git add .
git commit -m "Work in progress"

# Option 2: Discard changes (DANGER - LOSES DATA)
git reset --hard HEAD

# Then try your command again
git rebase ...  # hoặc whatever command failed
```

### **macOS / Linux**

```bash
# Check what changed
git status

# Option 1: Keep changes (RECOMMENDED)
git add .
git commit -m "Work in progress"

# Option 2: Discard changes (DANGER - LOSES DATA)
git reset --hard HEAD

# Then try again
git rebase ...
```

---

## 📋 Hiểu Chi Tiết

### **Git States:**

```
Working Directory (Local changes)
        ↓
    git add .
        ↓
Staging Area (Staged changes)
        ↓
    git commit -m "message"
        ↓
Repository (Committed)
```

**Error xảy ra ở:** Working Directory có changes nhưng chưa commit

---

## 🎯 Step-by-Step Fix

### **Step 1: Check Status**

```bash
git status

# Output:
# On branch main
# Changes not staged for commit:
#   (use "git add <file>..." to update what will be committed)
#   (use "git restore <file>..." to discard changes in working directory)
#
#   modified:   server/.env
#   modified:   .gitignore
#   new file:   WHY_NO_ENV_COMMIT.md
```

**Meaning:** 3 files thay đổi, chưa commit

---

### **Step 2: Choose Option**

#### **Option A: KEEP Changes (Recommended)**

```bash
# Stage all changes
git add .

# Commit
git commit -m "Update .env, .gitignore, and add security docs"

# Output:
# [main abc1234] Update .env, .gitignore, and add security docs
#  3 files changed, 50 insertions(+), 10 deletions(-)

# Now try original command
git rebase ...  # or whatever failed before
```

---

#### **Option B: DISCARD Changes (DANGER)**

⚠️ **WARNING: This deletes all unsaved changes!**

```bash
# ❌ ONLY if you're sure you want to LOSE changes
git reset --hard HEAD

# Output:
# HEAD is now at abc1234 Previous commit message
# ✅ All changes discarded

# Then try again
git rebase ...
```

---

### **Step 3: View Differences (Optional)**

```bash
# See what exactly changed
git diff

# See what would be committed
git diff --staged

# See summary
git diff --stat
```

---

## 📊 Common Scenarios

### **Scenario 1: Just Modified Some Files**

```bash
git status
# modified:   server/.env
# modified:   client/src/App.tsx

# Fix:
git add .
git commit -m "Update .env and App component"
```

---

### **Scenario 2: Accidentally Modified (Don't Want)**

```bash
git status
# modified:   server/.env  ← Don't want this

# Option 1: Discard specific file
git restore server/.env

# Option 2: Discard all
git reset --hard HEAD
```

---

### **Scenario 3: New Files (Untracked)**

```bash
git status
# Untracked files:
#   WHY_NO_ENV_COMMIT.md
#   ENV_LOCAL_VS_INTERNET.md

# Add and commit
git add .
git commit -m "Add security documentation"
```

---

## 🔄 If Error Still Occurs

### **Full Clean Up:**

```bash
# 1. See what's changed
git status

# 2. Add everything
git add .

# 3. Commit
git commit -m "Checkpoint: work in progress"

# 4. Check log
git log --oneline | head -5

# 5. Try command again
git pull origin main
git rebase origin/main
# or whatever command had error
```

---

## 💾 Stash Changes (Advanced)

**If want to save changes but apply later:**

```bash
# Save changes temporarily
git stash

# Now you can rebase/pull without conflicts
git rebase origin/main

# Apply saved changes back
git stash pop
```

---

## 🚨 Prevent Future Errors

### **Before Any Git Command:**

```bash
# Always check status first
git status

# Make sure:
# ✅ No "Changes not staged for commit"
# ✅ No "Untracked files"

# If have changes:
git add .
git commit -m "Your message"

# Then proceed with rebase/push/etc
```

---

## 📋 Git Workflow (Correct Order)

```
1. Make changes to files
         ↓
2. Review: git status
         ↓
3. Stage: git add .
         ↓
4. Commit: git commit -m "message"
         ↓
5. Push: git push origin main
         ↓
✅ Clean working directory
```

---

## 🎯 Your Specific Situation

Based on error, you probably:

```bash
# 1. Made changes to files (e.g., .env, .gitignore)
# 2. Tried to run a git command like:
git rebase ...
git pull ...
git merge ...

# 3. Git said: "Can't do that, you have unsaved changes"

# Fix:
git add .
git commit -m "Checkpoint: save current work"

# Then try again
git pull origin main
```

---

## ✅ Complete Fix for You

```powershell
cd "c:\Users\Huu Tung\Downloads\jira-clone---task-manager"

# 1. Check what changed
git status

# 2. Stage all changes
git add .

# 3. Commit
git commit -m "Update configuration and documentation"

# 4. Push to GitHub (if want)
git push origin main

# 5. Verify
git status
# Output should show: "nothing to commit, working tree clean"
```

---

## 📚 Related Git Commands

```bash
# Check status
git status

# See differences
git diff

# Stage all changes
git add .

# Stage specific file
git add path/to/file

# Commit
git commit -m "message"

# Unstage (before commit)
git reset HEAD file.txt

# Discard changes in file
git restore file.txt

# View commit history
git log --oneline

# View branches
git branch -a
```

---

**Last Updated:** December 4, 2025  
**Urgency:** Low (just need to commit your changes)  
**Time to Fix:** < 1 minute
