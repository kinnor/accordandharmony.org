# Cloudflare Setup Guide for Book Purchase System

This guide walks you through setting up the complete payment and book delivery system.

## Overview

The system uses:
- **Cloudflare Pages** for hosting the static website
- **Cloudflare Workers** for API endpoints (authentication, payments, email)
- **Cloudflare D1** for database (already configured)
- **Cloudflare R2** for PDF storage and watermarking
- **Resend** for email delivery

---

## Step 1: Enable R2 Object Storage

### In Cloudflare Dashboard:

1. **Navigate to R2**
   - Go to https://dash.cloudflare.com/
   - Click **R2 Object Storage** in the left sidebar

2. **Enable R2**
   - Click **Get Started** or **Enable R2**
   - Accept terms and conditions
   - Add payment method (required even for free tier)
   - **Free tier**: 10GB storage, 1M Class A operations/month

3. **Create Bucket**
   - Click **Create bucket**
   - Bucket name: `accordharmony-files`
   - Location: **Automatic** (recommended)
   - Click **Create bucket**

### Verify R2 is Ready:

```bash
cd workers
npx wrangler r2 bucket list
```

You should see `accordharmony-files` in the list.

---

## Step 2: Upload Master PDF to R2

### Option A: Using the automated script (Windows):

```bash
cd workers
upload-master-pdf.bat
```

### Option B: Manual command:

```bash
cd workers
npx wrangler r2 object put accordharmony-files/books/master/JAZZ_TRUMPET_MASTER_CLASS.pdf --file="../downloads/books/JAZZ_TRUMPET_MASTER_CLASS.pdf" --content-type="application/pdf"
```

### Verify Upload:

```bash
npx wrangler r2 object list accordharmony-files --prefix=books/master/
```

You should see `JAZZ_TRUMPET_MASTER_CLASS.pdf` in the list.

---

## Step 3: Configure Environment Variables

### In Cloudflare Dashboard:

1. **Navigate to Workers**
   - Dashboard → Workers & Pages
   - Click on `accordandharmony-workers`
   - Go to **Settings** → **Variables**

2. **Add Required Secrets** (click "Add variable" for each):

   **Email Service (Resend):**
   ```
   RESEND_API_KEY = re_xxxxxxxxxxxxxxxxxxxxx
   ```
   - Get API key from: https://resend.com/api-keys
   - Make sure to encrypt as "Secret"

   **JWT Authentication:**
   ```
   JWT_SECRET = [generate a random 32+ character string]
   ```
   - Generate with: `openssl rand -base64 32`
   - Or use: https://randomkeygen.com/
   - Encrypt as "Secret"

   **Frontend URL (CORS):**
   ```
   FRONTEND_URL = https://accordandharmony.org
   ```
   - Leave as plain text (not secret)

   **Optional - Stripe (if using Stripe instead of PayPal):**
   ```
   STRIPE_SECRET_KEY = sk_live_xxxxxxxxxxxxxxxxxxxxx
   STRIPE_WEBHOOK_SECRET = whsec_xxxxxxxxxxxxxxxxxxxxx
   ```

   **Optional - OAuth (if using social login):**
   ```
   GOOGLE_CLIENT_ID = xxxxxxxxxxxxxxxxxxxxx
   GOOGLE_CLIENT_SECRET = xxxxxxxxxxxxxxxxxxxxx
   FACEBOOK_APP_ID = xxxxxxxxxxxxxxxxxxxxx
   FACEBOOK_APP_SECRET = xxxxxxxxxxxxxxxxxxxxx
   ```

3. **Save and Deploy**
   - Click **Save and deploy** after adding all variables

---

## Step 4: Connect Worker to Pages Project

There are two approaches:

### Approach A: Using Service Binding (Recommended)

1. **Navigate to Pages Project**
   - Dashboard → Pages
   - Click `accordandharmony.org`
   - Go to **Settings** → **Functions**

2. **Add Service Binding**
   - Scroll to **Service bindings**
   - Click **Add binding**
   - Variable name: `API`
   - Service: `accordandharmony-workers`
   - Environment: `production`
   - Click **Save**

3. **Create _worker.js** (Claude will create this file)

### Approach B: Using Custom Routes

1. **Navigate to Website Settings**
   - Dashboard → Websites
   - Click `accordandharmony.org`
   - Go to **Rules** → **Page Rules** (or **Transform Rules**)

2. **Add Route for API**
   - Pattern: `accordandharmony.org/api/*`
   - Action: Forward URL to Worker
   - Worker: `accordandharmony-workers`
   - Click **Save**

---

## Step 5: Deploy Worker with Updated Configuration

```bash
cd workers
npx wrangler deploy
```

Expected output:
```
✨ Successfully deployed!
🌎 https://accordandharmony-workers.[your-subdomain].workers.dev
```

---

## Step 6: Test API Endpoints

### Test 1: Health Check
```bash
curl https://accordandharmony.org/api/csrf-token
```

Expected response:
```json
{
  "success": true,
  "message": "Token generated",
  "data": {
    "csrf_token": "...",
    "expires": 1234567890
  }
}
```

### Test 2: Products Endpoint
```bash
curl https://accordandharmony.org/api/products
```

Expected response:
```json
{
  "success": true,
  "message": "Products retrieved",
  "data": {
    "products": [...]
  }
}
```

---

## Step 7: Test Book Purchase Flow

### From the website:

1. Go to https://accordandharmony.org/resources
2. Click **Preview Sample Pages** (should show 9-page preview PDF)
3. Click **Get Book & Support Children**
4. Sign in or create account (if authentication is enabled)
5. Complete purchase through PayPal
6. Check email for:
   - Purchase confirmation
   - Personalized PDF download link
   - Tax receipt

### Using test script:

```bash
cd workers
node test-book-purchase.js
```

This will simulate a purchase and attempt to send email to rossen@kinov.com.

---

## Troubleshooting

### API returns 404
- Check that Worker is deployed: `npx wrangler deployments list`
- Verify Service Binding or Route is configured
- Check `_routes.json` exists in root of Pages project

### PDF watermarking fails
- Verify master PDF exists in R2: `npx wrangler r2 object list accordharmony-files`
- Check R2 binding in wrangler.toml is uncommented
- Ensure bucket name matches: `accordharmony-files`

### Emails not sending
- Verify `RESEND_API_KEY` is set in Worker environment variables
- Check Resend dashboard for any errors: https://resend.com/emails
- Ensure domain is verified in Resend (if using custom domain)

### Database errors
- Check D1 database is created: `npx wrangler d1 list`
- Run migrations: `npx wrangler d1 execute accordharmony-db --remote --file=schema.sql`

---

## Environment Variables Reference

| Variable | Required | Purpose | Example |
|----------|----------|---------|---------|
| `RESEND_API_KEY` | Yes | Email delivery | `re_xxx...` |
| `JWT_SECRET` | Yes | User authentication | `random32chars...` |
| `FRONTEND_URL` | Yes | CORS configuration | `https://accordandharmony.org` |
| `STRIPE_SECRET_KEY` | Optional | Stripe payments | `sk_live_xxx...` |
| `STRIPE_WEBHOOK_SECRET` | Optional | Stripe webhooks | `whsec_xxx...` |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth | `GOCSPX-xxx...` |
| `FACEBOOK_APP_ID` | Optional | Facebook OAuth | `123456789...` |
| `FACEBOOK_APP_SECRET` | Optional | Facebook OAuth | `xxx...` |

---

## Quick Reference Commands

```bash
# List R2 buckets
npx wrangler r2 bucket list

# List objects in bucket
npx wrangler r2 object list accordharmony-files

# Upload PDF to R2
npx wrangler r2 object put accordharmony-files/books/master/JAZZ_TRUMPET_MASTER_CLASS.pdf --file="../downloads/books/JAZZ_TRUMPET_MASTER_CLASS.pdf"

# Deploy worker
npx wrangler deploy

# View deployment history
npx wrangler deployments list

# Tail worker logs
npx wrangler tail

# Test local worker
npx wrangler dev

# Run database migrations
npx wrangler d1 execute accordharmony-db --remote --file=schema.sql

# Query database
npx wrangler d1 execute accordharmony-db --remote --command="SELECT * FROM users LIMIT 5"
```

---

## Next Steps After Setup

1. **Test thoroughly** with real purchases
2. **Monitor logs** for any errors: `npx wrangler tail`
3. **Set up monitoring** in Cloudflare Analytics
4. **Configure email domain** in Resend for custom from address
5. **Add payment webhooks** for automated reconciliation
6. **Set up backup** for D1 database regularly

---

## Support

- Cloudflare Workers Docs: https://developers.cloudflare.com/workers/
- R2 Storage Docs: https://developers.cloudflare.com/r2/
- Resend API Docs: https://resend.com/docs
- Worker source code: `/workers/src/`

---

**Last Updated:** 2025-11-16
**Status:** R2 setup pending
