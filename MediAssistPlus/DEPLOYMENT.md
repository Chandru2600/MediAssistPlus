# MediAssist+ Production Deployment Guide

## Overview
This guide will help you deploy MediAssist+ to production with accurate Kannada/Hindi translations and cloud hosting.

---

## Part 1: Google Cloud Translation API Setup

### Step 1: Create Google Cloud Account
1. Go to https://console.cloud.google.com
2. Sign in with your Google account
3. You'll get **$300 free credit** for 90 days!

### Step 2: Create a New Project
1. Click "Select a project" → "New Project"
2. Name it "MediAssist" or similar
3. Click "Create"

### Step 3: Enable Cloud Translation API
1. Go to "APIs & Services" → "Library"
2. Search for "Cloud Translation API"
3. Click on it and press "Enable"

### Step 4: Create API Key
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the API key (looks like: `AIzaSyC...`)
4. **IMPORTANT:** Restrict the key:
   - Click "Edit API key"
   - Under "API restrictions", select "Restrict key"
   - Choose "Cloud Translation API"
   - Save

### Step 5: Add API Key to Backend
1. Open `backend/.env`
2. Add this line:
   ```
   GOOGLE_CLOUD_API_KEY="AIzaSyC..."
   ```
   (Replace with your actual key)
3. Restart the backend server

### Step 6: Test Translation
Run this test script:
```bash
cd backend
node -e "
const { translateWithGoogle } = require('./src/services/google-translate.service.ts');
translateWithGoogle('Hello, how are you?', 'Kannada')
  .then(result => console.log('Kannada:', result))
  .catch(err => console.error('Error:', err));
"
```

---

## Part 2: Cloud Deployment (Railway - Recommended)

### Why Railway?
- ✅ Best free tier
- ✅ PostgreSQL included
- ✅ Easy deployment
- ✅ Automatic HTTPS

### Step 1: Prepare Your Code
1. Make sure all changes are committed to Git:
   ```bash
   git add .
   git commit -m "Production ready with Google Translate"
   ```

2. Push to GitHub (if not already):
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/MediAssistPlus.git
   git push -u origin main
   ```

### Step 2: Deploy to Railway
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your MediAssistPlus repository
5. Railway will auto-detect it's a Node.js app

### Step 3: Add PostgreSQL Database
1. In your Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will create a database and set `DATABASE_URL` automatically

### Step 4: Set Environment Variables
1. Go to your backend service → "Variables"
2. Add these variables:
   ```
   JWT_SECRET=your-super-secret-jwt-key-change-this
   OLLAMA_URL=http://100.81.92.33:11434
   GOOGLE_CLOUD_API_KEY=AIzaSyC...
   PORT=5000
   ```

### Step 5: Deploy
1. Railway will automatically deploy
2. Wait for deployment to complete
3. Copy your deployment URL (e.g., `https://mediassist-production.up.railway.app`)

### Step 6: Run Database Migrations
1. In Railway, go to your backend service
2. Click "Settings" → "Deploy Triggers"
3. Add a deploy command:
   ```bash
   npx prisma migrate deploy && npx prisma generate && npm start
   ```

---

## Part 3: Update Mobile App for Production

### Step 1: Update API URL
1. Open `app.json`
2. Update the `apiUrl`:
   ```json
   "extra": {
     "apiUrl": "https://your-railway-app.up.railway.app/api"
   }
   ```

### Step 2: Build APK
```bash
# For Android
eas build --platform android --profile production

# Or local build
npx expo export:android
```

### Step 3: Test APK
1. Install APK on a test device
2. Test all features:
   - ✅ Patient management
   - ✅ Recording audio
   - ✅ Transcription
   - ✅ **Kannada translation** (should be accurate now!)
   - ✅ **Hindi translation** (should be accurate now!)
   - ✅ Audio playback

---

## Part 4: Alternative Hosting Options

### Option 2: Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create mediassist-backend

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set GOOGLE_CLOUD_API_KEY=AIzaSyC...
heroku config:set JWT_SECRET=your-secret
heroku config:set OLLAMA_URL=http://100.81.92.33:11434

# Deploy
git push heroku main
```

### Option 3: Render
1. Go to https://render.com
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Connect your repository
5. Add environment variables
6. Deploy

---

## Pricing Estimates

### Google Cloud Translation API
- **Free tier:** First 500,000 characters/month
- **After free tier:** $20 per 1 million characters
- **Typical usage:** ~$5-10/month for small clinic

### Railway
- **Free tier:** $5 credit/month
- **After free tier:** Pay as you go (~$5-10/month for small app)

### Total Monthly Cost: ~$10-20/month

---

## Troubleshooting

### Translation not working?
1. Check if `GOOGLE_CLOUD_API_KEY` is set correctly
2. Check backend logs for errors
3. Verify API is enabled in Google Cloud Console

### APK not connecting?
1. Make sure Railway URL is correct in `app.json`
2. Rebuild the APK after changing URL
3. Check if backend is running on Railway

### Database errors?
1. Run migrations: `npx prisma migrate deploy`
2. Generate Prisma client: `npx prisma generate`
3. Check `DATABASE_URL` is set correctly

---

## Next Steps

1. ✅ Set up Google Cloud Translation API
2. ✅ Deploy backend to Railway
3. ✅ Update mobile app with production URL
4. ✅ Build and test APK
5. ✅ Distribute to users!

**Your app is now production-ready with accurate Kannada and Hindi translations!** 🎉
