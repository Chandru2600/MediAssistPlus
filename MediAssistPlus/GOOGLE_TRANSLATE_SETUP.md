# Google Cloud Translation API Setup Guide

## Step 1: Get Your Google Cloud API Key

### 1.1 Create Google Cloud Account
1. Go to https://console.cloud.google.com
2. Sign in with your Google account
3. Accept terms and conditions
4. **You get $300 free credit for 90 days!**

### 1.2 Create a New Project
1. Click the project dropdown at the top
2. Click "New Project"
3. Name: `MediAssist`
4. Click "Create"
5. Wait for project creation (10-20 seconds)

### 1.3 Enable Cloud Translation API
1. Go to "APIs & Services" → "Library" (from left menu)
2. Search for: `Cloud Translation API`
3. Click on "Cloud Translation API"
4. Click "Enable"
5. Wait for activation (5-10 seconds)

### 1.4 Create API Key
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. **Copy the API key** (looks like: `AIzaSyC...`)
4. Click "Edit API key" to restrict it:
   - Under "API restrictions", select "Restrict key"
   - Choose "Cloud Translation API"
   - Click "Save"

---

## Step 2: Add API Key to Your Backend

1. Open `backend/.env` file
2. Find line 13 (Google Cloud API key)
3. Replace the placeholder with your actual key:
   ```
   GOOGLE_CLOUD_API_KEY="AIzaSyC_your_actual_key_here"
   ```
4. Save the file

---

## Step 3: Restart Backend

```bash
# Stop the current backend (Ctrl+C in the terminal)
# Then restart:
cd c:\Users\chand\MediAssistPlus\backend
npm run dev
```

---

## Step 4: Test Google Translation

### Option A: Test Script (Quick)

Run this test script:
```bash
cd c:\Users\chand\MediAssistPlus\backend
node test_production_setup.js
```

Expected output:
```
✅ Google Cloud API Key: Set
✅ Google Translation working!
   Kannada: [accurate Kannada text]
   Hindi: [accurate Hindi text]
```

### Option B: Test in Mobile App (Full Test)

1. **Restart Expo:**
   ```bash
   cd c:\Users\chand\MediAssistPlus
   npm start
   ```

2. **Reload app** on your phone

3. **Test translation:**
   - Open any patient with recordings
   - Tap "View Transcript"
   - Switch to **Kannada** tab
   - Wait 20-30 seconds
   - **Check if Kannada is accurate!**
   - Switch to **Hindi** tab
   - **Check if Hindi is accurate!**

---

## Step 5: Verify Translation Quality

### What to Check:
- ✅ **Kannada uses proper script** (ಕನ್ನಡ), not transliterated English
- ✅ **Simple, everyday words** (like "ತಲೆನೋವು" for headache)
- ✅ **Short, clear sentences**
- ✅ **Natural, spoken language**
- ✅ **Medical terms explained simply**

### If Translation is Still Not Good:
The Google Cloud Translation API should be much better than Ollama. If you still see issues:
1. Share an example of what you're getting vs. what you expect
2. I can adjust the translation prompt further

---

## Troubleshooting

### "Google Translation failed" Error?

**Check 1: API Key is Correct**
- Make sure you copied the full key (starts with `AIzaSy`)
- No extra spaces or quotes

**Check 2: API is Enabled**
- Go to Google Cloud Console
- "APIs & Services" → "Enabled APIs"
- Verify "Cloud Translation API" is listed

**Check 3: Billing is Enabled**
- Go to "Billing" in Google Cloud Console
- Make sure billing is enabled (free tier is fine)

**Check 4: Backend Logs**
```bash
# Check backend terminal for errors
# Look for lines like:
[Google Translate] Error: ...
```

### Translation Takes Too Long?

- Google Translation is usually fast (2-5 seconds)
- If it takes longer, check your internet connection
- The app has a 60-second timeout, so it should work

### Still Using Ollama Instead of Google?

Check backend logs:
```
[Translation] Using Google Cloud Translation for Kannada  ✅ Good!
[Translation] Google Cloud API key not configured         ❌ Bad - check .env
```

---

## Cost Information

### Free Tier
- **First 500,000 characters/month:** FREE
- **Typical usage:** ~50,000 characters/month for small clinic
- **You're well within free tier!**

### After Free Tier
- **$20 per 1 million characters**
- For typical usage: ~$1-2/month

### Monitor Usage
1. Go to Google Cloud Console
2. "APIs & Services" → "Dashboard"
3. Click "Cloud Translation API"
4. View usage graphs

---

## Summary

**What you need:**
1. ✅ Google Cloud account (free)
2. ✅ Cloud Translation API enabled
3. ✅ API key created and restricted
4. ✅ API key added to `backend/.env`
5. ✅ Backend restarted

**Then test:**
- Run test script OR
- Test in mobile app

**Result:**
- Accurate, natural Kannada translations! 🎉
- Accurate, natural Hindi translations! 🎉

---

**Ready to get your API key?** Follow Step 1 above and let me know when you have it!
