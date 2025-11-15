## Accord and Harmony Foundation - Book Purchase System Deployment Guide

This guide covers deployment of the complete digital product sales system with authentication, payments, and PDF delivery.

### 🎯 System Overview

The system provides:
- **User Authentication**: Email/password + Google/Facebook OAuth
- **Payment Processing**: Stripe Checkout for secure payments
- **PDF Delivery**: Automated watermarked PDF delivery via email
- **Database**: Cloudflare D1 for user data, transactions, downloads
- **Storage**: Cloudflare R2 for PDF files
- **Email**: Resend for transactional emails

### 📋 Prerequisites

1. **Cloudflare Account** with Workers, D1, and R2 access
2. **Stripe Account** (test mode for development, live for production)
3. **Resend Account** for email delivery
4. **Google Cloud Console** (for Google OAuth)
5. **Facebook Developers** (for Facebook OAuth)
6. **Node.js 18+** and npm installed locally

### 🚀 Step-by-Step Deployment

#### 1. Install Dependencies

```bash
cd workers
npm install
```

#### 2. Create Cloudflare D1 Database

```bash
# Create development database
npx wrangler d1 create accordharmony-db-dev

# Create production database
npx wrangler d1 create accordharmony-db-prod
```

**Important**: Copy the `database_id` from the output and update `wrangler.toml`:
- Replace `YOUR_DEV_DATABASE_ID` with development database ID
- Replace `YOUR_PROD_DATABASE_ID` with production database ID

#### 3. Create Cloudflare R2 Bucket

```bash
# Create development bucket
npx wrangler r2 bucket create accordharmony-files-dev

# Create production bucket
npx wrangler r2 bucket create accordharmony-files-prod
```

#### 4. Create Cloudflare KV Namespace

```bash
# Create development KV
npx wrangler kv:namespace create KV_CACHE --preview

# Create production KV
npx wrangler kv:namespace create KV_CACHE
```

Update `wrangler.toml` with the KV namespace IDs.

#### 5. Run Database Migration

```bash
# For development
npx wrangler d1 execute accordharmony-db-dev --file=./schema.sql

# For production
npx wrangler d1 execute accordharmony-db-prod --file=./schema.sql --env production
```

Verify migration:
```bash
npx wrangler d1 execute accordharmony-db-dev --command="SELECT * FROM products"
```

You should see the Jazz Trumpet Master Class book in the results.

#### 6. Upload PDF to R2

Upload the original `jazz-trumpet-masterclass.pdf` to R2:

```bash
# Using wrangler
npx wrangler r2 object put accordharmony-files-dev/books/jazz-trumpet-masterclass.pdf --file=/path/to/jazz-trumpet-masterclass.pdf

# Or use Cloudflare dashboard: R2 > your-bucket > Upload
```

**Important**: The file path must match `file_key` in the database: `books/jazz-trumpet-masterclass.pdf`

#### 7. Set Up Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Get your API keys: **Developers > API Keys**
   - Copy **Secret key** (starts with `sk_test_` for test mode)
3. Set up webhook:
   - Go to **Developers > Webhooks > Add endpoint**
   - Endpoint URL: `https://accordandharmony.org/api/webhooks/stripe`
   - Events to send:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
   - Copy **Signing secret** (starts with `whsec_`)

#### 8. Set Up Resend

1. Go to [Resend Dashboard](https://resend.com/overview)
2. **API Keys > Create API Key**
3. Copy the API key (starts with `re_`)
4. Add domain verification:
   - **Domains > Add Domain**: `accordandharmony.org`
   - Add DNS records as instructed

#### 9. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. **APIs & Services > Credentials > Create Credentials > OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Authorized redirect URIs:
   - `https://accordandharmony.org/auth-callback.html`
   - `http://localhost:8787/auth-callback.html` (for development)
6. Copy **Client ID** and **Client Secret**

#### 10. Set Up Facebook OAuth

1. Go to [Facebook Developers](https://developers.facebook.com)
2. **My Apps > Create App > Consumer**
3. **Products > Facebook Login > Settings**
4. Valid OAuth Redirect URIs:
   - `https://accordandharmony.org/auth-callback.html`
   - `http://localhost:3000/auth-callback.html` (for development)
5. Copy **App ID** and **App Secret** from **Settings > Basic**

#### 11. Set Environment Variables

Set secrets in Cloudflare Workers:

```bash
# JWT Secret (generate a random 32+ character string)
npx wrangler secret put JWT_SECRET

# Stripe
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET

# Resend
npx wrangler secret put RESEND_API_KEY

# Google OAuth
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET

# Facebook OAuth
npx wrangler secret put FACEBOOK_APP_ID
npx wrangler secret put FACEBOOK_APP_SECRET

# Frontend URL
npx wrangler secret put FRONTEND_URL
# Enter: https://accordandharmony.org
```

For production environment, add `--env production` to each command.

#### 12. Deploy Workers

```bash
# Deploy to development
npm run deploy

# Deploy to production
npm run deploy:prod
```

#### 13. Update Frontend Configuration

Edit `auth-client.js` and replace placeholders:

```javascript
// Line ~114
const clientId = 'YOUR_GOOGLE_CLIENT_ID'; // Replace with actual Google Client ID

// Line ~127
const appId = 'YOUR_FACEBOOK_APP_ID'; // Replace with actual Facebook App ID
```

#### 14. Deploy Frontend to Cloudflare Pages

```bash
# From project root
npx wrangler pages deploy . --project-name=accordharmony
```

### 🧪 Testing

#### Test in Development

```bash
# Start local development server
cd workers
npm run dev
```

Visit `http://localhost:8787` and test:

1. **User Registration**
   - Visit donate page
   - Click "Purchase & Support Foundation"
   - Create account with test email

2. **Book Purchase**
   - Complete Stripe checkout using test card: `4242 4242 4242 4242`
   - Expiry: any future date
   - CVC: any 3 digits

3. **Webhook Testing**
   - Use Stripe CLI:
     ```bash
     stripe listen --forward-to localhost:8787/api/webhooks/stripe
     ```
   - Trigger test events:
     ```bash
     stripe trigger payment_intent.succeeded
     ```

4. **Email Delivery**
   - Check Resend dashboard for sent emails
   - Verify download link works

#### Test Download Flow

1. Purchase book with test account
2. Check email for download link
3. Click download link
4. Verify PDF downloads with watermark metadata
5. Try downloading multiple times (max 5)
6. Test link expiration (24 hours)

### 📊 Monitoring

#### Cloudflare Dashboard

- **Workers > accordharmony-workers > Logs**: View real-time logs
- **D1 > accordharmony-db**: Query database
- **R2 > accordharmony-files**: View stored PDFs

#### Stripe Dashboard

- **Payments**: View all transactions
- **Webhooks**: Monitor webhook deliveries
- **Customers**: View customer records

#### Resend Dashboard

- **Emails**: View sent emails and delivery status

### 🔒 Security Checklist

- [ ] All API secrets set as environment variables (not in code)
- [ ] JWT_SECRET is strong (32+ random characters)
- [ ] Stripe webhook signature verification enabled
- [ ] CORS configured for frontend domain only
- [ ] Rate limiting enabled on sensitive endpoints
- [ ] Database has proper indexes for performance
- [ ] R2 bucket access is restricted
- [ ] OAuth redirect URIs limited to your domain

### 🐛 Troubleshooting

**Purchase fails silently**
- Check Stripe dashboard for failed payments
- Verify webhook is receiving events
- Check Workers logs for errors

**Email not received**
- Check Resend dashboard for delivery status
- Verify domain DNS records
- Check spam folder

**Download link doesn't work**
- Verify PDF exists in R2: `books/jazz-trumpet-masterclass.pdf`
- Check download record in database
- Verify token hasn't expired

**Authentication fails**
- Check JWT_SECRET is set
- Verify OAuth credentials are correct
- Check redirect URIs match exactly

### 📝 Maintenance

#### Update Book Price

```sql
UPDATE products
SET price_cents = 3000  -- €30.00
WHERE id = 'jazz-trumpet-masterclass-2025';
```

#### View Sales Report

```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as sales,
  SUM(amount_cents) / 100.0 as revenue_eur
FROM transactions
WHERE payment_status = 'completed'
  AND transaction_type = 'product_purchase'
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;
```

#### Export Customer List

```sql
SELECT
  u.email,
  u.full_name,
  t.created_at as purchase_date,
  t.amount_cents / 100.0 as amount_eur
FROM users u
JOIN transactions t ON u.id = t.user_id
WHERE t.transaction_type = 'product_purchase'
  AND t.payment_status = 'completed'
ORDER BY t.created_at DESC;
```

### 🆘 Support

For issues or questions:
- Email: contact@acchm.org
- Check logs in Cloudflare Dashboard
- Review Stripe webhook logs
- Verify all environment variables are set

---

**Congratulations!** Your world-class digital product sales system is now live. 🎉
