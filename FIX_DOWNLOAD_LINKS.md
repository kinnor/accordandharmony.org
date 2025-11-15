# Fix for Broken Download Links in Emails

## Problem Summary

When users click the "Download Now" button in purchase confirmation emails, they get a broken page showing fragments of the website instead of downloading the PDF.

## Root Cause

The email system generates download links like:
```
https://accordandharmony.org/api/download?token=XXXXX
```

However, the Cloudflare Worker that handles `/api/download` requests is deployed at:
```
https://accordandharmony-workers.rossen-kinov.workers.dev
```

The main website (https://accordandharmony.org) doesn't have any routing configuration to forward `/api/*` requests to the Cloudflare Worker, so these requests hit the static website and return a 404 or broken page.

## Immediate Fix Applied ✅

**File modified**: `workers/src/email-service.js`

Changed the download URL generation to use the worker URL directly:

```javascript
// Use worker URL directly if FRONTEND_URL routes are not configured
const workerUrl = env.FRONTEND_URL && env.FRONTEND_URL.includes('workers.dev')
  ? env.FRONTEND_URL
  : 'https://accordandharmony-workers.rossen-kinov.workers.dev';

const downloadUrl = downloadToken
  ? `${workerUrl}/api/download?token=${downloadToken}`
  : null;
```

**Result**: Download links in emails will now work immediately by pointing to the worker URL directly.

## Configuration Changes Made ✅

1. **Fixed wrangler.toml** (workers/wrangler.toml):
   - Replaced deprecated `node_compat = true` with `compatibility_flags = ["nodejs_compat"]`
   - Added routing configuration for production:
     ```toml
     routes = [
       { pattern = "accordandharmony.org/api/*", zone_name = "accordandharmony.org" }
     ]
     ```

## Deployment Instructions

To deploy these fixes, you need to:

### 1. Deploy the Worker with Updated Code

```bash
cd /home/user/accordandharmony.org
npx wrangler deploy
```

If you haven't authenticated wrangler yet:
```bash
npx wrangler login
```

This will:
- Deploy the updated email service code
- Configure routing so `accordandharmony.org/api/*` routes to the worker
- Fix the download links

### 2. Verify FRONTEND_URL Environment Variable

Check if FRONTEND_URL is set:
```bash
npx wrangler secret list
```

If not set or incorrect, update it:
```bash
npx wrangler secret put FRONTEND_URL
# When prompted, enter: https://accordandharmony.org
```

### 3. Test the Fix

After deployment, test by:

1. **Send a test email**:
   ```bash
   cd /home/user/accordandharmony.org
   open test-email.html
   ```

2. **Select "Book Purchase (Test)"** and send to your email

3. **Click the download link** in the email - it should now work!

## Long-term Solution (Recommended)

Once the Cloudflare routes are properly configured, the download links will use the main domain (`https://accordandharmony.org/api/download`) which provides a better user experience.

The routing configuration in `wrangler.toml` will automatically set this up when you deploy:

```toml
routes = [
  { pattern = "accordandharmony.org/api/*", zone_name = "accordandharmony.org" }
]
```

After deployment, you can verify the route is active:
1. Go to Cloudflare Dashboard
2. Navigate to: **Workers & Pages** → **accordandharmony-workers** → **Settings** → **Triggers**
3. You should see the route: `accordandharmony.org/api/*`

## Verification Checklist

- [x] Fixed `wrangler.toml` compatibility issue
- [x] Added routing configuration
- [x] Updated email service to use worker URL
- [ ] Deploy worker with `npx wrangler deploy`
- [ ] Verify FRONTEND_URL secret is set
- [ ] Send test email and verify download works
- [ ] Verify route appears in Cloudflare dashboard

## Files Modified

1. `workers/wrangler.toml` - Fixed node_compat deprecation, added routes
2. `workers/src/email-service.js` - Updated download URL generation

## Additional Notes

- The immediate fix ensures downloads work right away using the worker subdomain
- Once routes are configured, you can remove the workaround logic and use `env.FRONTEND_URL` directly
- All download links are token-protected and expire after 24 hours
- Downloads are limited to 5 per purchase for security

## Support

If downloads still don't work after deployment:
1. Check worker logs: `npx wrangler tail`
2. Verify the download token is valid in the database
3. Ensure FRONTEND_URL environment variable is set correctly
4. Check that routes are active in Cloudflare dashboard
