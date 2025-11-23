# Network Access Solutions for MediAssist+

## Problem
Localtunnel keeps disconnecting with 503 errors because it's a free service that's unreliable.

## Solutions (Choose One)

### Option 1: Local Network IP (RECOMMENDED for development)
**Best for:** Testing on the same WiFi network
**Stability:** ⭐⭐⭐⭐⭐ (Very stable)
**Cost:** Free

1. Find your computer's IP address:
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., 192.168.1.100)

2. Update `app.json`:
   ```json
   "apiUrl": "http://YOUR_IP:5000/api"
   ```

3. Make sure Windows Firewall allows port 5000:
   ```powershell
   netsh advfirewall firewall add rule name="Allow Node Port 5000" dir=in action=allow protocol=TCP localport=5000
   ```
   (Run as Administrator)

**Pros:** Very stable, no disconnections
**Cons:** Only works on same WiFi network

---

### Option 2: ngrok (RECOMMENDED for external access)
**Best for:** Testing from anywhere (different networks)
**Stability:** ⭐⭐⭐⭐⭐ (Very stable)
**Cost:** Free tier available (with limits)

1. Install ngrok:
   ```powershell
   choco install ngrok
   ```
   Or download from: https://ngrok.com/download

2. Sign up for free account at https://ngrok.com/signup

3. Authenticate:
   ```powershell
   ngrok config add-authtoken YOUR_TOKEN
   ```

4. Start ngrok:
   ```powershell
   ngrok http 5000
   ```

5. Use the HTTPS URL in `app.json`

**Pros:** Very stable, works from anywhere, HTTPS by default
**Cons:** Free tier has session limits (8 hours)

---

### Option 3: Keep localtunnel running automatically
**Best for:** Quick testing
**Stability:** ⭐⭐ (Still unstable)
**Cost:** Free

Create a script that auto-restarts localtunnel when it fails.

**Not recommended** - still has frequent disconnections.

---

## Recommendation

For **development/testing on same network**: Use Option 1 (Local IP)
For **testing from different networks**: Use Option 2 (ngrok)

Both are much more stable than localtunnel and won't give you 503 errors repeatedly.
