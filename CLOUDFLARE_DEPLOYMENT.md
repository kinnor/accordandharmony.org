# Cloudflare Pages + Workers Deployment Guide
**Accord and Harmony Foundation Website**
**Last Updated:** November 2025

This guide covers deploying your website to Cloudflare Pages with Cloudflare Workers for backend functionality.

---

## 🎯 Why Cloudflare?

**Benefits:**
- ✅ **Free hosting** (Cloudflare Pages)
- ✅ **Free serverless functions** (Cloudflare Workers - 100,000 requests/day free)
- ✅ **Global CDN** (Fast worldwide)
- ✅ **Free SSL/HTTPS** (Automatic)
- ✅ **DDoS protection** (Built-in security)
- ✅ **No PHP server needed** (Serverless architecture)

---

## 📋 Prerequisites

1. **Cloudflare Account** (free)
   - Sign up at: https://dash.cloudflare.com/sign-up

2. **Email Service API Key** (choose one):
   - **Option A:** Resend (Recommended, 3,000 emails/month free)
     - Sign up: https://resend.com/
   - **Option B:** Mailgun (10,000 emails/month free)
     - Sign up: https://www.mailgun.com/
   - **Option C:** SendGrid (100 emails/day free)
     - Sign up: https://sendgrid.com/

3. **Node.js installed** (for local development only)
   - Download: https://nodejs.org/

---

## 🚀 Step 1: Deploy Static Site to Cloudflare Pages

### A. Connect Repository to Cloudflare Pages

1. **Login to Cloudflare Dashboard**
   - Go to: https://dash.cloudflare.com/

2. **Create a Pages Project**
   - Click "Workers & Pages" in sidebar
   - Click "Create application"
   - Click "Pages" tab
   - Click "Connect to Git"

3. **Connect GitHub Repository**
   - Authorize Cloudflare to access your GitHub
   - Select repository: `kinnor/accordandharmony.org`
   - Click "Begin setup"

4. **Configure Build Settings**
   ```
   Production branch: main (or feature/production-deployment)
   Build command: (leave empty)
   Build output directory: /
   Root directory: /
   ```

5. **Add Environment Variables** (skip for now, we'll add later)

6. **Click "Save and Deploy"**

Your static site will be deployed to a URL like:
`https://accordandharmony.pages.dev`

---

## 🔧 Step 2: Set Up Email Service

### Option A: Using Resend (Recommended)

1. **Sign up for Resend**
   - Go to: https://resend.com/signup
   - Verify your email

2. **Add Your Domain**
   - Go to Domains → Add Domain
   - Enter: `accordandharmony.org`
   - Add DNS records to Cloudflare (copy records shown)

3. **Get API Key**
   - Go to API Keys
   - Click "Create API Key"
   - Name: "Accord Harmony Website"
   - Permission: "Full Access"
   - Copy the API key (save it securely!)

4. **Verify Domain**
   - In Cloudflare DNS, add the records from Resend
   - Wait for verification (usually 5-15 minutes)

### Option B: Using Mailgun

1. **Sign up for Mailgun**
   - Go to: https://signup.mailgun.com/
   - Choose free plan

2. **Add Domain**
   - Go to Sending → Domains
   - Add `accordandharmony.org`
   - Add DNS records to Cloudflare

3. **Get API Key**
   - Go to Settings → API Keys
   - Copy "Private API Key"
   - Note your Mailgun domain (e.g., `mg.accordandharmony.org`)

---

## ⚙️ Step 3: Deploy Cloudflare Workers

### A. Install Wrangler CLI

```bash
npm install -g wrangler
```

### B. Login to Cloudflare

```bash
wrangler login
```

This will open a browser for authentication.

### C. Deploy Worker

```bash
cd workers
npm install
wrangler deploy
```

### D. Set Environment Variables

After deployment, set these secrets:

```bash
# Navigate to workers directory
cd workers

# Set email service API key (choose one)

# For Resend:
wrangler secret put RESEND_API_KEY
# Paste your Resend API key when prompted

# For Mailgun:
wrangler secret put MAILGUN_API_KEY
wrangler secret put MAILGUN_DOMAIN

# Set other environment variables
wrangler secret put TO_EMAIL
# Enter: contact@acchm.org

wrangler secret put FROM_EMAIL
# Enter: contact@acchm.org

wrangler secret put SITE_NAME
# Enter: Accord and Harmony Foundation

wrangler secret put FROM_NAME
# Enter: Accord and Harmony Foundation

wrangler secret put REPLY_TO_EMAIL
# Enter: contact@acchm.org
```

### E. Bind Worker to Pages

1. Go to Cloudflare Dashboard
2. Click "Workers & Pages"
3. Click your Pages project
4. Go to "Settings" → "Functions"
5. Scroll to "Service bindings"
6. Click "Add binding"
   - Variable name: `API`
   - Service: Select your worker
   - Environment: `production`
7. Click "Save"

---

## 🌐 Step 4: Add Custom Domain

1. **In Cloudflare Pages Dashboard:**
   - Go to your Pages project
   - Click "Custom domains"
   - Click "Set up a custom domain"

2. **Add Domain:**
   - Enter: `accordandharmony.org`
   - Click "Continue"

3. **Add DNS Record:**
   - If domain is on Cloudflare (already registered):
     - Cloudflare will auto-add CNAME record
   - If domain is external:
     - Add CNAME record:
       ```
       Name: @
       Target: accordandharmony.pages.dev
       ```

4. **Wait for DNS Propagation** (5-30 minutes)

5. **Verify HTTPS:**
   - Visit: https://accordandharmony.org
   - SSL certificate is automatic

---

## 📧 Step 5: Update Email Settings in Resend/Mailgun

### For Resend:

Update `workers/src/utils.js` if needed (already configured)

### For Mailgun:

If using Mailgun instead of Resend, update `workers/src/utils.js`:

1. Open: `workers/src/utils.js`
2. In the `sendEmail` function, replace the Resend code with:

```javascript
export async function sendEmail(to, subject, htmlBody, env, replyTo = null) {
  try {
    const formData = new FormData();
    formData.append('from', `${env.FROM_NAME || 'Accord and Harmony Foundation'} <${env.FROM_EMAIL || 'contact@acchm.org'}>`);
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('html', htmlBody);
    if (replyTo) {
      formData.append('h:Reply-To', replyTo);
    }

    const response = await fetch(
      `https://api.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`api:${env.MAILGUN_API_KEY}`)}`,
        },
        body: formData,
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Mailgun email failed:', error);
    return false;
  }
}
```

3. Redeploy worker: `wrangler deploy`

---

## ✅ Step 6: Test Everything

### Test 1: Static Site
- Visit: https://accordandharmony.org
- ✅ All pages load
- ✅ Images display
- ✅ Navigation works
- ✅ PayPal button appears on donate page

### Test 2: Newsletter Form
1. Go to homepage
2. Enter email in newsletter form
3. Submit
4. ✅ Success message appears
5. ✅ Check email at contact@acchm.org for notification
6. ✅ Check subscriber email for confirmation

### Test 3: Contact Form
1. Go to contact page
2. Fill out form
3. Submit
4. ✅ Success message appears
5. ✅ Check email at contact@acchm.org
6. ✅ Check sender email for auto-reply

### Test 4: PayPal Donations
1. Go to donate page
2. Select amount (€10)
3. Click PayPal button
4. Complete payment (use sandbox or real)
5. ✅ Redirected to success page
6. ✅ Order ID displays
7. ✅ Check email at contact@acchm.org for notification

---

## 🔍 Troubleshooting

### Issue: Worker not responding

**Check:**
1. Worker is deployed: `wrangler deployments list`
2. Environment variables are set: Check Cloudflare dashboard → Workers → Settings → Variables
3. Check Worker logs: `wrangler tail`

**Solution:**
```bash
cd workers
wrangler deploy
```

### Issue: Emails not sending

**Check:**
1. API key is correct in environment variables
2. Domain is verified in Resend/Mailgun
3. Check Worker logs: `wrangler tail`

**Solution:**
- Verify DNS records in Cloudflare match Resend/Mailgun requirements
- Test API key manually using Resend/Mailgun dashboard

### Issue: PayPal button not appearing

**Check:**
1. PayPal SDK script is loaded in `donate.html`
2. Client ID is correct
3. Browser console for errors (F12)

**Solution:**
- Verify Client ID in `donate.html` line 13
- Check if ad blockers are blocking PayPal SDK

### Issue: CORS errors in browser console

**Solution:**
Worker is already configured for CORS. If issues persist:
1. Check `workers/src/utils.js` → `handleCORS()` function
2. Verify `Access-Control-Allow-Origin` header is set

---

## 📊 Monitoring & Maintenance

### View Worker Analytics
1. Go to Cloudflare Dashboard
2. Click "Workers & Pages"
3. Click your worker
4. View "Metrics" tab

### View Real-Time Logs
```bash
cd workers
wrangler tail
```

### Update Worker Code
1. Edit files in `workers/src/`
2. Deploy changes:
   ```bash
   cd workers
   wrangler deploy
   ```

### Update Static Site
1. Push changes to GitHub (main branch)
2. Cloudflare Pages auto-deploys on push

---

## 💰 Cost Breakdown

**Cloudflare Pages:**
- Free: Unlimited sites, unlimited bandwidth

**Cloudflare Workers:**
- Free: 100,000 requests/day
- Paid: $5/month for 10 million requests

**Email Service (Resend):**
- Free: 3,000 emails/month
- Paid: $20/month for 50,000 emails

**Email Service (Mailgun):**
- Free: 10,000 emails/month (first 3 months)
- Paid: $35/month for 50,000 emails

**Estimated Monthly Cost:** $0 (if staying within free tiers)

---

## 🔐 Security Features

✅ **Automatic HTTPS** - Free SSL certificate
✅ **DDoS Protection** - Cloudflare's network
✅ **Input Sanitization** - Built into Workers
✅ **Rate Limiting** - Can be added via Cloudflare Rules
✅ **CORS Protection** - Configured in Workers
✅ **Environment Variables** - Secrets stored securely

---

## 📁 File Structure

```
accordandharmony.org/
├── index.html, about.html, etc.    # Static site files
├── styles.css, script.js            # Frontend assets
├── images/                          # Image files
├── workers/                         # Cloudflare Workers
│   ├── src/
│   │   ├── index.js                 # Main worker router
│   │   ├── utils.js                 # Utility functions
│   │   ├── newsletter.js            # Newsletter handler
│   │   ├── contact.js               # Contact form handler
│   │   └── paypal-notify.js         # PayPal notification
│   ├── wrangler.toml                # Worker configuration
│   └── package.json                 # Dependencies
├── .pages.toml                      # Pages configuration
└── CLOUDFLARE_DEPLOYMENT.md         # This file
```

---

## 🎯 Next Steps After Deployment

1. ✅ Test all forms thoroughly
2. ✅ Set up Google Analytics (optional)
3. ✅ Add privacy policy page (recommended)
4. ✅ Set up email forwarding for contact@acchm.org
5. ✅ Monitor Worker usage in Cloudflare dashboard
6. ✅ Test donation flow with small amount (€1)

---

## 📞 Support

**Cloudflare Support:**
- Community: https://community.cloudflare.com/
- Docs: https://developers.cloudflare.com/

**Email Service Support:**
- Resend: https://resend.com/docs
- Mailgun: https://documentation.mailgun.com/

**Technical Issues:**
- Check Worker logs: `wrangler tail`
- Check browser console (F12)
- Review this guide

---

## ✅ Migration Complete!

Your website is now deployed on Cloudflare with:
- ✅ Static site hosted on Cloudflare Pages
- ✅ Serverless backend via Cloudflare Workers
- ✅ Email delivery via Resend/Mailgun
- ✅ PayPal donation integration
- ✅ Custom domain with HTTPS
- ✅ Global CDN for fast loading

**Your site is live at:** https://accordandharmony.org 🎉

---

**Questions?** Email contact@acchm.org

**Good luck with your mission to support education and families in Bulgaria!** 💚
