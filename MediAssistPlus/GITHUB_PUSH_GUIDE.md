# GitHub Push Guide for MediAssist+

## Quick Commands (Copy & Paste)

```bash
# 1. Check current status
git status

# 2. Add all changes
git add .

# 3. Commit with message
git commit -m "Updated backend configuration and deployment setup"

# 4. Push to GitHub
git push origin main
```

## Detailed Step-by-Step

### Step 1: Check What's Changed
```bash
cd C:\Users\chand\MediAssistPlus
git status
```
This shows all modified, new, and deleted files.

### Step 2: Add Files to Staging
```bash
# Add all changes
git add .

# OR add specific files
git add backend/railway.json
git add RAILWAY_DEPLOYMENT_GUIDE.md
```

### Step 3: Commit Changes
```bash
git commit -m "Add Railway deployment configuration and guides"
```

**Good commit messages:**
- "Add Railway deployment configuration"
- "Fix S3 upload with time skew handling"
- "Update backend for production deployment"
- "Add multi-language transcription support"

### Step 4: Push to GitHub
```bash
# If remote is already set
git push origin main

# If it's your first push
git push -u origin main
```

## If Remote Is Not Set

If you get an error about no remote, set it up:

```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/Chandru2600/MediAssistPlus.git

# Verify it's added
git remote -v

# Push with upstream
git push -u origin main
```

## Common Issues & Solutions

### Issue 1: "Updates were rejected"
This means GitHub has changes you don't have locally.

**Solution:**
```bash
# Pull changes first
git pull origin main --rebase

# Then push
git push origin main
```

### Issue 2: "Authentication failed"
You need to use a Personal Access Token (not password).

**Solution:**
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Select scopes: `repo` (all)
4. Copy the token
5. Use token as password when pushing

### Issue 3: Merge conflicts
If files conflict during pull:

```bash
# See conflicted files
git status

# Edit files to resolve conflicts
# Look for <<<<<<< HEAD markers

# After fixing
git add .
git commit -m "Resolve merge conflicts"
git push origin main
```

## Ignore Sensitive Files

Make sure `.env` files are NOT pushed (they should already be in `.gitignore`):

```bash
# Check .gitignore includes
cat .gitignore | grep .env

# Should show:
# .env
# backend/.env
```

## Verify Push Success

After pushing:
1. Go to https://github.com/Chandru2600/MediAssistPlus
2. Refresh the page
3. You should see your latest commit
4. Check the commit time matches

## Branch Management (Optional)

If you want to work on a feature branch:

```bash
# Create and switch to new branch
git checkout -b feature/railway-deployment

# Make changes, commit
git add .
git commit -m "Add Railway deployment"

# Push branch
git push origin feature/railway-deployment

# Create Pull Request on GitHub
# Merge when ready
```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `git status` | See what's changed |
| `git add .` | Stage all changes |
| `git commit -m "message"` | Save changes locally |
| `git push` | Upload to GitHub |
| `git pull` | Download from GitHub |
| `git log` | See commit history |

## For Railway Deployment

After pushing to GitHub:
1. Railway will detect the new commit
2. It will automatically redeploy
3. Or you can manually trigger deployment in Railway dashboard

---

**Your Repository**: https://github.com/Chandru2600/MediAssistPlus

**Need Help?**
- GitHub Docs: https://docs.github.com/
- Git Cheat Sheet: https://education.github.com/git-cheat-sheet-education.pdf
