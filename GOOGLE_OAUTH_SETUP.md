# Google OAuth Setup Guide

**Error:** `The OAuth client was not found. Error 401: invalid_client`

**Cause:** Google OAuth credentials not configured

**Solution:** Follow these steps to enable Google Sign-In

---

## 🔧 Step-by-Step Setup

### Step 1: Create Google Cloud Project (5 minutes)

1. **Go to Google Cloud Console**
   - URL: https://console.cloud.google.com/

2. **Create New Project**
   - Click "Select a project" (top left)
   - Click "NEW PROJECT"
   - Project name: `Accord and Harmony`
   - Click "CREATE"

3. **Wait for project creation** (~30 seconds)

---

### Step 2: Enable Google Identity API (1 minute)

1. **Navigate to APIs & Services**
   - Left menu → "APIs & Services" → "Library"

2. **Enable Google Identity**
   - Search for: "Google Identity"
   - Click "Google Identity Toolkit API" or "Google+ API"
   - Click "ENABLE"

---

### Step 3: Configure OAuth Consent Screen (3 minutes)

1. **Go to OAuth Consent Screen**
   - Left menu → "APIs & Services" → "OAuth consent screen"

2. **Choose User Type**
   - Select: **External**
   - Click "CREATE"

3. **Fill in App Information:**

   **App name:** Accord and Harmony Foundation

   **User support email:** rossen.kinov@gmail.com

   **App logo:** (optional - upload your logo)

   **Application home page:** https://accordandharmony.org

   **Application privacy policy:** https://accordandharmony.org/privacy

   **Application terms of service:** https://accordandharmony.org/terms

   **Authorized domains:**
   - Add: `accordandharmony.org`

   **Developer contact email:** rossen.kinov@gmail.com

4. **Click "SAVE AND CONTINUE"**

5. **Scopes** (Step 2)
   - Click "ADD OR REMOVE SCOPES"
   - Select:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`
   - Click "UPDATE"
   - Click "SAVE AND CONTINUE"

6. **Test Users** (Step 3)
   - Add test users (optional for development)
   - Add: `rossen.kinov@gmail.com`
   - Click "SAVE AND CONTINUE"

7. **Summary** (Step 4)
   - Review and click "BACK TO DASHBOARD"

---

### Step 4: Create OAuth 2.0 Credentials (2 minutes)

1. **Go to Credentials**
   - Left menu → "APIs & Services" → "Credentials"

2. **Create OAuth Client ID**
   - Click "CREATE CREDENTIALS"
   - Select "OAuth client ID"

3. **Application Type**
   - Select: **Web application**

4. **Configure Client:**

   **Name:** Accord and Harmony Web App

   **Authorized JavaScript origins:**
   ```
   https://accordandharmony.org
   ```

   **Authorized redirect URIs:**
   ```
   https://accordandharmony.org/auth/google/callback
   https://accordandharmony-workers.rossen-kinov.workers.dev/api/auth/google/callback
   ```

   Click "ADD URI" to add both

5. **Click "CREATE"**

6. **Copy Credentials** (IMPORTANT!)
   - A popup will show:
     - **Client ID:** `xxxxxxxxx.apps.googleusercontent.com`
     - **Client Secret:** `GOCSPX-xxxxxxxxxxxxx`
   - **SAVE THESE!** You'll need them in the next step
   - Click "DOWNLOAD JSON" (optional backup)

---

### Step 5: Configure Cloudflare Worker (2 minutes)

**Copy your credentials from Step 4, then run:**

```bash
cd "D:\Data Files\Project\web-accordandharmony\accordandharmony-fresh\workers"

# Set Google Client ID
npx wrangler secret put GOOGLE_CLIENT_ID
# Paste your Client ID when prompted (looks like: 123456789.apps.googleusercontent.com)

# Set Google Client Secret
npx wrangler secret put GOOGLE_CLIENT_SECRET
# Paste your Client Secret when prompted (looks like: GOCSPX-xxxxxxxxxxxxx)
```

---

### Step 6: Test Google Sign-In (1 minute)

1. **Go to your website:**
   - https://accordandharmony.org/resources

2. **Click "Get Book & Support Children"**

3. **Click "Continue with Google"**

4. **Should work!** ✅

---

## 🔍 Troubleshooting

### Error: "Access blocked: This app's request is invalid"
**Solution:** Check authorized redirect URIs match exactly:
```
https://accordandharmony.org/auth/google/callback
```

### Error: "redirect_uri_mismatch"
**Solution:** Add both redirect URIs in Google Console:
- Main site: `https://accordandharmony.org/auth/google/callback`
- Worker direct: `https://accordandharmony-workers.rossen-kinov.workers.dev/api/auth/google/callback`

### Error: "Access blocked: accordandharmony.org has not completed verification"
**Solution:** For testing, this is OK. For production:
1. Go to OAuth consent screen
2. Click "PUBLISH APP"
3. Submit for verification (Google review ~1 week)

### Users see warning screen
**Solution:** Normal for unverified apps. Users can click "Advanced" → "Go to [app name]" to proceed.

---

## 📋 Quick Reference

### Your OAuth Configuration

**Google Cloud Project:** Accord and Harmony

**OAuth Consent Screen:**
- User Type: External
- App name: Accord and Harmony Foundation
- Authorized domains: accordandharmony.org

**OAuth Client:**
- Type: Web application
- Name: Accord and Harmony Web App
- JavaScript origins: https://accordandharmony.org
- Redirect URIs:
  - https://accordandharmony.org/auth/google/callback
  - https://accordandharmony-workers.rossen-kinov.workers.dev/api/auth/google/callback

**Environment Variables (Cloudflare):**
- `GOOGLE_CLIENT_ID` - Your Client ID
- `GOOGLE_CLIENT_SECRET` - Your Client Secret

---

## 🎯 After Setup

**Users can:**
- ✅ Sign in with Google
- ✅ No password needed
- ✅ Fast registration
- ✅ Secure OAuth flow

**What happens:**
1. User clicks "Sign in with Google"
2. Redirected to Google login
3. User authorizes app
4. Redirected back to your site
5. User logged in automatically
6. Can make purchases

---

## 🔐 Security Notes

**DO NOT:**
- ❌ Share Client Secret publicly
- ❌ Commit credentials to Git
- ❌ Use in frontend JavaScript

**DO:**
- ✅ Keep Client Secret in Cloudflare Workers (encrypted)
- ✅ Use HTTPS only
- ✅ Validate tokens server-side

---

## 📞 Need Help?

**Google Cloud Console:** https://console.cloud.google.com/
**OAuth Documentation:** https://developers.google.com/identity/protocols/oauth2
**Cloudflare Docs:** https://developers.cloudflare.com/workers/

---

**Last Updated:** 2025-11-16
**Status:** Setup required
**Time:** ~15 minutes
