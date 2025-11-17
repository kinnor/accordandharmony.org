# User Authentication Flow Documentation

**Date:** 2025-11-17
**Status:** Configured and Ready

---

## ✅ Yes, Users Should Be Able To:

### 1. **Create an Account** (Multiple Ways)
- ✅ **Sign in with Google** - Auto-creates account on first sign-in
- ✅ **Email/Password Registration** - Manual account creation
- ⏳ **Sign in with Facebook** - Available but not configured yet

### 2. **Login to Their Account**
- ✅ **Google OAuth** - One-click sign-in
- ✅ **Email/Password** - Traditional login
- ✅ **Remember Session** - Stay logged in across page loads

### 3. **Stay Logged In**
- ✅ **JWT Access Token** - Short-lived (15 minutes)
- ✅ **JWT Refresh Token** - Long-lived (30 days)
- ✅ **Auto-refresh** - Seamlessly renew expired access tokens
- ✅ **Persistent Session** - Stored in localStorage

---

## 🔄 Complete User Flow

### **First-Time User - Google Sign-In**

```
1. User visits: https://accordandharmony.org/resources

2. User clicks: "Continue with Google"

3. Browser redirects to Google:
   https://accounts.google.com/o/oauth2/v2/auth?
     client_id=1080656509773-e0vi9gsuhgsvmdfibqn8ehvhfqptb9ig.apps.googleusercontent.com
     &redirect_uri=https://accordandharmony.org/auth/google/callback
     &response_type=code
     &scope=email profile openid
     &state=google

4. Google shows sign-in screen
   - User selects Google account
   - First time: Shows permission consent
   - Returning: Auto-approves (if previously consented)

5. Google redirects back with authorization code:
   https://accordandharmony.org/auth/google/callback?code=AUTHORIZATION_CODE

6. Frontend (callback.html):
   - Extracts authorization code from URL
   - Sends code to backend API

7. Backend (Worker) receives code:
   POST /api/auth/google
   Body: { "code": "AUTHORIZATION_CODE" }

8. Worker exchanges code with Google:
   POST https://oauth2.googleapis.com/token
   Body: {
     "code": "AUTHORIZATION_CODE",
     "client_id": "YOUR_CLIENT_ID",
     "client_secret": "YOUR_CLIENT_SECRET",
     "redirect_uri": "https://accordandharmony.org/auth/google/callback",
     "grant_type": "authorization_code"
   }

9. Google returns tokens:
   {
     "access_token": "ya29.xxx",
     "refresh_token": "1//xxx",
     "expires_in": 3599,
     "token_type": "Bearer"
   }

10. Worker gets user info from Google:
    GET https://www.googleapis.com/oauth2/v2/userinfo
    Headers: { "Authorization": "Bearer ya29.xxx" }

11. Google returns user data:
    {
      "id": "12345678901234567890",
      "email": "user@gmail.com",
      "name": "John Doe",
      "picture": "https://lh3.googleusercontent.com/..."
    }

12. Worker checks if user exists in database:
    - NEW USER: Creates new user record
    - EXISTING USER: Finds existing user

13. Worker generates JWT tokens:
    - Access Token (15-minute expiry)
    - Refresh Token (30-day expiry)

14. Worker stores session in database:
    - user_id
    - refresh_token
    - access_token_hash
    - device_info
    - ip_address

15. Worker returns to frontend:
    {
      "success": true,
      "data": {
        "user": { "id": 123, "email": "...", "full_name": "..." },
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "isNewUser": true
      }
    }

16. Frontend stores auth data:
    localStorage.setItem('auth', JSON.stringify({
      user: userData,
      accessToken: "...",
      refreshToken: "..."
    }))

17. Frontend redirects to resources page:
    window.location.href = '/resources.html'

18. User is now LOGGED IN! ✅
```

---

## 🔑 Session Management

### **How Users Stay Logged In**

**On Page Load:**
```javascript
// 1. Check localStorage for auth data
const authData = localStorage.getItem('auth');

// 2. If found, user is logged in
if (authData) {
  const { user, accessToken, refreshToken } = JSON.parse(authData);
  currentUser = user;
  // Show logged-in UI
}
```

**On API Requests:**
```javascript
// 1. Send access token with request
fetch('/api/protected-endpoint', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
})

// 2. If token expired (401 response):
//    - Use refresh token to get new access token
//    - Retry original request
```

**Token Expiry:**
- **Access Token:** Expires after 15 minutes
- **Refresh Token:** Expires after 30 days
- **Auto-refresh:** Frontend automatically renews access token using refresh token
- **Session ends:** When refresh token expires or user logs out

---

## 🛡️ Security Features

### **What's Protected:**

1. **Client Secret** ✅
   - Stored encrypted in Cloudflare Workers
   - Never exposed to frontend
   - Never sent to browser

2. **JWT Secret** ✅
   - Used to sign/verify tokens
   - Stored encrypted in Cloudflare Workers
   - Different from Google Client Secret

3. **Refresh Tokens** ✅
   - Stored in database with user_id
   - One-time use (revoked after use)
   - Can be revoked manually (logout)

4. **Access Tokens** ✅
   - Short-lived (15 minutes)
   - Hashed before storing in database
   - Verified on every request

### **What's Public (Safe):**

1. **Google Client ID** ✅
   - Designed to be public by Google
   - Visible in frontend code
   - Used to initiate OAuth flow
   - Cannot be used maliciously

---

## 📝 Database Schema

### **users Table:**
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,              -- NULL for OAuth users
  full_name TEXT NOT NULL,
  profile_picture TEXT,
  email_verified INTEGER DEFAULT 0,
  oauth_provider TEXT,             -- 'google', 'facebook', NULL
  oauth_provider_id TEXT,          -- Google ID, Facebook ID
  created_at INTEGER NOT NULL,
  last_login INTEGER,
  is_active INTEGER DEFAULT 1
);
```

### **sessions Table:**
```sql
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  refresh_token TEXT UNIQUE NOT NULL,
  access_token_hash TEXT NOT NULL,
  device_info TEXT,
  ip_address TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🎯 User Actions

### **Sign In with Google:**
```
1. Click "Continue with Google"
2. Redirected to Google
3. Select account
4. Approve permissions (first time only)
5. Redirected back
6. Logged in! ✅
```

### **Register with Email/Password:**
```
1. Click "Create Account"
2. Fill in: Name, Email, Password
3. Click "Sign Up"
4. Account created
5. Auto-logged in
6. Welcome email sent
```

### **Login with Email/Password:**
```
1. Click "Sign In"
2. Enter: Email, Password
3. Click "Login"
4. Logged in! ✅
```

### **Stay Logged In:**
```
- User closes browser → Still logged in
- User returns next day → Still logged in
- User returns 30 days later → Still logged in
- After 30 days → Must sign in again
```

### **Logout:**
```
1. Click "Logout"
2. Frontend clears localStorage
3. Backend revokes refresh token
4. User logged out
5. Redirected to home page
```

---

## 🧪 Testing Flow

### **Test Google Sign-In:**

**Try it now:**
1. Go to: https://accordandharmony.org/resources
2. Click: "Continue with Google"
3. Sign in with: rossen.kinov@gmail.com (or any Google account)
4. You should be logged in!

**Check if logged in:**
1. Open browser DevTools (F12)
2. Go to: Application → Local Storage → https://accordandharmony.org
3. Look for key: `auth`
4. You should see: User data + tokens

**Verify session:**
```javascript
// In browser console:
console.log(localStorage.getItem('auth'));
```

Should show:
```json
{
  "user": {
    "id": 123,
    "email": "rossen.kinov@gmail.com",
    "full_name": "Rossen Kinov",
    "profile_picture": "https://lh3.googleusercontent.com/..."
  },
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci..."
}
```

---

## 🔧 Troubleshooting

### **Error: "OAuth client was not found"**

**Cause:** Google Client ID not configured or mismatched

**Fix:**
1. Check config.js has correct Client ID
2. Verify secrets in worker: `npx wrangler secret list`
3. Redeploy worker: `npx wrangler deploy`

### **Error: "Failed to exchange authorization code"**

**Cause:** Redirect URI mismatch

**Fix:**
1. Check Google Console redirect URIs match exactly:
   - `https://accordandharmony.org/auth/google/callback`
2. Check config.js redirect URI matches
3. Check worker FRONTEND_URL environment variable

### **Error: "Authentication failed"**

**Cause:** Generic error - check worker logs

**Fix:**
```bash
cd workers
npx wrangler tail --format=pretty
```

Look for detailed error messages (now with improved logging).

---

## 📊 Current Status

**Backend:**
- ✅ Google OAuth configured
- ✅ Worker secrets set (CLIENT_ID, CLIENT_SECRET)
- ✅ Worker deployed (v: de8f6b37)
- ✅ Improved error logging

**Frontend:**
- ✅ config.js with Client ID
- ✅ auth-client.js handles OAuth flow
- ✅ callback.html processes OAuth redirect
- ✅ localStorage stores session

**Database:**
- ✅ Users table ready
- ✅ Sessions table ready
- ✅ OAuth user creation working

**Ready to Test:**
- ✅ Try signing in with Google now!
- ✅ Check logs if any errors occur

---

## 🎉 What Should Work Now

1. ✅ Click "Sign in with Google"
2. ✅ Google authentication
3. ✅ Redirect back to site
4. ✅ User account created (if new)
5. ✅ User logged in
6. ✅ Session persisted
7. ✅ Can make book purchases
8. ✅ Receive emails
9. ✅ Download PDFs

**The complete flow is configured and ready!**

**Now with improved error logging - if anything fails, detailed errors will appear in logs.**

---

**Last Updated:** 2025-11-17
**Worker Version:** de8f6b37-136c-4137-a197-b0239984d65b
**Status:** Ready to test with detailed error logging
