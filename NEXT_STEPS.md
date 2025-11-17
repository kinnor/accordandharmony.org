# Payment System - Next Steps

**Status:** 70% Complete ✅
**Time Remaining:** ~16 minutes
**Last Updated:** 2025-11-16

---

## 🎉 What I've Automated For You

### ✅ Completed Automatically

1. **Worker Deployed**
   - URL: https://accordandharmony-workers.rossen-kinov.workers.dev
   - Status: Live and working
   - Version: 72ec5df4-aa53-4568-9b17-4d4c43922da8

2. **Environment Variables Set**
   - `JWT_SECRET`: Generated and configured (Secret)
   - `FRONTEND_URL`: https://accordandharmony.org (Secret)

3. **Configuration Fixed**
   - Updated compatibility_date to 2024-09-23
   - Created _worker.js for Service Binding routing
   - Created _routes.json for API routing
   - Prepared R2 bucket configuration

4. **API Tested**
   ```
   ✓ /api/csrf-token - Working
   ✓ /api/products - Working (returns Jazz Trumpet book)
   ```

5. **Documentation Created**
   - AUTOMATION_STATUS.md - Complete status report
   - SETUP_CHECKLIST.md - Quick setup guide
   - CLOUDFLARE_SETUP_GUIDE.md - Detailed reference
   - complete-setup.bat - Automated setup script

---

## 🚧 What You Need To Do (3 Steps)

### Step 1: Enable R2 Storage ⏱️ 3 min

**Why:** Required to store and deliver PDF books

**How:**
1. Open https://dash.cloudflare.com/
2. Click **R2 Object Storage** in sidebar
3. Click **Enable R2**
4. Add payment method (free tier: 10GB, 1M ops/month)
5. Create bucket: `accordharmony-files`

**Or run automated script after enabling R2:**
```bash
cd workers
complete-setup.bat
```

---

### Step 2: Configure Service Binding ⏱️ 2 min

**Why:** Connects API endpoints to main website (accordandharmony.org/api/*)

**How:**
1. Go to https://dash.cloudflare.com/
2. **Pages** → `accordandharmony` project
3. **Settings** → **Functions**
4. Scroll to **Service bindings**
5. Click **Add binding**:
   - Variable name: `API`
   - Service: `accordandharmony-workers`
   - Environment: `production`
6. Click **Save**

**Test:**
```powershell
Invoke-RestMethod -Uri 'https://accordandharmony.org/api/csrf-token'
```
Should return JSON (not HTML)

---

### Step 3: Configure Resend API ⏱️ 5 min

**Why:** Sends purchase confirmation emails and download links

**How:**
1. Go to https://resend.com/signup (or login)
2. Create account (free tier: 100 emails/day, 1 domain)
3. Navigate to **API Keys** → **Create API Key**
4. Copy the key (starts with `re_`)
5. Set in worker:
   ```bash
   cd workers
   npx wrangler secret put RESEND_API_KEY
   # Paste key when prompted
   ```

**Optional - Custom Domain:**
- Add `accordandharmony.org` in Resend
- Add DNS records to verify
- Use from: `noreply@accordandharmony.org`

---

## 🧪 Testing After Setup

### Test 1: API Endpoints
```powershell
# Should return JSON
Invoke-RestMethod -Uri 'https://accordandharmony.org/api/csrf-token'
Invoke-RestMethod -Uri 'https://accordandharmony.org/api/products'
```

### Test 2: Book Purchase (Local)
```bash
cd workers
node test-book-purchase.js
```

**Expected output:**
- Creates watermarked PDF
- Sends email to rossen@kinov.com
- Includes download link and tax receipt

### Test 3: Website Purchase Flow
1. Go to https://accordandharmony.org/resources
2. Click **Preview Sample Pages** (should show 9-page PDF with $19.99 pricing)
3. Click **Get Book & Support Children**
4. Create account or sign in
5. Complete purchase (use PayPal sandbox for testing)
6. Check email for:
   - Purchase confirmation
   - PDF download link (valid for 48 hours)
   - Tax-deductible receipt

---

## 📊 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Worker Deployment | ✅ Complete | Live at worker URL |
| Environment Vars | ✅ Complete | JWT_SECRET, FRONTEND_URL set |
| Database | ✅ Complete | D1 connected |
| API Endpoints | ✅ Working | On worker direct URL |
| R2 Storage | ❌ Blocked | Needs manual enable |
| PDF Upload | ⏸️ Waiting | After R2 enabled |
| Service Binding | ❌ Blocked | Needs manual config |
| Main Site API | ⏸️ Waiting | After Service Binding |
| Resend Email | ❌ Blocked | Needs API key |
| Book Purchase | ⏸️ Waiting | After all 3 steps |

---

## 🎯 Success Checklist

After completing all 3 steps, verify:

- [ ] R2 bucket exists: `npx wrangler r2 bucket list`
- [ ] Master PDF uploaded: `npx wrangler r2 object list accordharmony-files`
- [ ] API returns JSON: https://accordandharmony.org/api/csrf-token
- [ ] Products endpoint works: https://accordandharmony.org/api/products
- [ ] RESEND_API_KEY is set: `npx wrangler secret list`
- [ ] Test purchase completes: `node test-book-purchase.js`
- [ ] Email received with download link
- [ ] PDF is watermarked with customer name

---

## 📞 Quick Reference

### Test Worker Directly (Working Now)
```powershell
Invoke-RestMethod -Uri 'https://accordandharmony-workers.rossen-kinov.workers.dev/api/csrf-token'
Invoke-RestMethod -Uri 'https://accordandharmony-workers.rossen-kinov.workers.dev/api/products'
```

### After Service Binding
```powershell
Invoke-RestMethod -Uri 'https://accordandharmony.org/api/csrf-token'
Invoke-RestMethod -Uri 'https://accordandharmony.org/api/products'
```

### After R2 Enabled
```bash
cd workers
complete-setup.bat  # Automated setup
# OR
upload-master-pdf.bat  # Just upload PDF
```

### Check Logs
```bash
cd workers
npx wrangler tail  # Live logs
npx wrangler deployments list  # Deployment history
```

---

## 🆘 Need Help?

### If API Still Returns HTML
- Wait 2-3 minutes after configuring Service Binding
- Purge Cloudflare cache
- Verify binding variable is exactly `API` (case-sensitive)

### If R2 Upload Fails
```bash
npx wrangler whoami  # Check logged in
npx wrangler r2 bucket list  # Check R2 enabled
ls -la ../downloads/books/JAZZ_TRUMPET_MASTER_CLASS.pdf  # Check file exists
```

### If Emails Don't Send
```bash
npx wrangler secret list  # Check RESEND_API_KEY is set
# Check Resend dashboard: https://resend.com/emails
cd workers && node send-test-email.js  # Test email manually
```

---

## 📖 Detailed Documentation

- **Quick Start:** SETUP_CHECKLIST.md (20-minute guide)
- **Reference Guide:** CLOUDFLARE_SETUP_GUIDE.md (comprehensive docs)
- **Automation Status:** AUTOMATION_STATUS.md (test results & status)

---

## ⏱️ Time Estimate

| Step | Time |
|------|------|
| Enable R2 + Create Bucket | 3 min |
| Upload PDF (automated) | 1 min |
| Configure Service Binding | 2 min |
| Configure Resend API | 5 min |
| Testing | 5 min |
| **Total** | **~16 min** |

---

## 🎉 After Completion

Once all 3 steps are done:

1. **Book purchases will work** with real PayPal payments
2. **Customers receive emails** with personalized PDF downloads
3. **PDFs are watermarked** with customer name
4. **Tax receipts sent** automatically
5. **Download links expire** after 48 hours (configurable)
6. **Full authentication** system active (register, login, OAuth)
7. **Admin dashboard** data available via API

---

**Ready to start?**

1. Enable R2: https://dash.cloudflare.com/ → R2 Object Storage
2. Or follow: SETUP_CHECKLIST.md

**Questions?** Check CLOUDFLARE_SETUP_GUIDE.md or AUTOMATION_STATUS.md

---

**Last Automated:** 2025-11-16
**Worker Version:** 72ec5df4-aa53-4568-9b17-4d4c43922da8
**Status:** Ready for manual steps
