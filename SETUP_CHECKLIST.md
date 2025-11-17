# Book Purchase System Setup Checklist

Follow these steps **in order** to activate the payment system.

---

## ✅ Pre-Setup (Already Complete)

- [x] Worker code deployed to Cloudflare
- [x] D1 Database configured
- [x] Master PDF available locally
- [x] Website deployed to Cloudflare Pages
- [x] Configuration files updated

---

## 📋 Setup Steps (Do These Now)

### Step 1: Enable R2 Storage ⏱️ 2 minutes

1. Open https://dash.cloudflare.com/ in your browser
2. Click **R2 Object Storage** in left sidebar
3. Click **Enable R2** or **Get Started**
4. Add payment method (R2 has free tier)
5. Accept terms

**Verify:**
```bash
cd workers
npx wrangler r2 bucket list
```

---

### Step 2: Create R2 Bucket ⏱️ 1 minute

**In Cloudflare Dashboard:**
1. Stay in R2 section
2. Click **Create bucket**
3. Name: `accordharmony-files`
4. Location: **Automatic**
5. Click **Create bucket**

**Verify:**
```bash
npx wrangler r2 bucket list
```
Should show `accordharmony-files`

---

### Step 3: Upload Master PDF ⏱️ 1 minute

**Option A - Automated (Windows):**
```bash
cd workers
upload-master-pdf.bat
```

**Option B - Manual:**
```bash
cd workers
npx wrangler r2 object put accordharmony-files/books/master/JAZZ_TRUMPET_MASTER_CLASS.pdf --file="../downloads/books/JAZZ_TRUMPET_MASTER_CLASS.pdf" --content-type="application/pdf"
```

**Verify:**
```bash
npx wrangler r2 object list accordharmony-files --prefix=books/master/
```
Should show `JAZZ_TRUMPET_MASTER_CLASS.pdf`

---

### Step 4: Configure Environment Variables ⏱️ 5 minutes

**In Cloudflare Dashboard:**

1. Go to **Workers & Pages**
2. Click `accordandharmony-workers`
3. Go to **Settings** → **Variables**
4. Click **Add variable** for each:

**Required Variables:**

| Variable Name | Value | Type |
|--------------|-------|------|
| `RESEND_API_KEY` | Get from https://resend.com/api-keys | Secret ✓ |
| `JWT_SECRET` | Generate random 32+ chars | Secret ✓ |
| `FRONTEND_URL` | `https://accordandharmony.org` | Text |

**To generate JWT_SECRET:**
```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Online
# Visit: https://randomkeygen.com/
# Use "CodeIgniter Encryption Keys" section
```

5. Click **Save and deploy**

**Verify:**
- Variables section should show 3 variables
- Secrets should be hidden (encrypted)

---

### Step 5: Connect Worker to Pages ⏱️ 3 minutes

**In Cloudflare Dashboard:**

1. Go to **Pages**
2. Click `accordandharmony` project
3. Go to **Settings** → **Functions**
4. Scroll to **Service bindings**
5. Click **Add binding**
   - Variable name: `API`
   - Service: `accordandharmony-workers`
   - Environment: `production`
6. Click **Save**

**Alternative if binding doesn't work:**
The `_worker.js` file in the repo will automatically route `/api/*` requests.

---

### Step 6: Deploy Updated Configuration ⏱️ 2 minutes

**From command line:**
```bash
cd workers
npx wrangler deploy
```

**Expected output:**
```
✨ Successfully deployed!
```

---

### Step 7: Test API Endpoints ⏱️ 2 minutes

**Test 1: CSRF Token**
```bash
curl https://accordandharmony.org/api/csrf-token
```

**Expected:**
```json
{"success":true,"message":"Token generated","data":{"csrf_token":"...","expires":...}}
```

**Test 2: Products**
```bash
curl https://accordandharmony.org/api/products
```

**Expected:**
```json
{"success":true,"message":"Products retrieved","data":{...}}
```

**If you get HTML instead of JSON:**
- Service binding may not be active yet (can take 1-2 minutes)
- Try purging Cloudflare cache
- Check `_worker.js` is deployed to Pages

---

### Step 8: Test Book Purchase Flow ⏱️ 5 minutes

**From website:**

1. Go to https://accordandharmony.org/resources
2. Click **Preview Sample Pages**
   - Should show 9-page preview PDF
   - Should show new pricing: $19.99 USD
3. Click **Get Book & Support Children**
4. Create account or sign in
5. Complete purchase (use PayPal sandbox for testing)
6. Check email (rossen@kinov.com) for:
   - Purchase confirmation
   - PDF download link
   - Tax receipt

**Local test (without payment):**
```bash
cd workers
node test-book-purchase.js
```

---

## 🔧 Troubleshooting

### API returns 404
```bash
# Check deployment
cd workers
npx wrangler deployments list

# Check latest logs
npx wrangler tail
```

### PDF watermarking fails
```bash
# Verify PDF in R2
npx wrangler r2 object list accordharmony-files

# Check file exists
npx wrangler r2 object get accordharmony-files/books/master/JAZZ_TRUMPET_MASTER_CLASS.pdf
```

### Emails not sending
- Check `RESEND_API_KEY` is set in Worker variables
- Verify API key at https://resend.com/api-keys
- Check Resend logs at https://resend.com/emails

---

## 📊 Success Criteria

- [ ] R2 enabled and bucket created
- [ ] Master PDF uploaded to R2
- [ ] Environment variables configured
- [ ] Worker deployed successfully
- [ ] Service binding active
- [ ] API endpoints return JSON (not HTML)
- [ ] Book purchase test completes
- [ ] Email received with PDF link
- [ ] PDF download works and is watermarked

---

## 🎯 Timeline

**Total estimated time: ~20 minutes**

- R2 setup: 3 min
- PDF upload: 1 min
- Environment vars: 5 min
- Service binding: 3 min
- Deploy: 2 min
- Testing: 6 min

---

## 📞 Support

If you encounter issues:

1. Check `CLOUDFLARE_SETUP_GUIDE.md` for detailed instructions
2. View Worker logs: `npx wrangler tail`
3. Check Cloudflare dashboard for error messages
4. Verify all environment variables are set

---

**Ready to start?** Begin with Step 1: Enable R2 Storage

Last updated: 2025-11-16
