# Jazz Trumpet Master Class - Digital Book Purchase System

## 🎺 Overview

World-class digital product sales platform for the Accord and Harmony Foundation, enabling secure purchase and delivery of the "Jazz Trumpet Master Class" PDF book with proceeds supporting the foundation's mission.

## ✨ Features

### User Experience
- **Simple Authentication**: Email/password or one-click social login (Google/Facebook)
- **Secure Payments**: Stripe Checkout integration with multiple payment methods
- **Instant Delivery**: Automated email with personalized PDF download link
- **Tax Receipts**: Automatic tax-deductible donation receipts
- **Mobile Optimized**: Fully responsive design for all devices

### Technical Capabilities
- **User Management**: JWT-based authentication with refresh tokens
- **Payment Processing**: Stripe integration with webhook automation
- **PDF Watermarking**: Personalized PDFs with user license information
- **Email Delivery**: Transactional emails via Resend
- **Database**: Cloudflare D1 for scalable, distributed storage
- **File Storage**: Cloudflare R2 for secure PDF hosting
- **Security**: Rate limiting, CORS protection, encrypted secrets

## 🏗️ Architecture

```
┌─────────────────┐
│  Frontend       │
│  (Static HTML)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐
│ Cloudflare      │────▶│  Stripe      │
│ Workers API     │     │  Checkout    │
└────────┬────────┘     └──────────────┘
         │
    ┌────┴────┬──────────┬────────────┐
    ▼         ▼          ▼            ▼
┌────────┐ ┌─────┐  ┌────────┐  ┌─────────┐
│   D1   │ │ R2  │  │ Resend │  │  OAuth  │
│  (DB)  │ │(PDF)│  │(Email) │  │Providers│
└────────┘ └─────┘  └────────┘  └─────────┘
```

## 💻 Technology Stack

### Frontend
- Pure HTML5, CSS3, JavaScript (ES6+)
- No frameworks - lightweight and fast
- Responsive design with CSS Grid & Flexbox
- Social OAuth integration

### Backend
- **Runtime**: Cloudflare Workers (serverless)
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Payment**: Stripe API v2023-10-16
- **Email**: Resend API
- **Auth**: JWT with bcrypt password hashing
- **Languages**: JavaScript/Node.js

## 📦 Project Structure

```
accordandharmony.org/
├── donate.html              # Donation page with book purchase section
├── auth-client.js           # Frontend authentication logic
├── book-purchase.js         # Frontend purchase flow logic
├── styles.css               # All CSS including book section styles
│
├── workers/                 # Cloudflare Workers backend
│   ├── src/
│   │   ├── index.js        # Main router
│   │   ├── auth.js         # Authentication utilities
│   │   ├── auth-endpoints.js   # Auth API handlers
│   │   ├── payment-endpoints.js # Payment API handlers
│   │   ├── download-endpoint.js # Download handler
│   │   ├── stripe-service.js    # Stripe integration
│   │   ├── email-service.js     # Resend email service
│   │   ├── pdf-watermark.js     # PDF processing
│   │   ├── db.js           # Database helpers
│   │   └── utils.js        # Utility functions
│   ├── schema.sql          # Database schema
│   ├── migrate.sh          # Migration script
│   ├── package.json        # Dependencies
│   ├── wrangler.toml       # Cloudflare config
│   └── .env.example        # Environment template
│
└── BOOK_PURCHASE_DEPLOYMENT.md  # Deployment guide
```

## 🚀 Quick Start

### Development Setup

1. **Clone and Install**
   ```bash
   cd workers
   npm install
   ```

2. **Set Up Database**
   ```bash
   npx wrangler d1 create accordharmony-db-dev
   npx wrangler d1 execute accordharmony-db-dev --file=./schema.sql
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env and set your API keys
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Test Purchase Flow**
   - Visit `http://localhost:8787/donate.html`
   - Click "Purchase & Support Foundation"
   - Use Stripe test card: `4242 4242 4242 4242`

### Production Deployment

See [BOOK_PURCHASE_DEPLOYMENT.md](BOOK_PURCHASE_DEPLOYMENT.md) for complete deployment instructions.

## 🔐 Security Features

- **Authentication**: JWT with secure refresh tokens, 15-min access token expiry
- **Password Security**: bcrypt hashing with salt rounds=10
- **Payment Security**: Stripe Checkout (PCI-compliant), webhook signature verification
- **CORS Protection**: Restricted to frontend domain
- **Rate Limiting**: Via Cloudflare KV namespace
- **SQL Injection**: Parameterized queries with Cloudflare D1
- **XSS Prevention**: Content Security Policy headers
- **Secret Management**: Environment variables via Cloudflare Workers secrets

## 📊 Database Schema

Key tables:
- **users**: User accounts and profiles
- **transactions**: Payment records and donations
- **downloads**: PDF download tracking with tokens
- **products**: Book catalog
- **sessions**: JWT refresh token storage
- **email_logs**: Email delivery tracking
- **audit_logs**: Security and compliance logging

## 🧪 Testing

### Manual Testing

```bash
# Test registration
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","full_name":"Test User"}'

# Test login
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test book purchase (requires auth token)
curl -X POST http://localhost:8787/api/checkout/book \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":"jazz-trumpet-masterclass-2025"}'
```

### Stripe Webhook Testing

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:8787/api/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
```

## 📈 Analytics & Monitoring

### Sales Dashboard (SQL Queries)

```sql
-- Today's sales
SELECT COUNT(*) as sales, SUM(amount_cents)/100 as revenue_eur
FROM transactions
WHERE payment_status = 'completed'
  AND DATE(created_at) = DATE('now');

-- Top customers
SELECT u.email, COUNT(*) as purchases, SUM(t.amount_cents)/100 as total_eur
FROM users u
JOIN transactions t ON u.id = t.user_id
WHERE t.payment_status = 'completed'
GROUP BY u.email
ORDER BY total_eur DESC
LIMIT 10;

-- Download statistics
SELECT product_id, AVG(download_count) as avg_downloads, MAX(download_count) as max_downloads
FROM downloads
GROUP BY product_id;
```

## 🛠️ Maintenance

### Update Book Price

```sql
UPDATE products
SET price_cents = 3000, updated_at = datetime('now')
WHERE id = 'jazz-trumpet-masterclass-2025';
```

### Resend Download Link

```bash
curl -X POST http://localhost:8787/api/download/resend \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"transactionId":"txn_abc123"}'
```

### Export Customer Data (GDPR)

```sql
SELECT * FROM users WHERE email = 'user@example.com';
SELECT * FROM transactions WHERE user_id = 'usr_123';
SELECT * FROM downloads WHERE user_id = 'usr_123';
```

## 🤝 Contributing

This is a private project for Accord and Harmony Foundation. For feature requests or bug reports, contact: contact@acchm.org

## 📄 License

Proprietary - © 2025 Accord and Harmony Foundation

## 🙏 Acknowledgments

- **Stripe** for secure payment processing
- **Cloudflare** for Workers, D1, and R2 infrastructure
- **Resend** for transactional email delivery
- **Google & Facebook** for OAuth integration

## 📞 Support

- **Email**: contact@acchm.org
- **Website**: https://accordandharmony.org
- **Documentation**: See BOOK_PURCHASE_DEPLOYMENT.md

---

**Built with ❤️ for music education and children's welfare**
