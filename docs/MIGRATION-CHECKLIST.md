# Email Migration Checklist - Resend Integration

## Overview

This checklist guides you through migrating from the current non-functional forms to a fully working Resend-powered email system using the **mail.accordandharmony.org** subdomain.

**Timeline**: Approximately 2-4 hours (including DNS propagation wait time)

**Important**: This migration will NOT affect your existing email receiving capabilities at `contact@acchm.org`.

---

## Pre-Migration Preparation

### ☐ Step 1: Create Resend Account

1. **Sign up** at https://resend.com
2. **Verify your email** address
3. **Complete onboarding** if required
4. Note: Free tier includes 100 emails/day (3,000/month) - sufficient for most NGOs

**Status**: ☐ Not Started | ☐ In Progress | ☐ Completed

---

### ☐ Step 2: Get Resend API Key

1. Log into Resend dashboard
2. Navigate to **API Keys** section
3. Click **Create API Key**
4. Name: `Accord and Harmony Production`
5. Permissions: **Full Access** (or **Sending access** only for better security)
6. **Copy the API key** and save it securely (you won't see it again!)
7. Store in password manager or secure location

**API Key**: `re_________________________` (will start with `re_`)

**Status**: ☐ Not Started | ☐ In Progress | ☐ Completed

---

### ☐ Step 3: Add Domain to Resend

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter: `mail.accordandharmony.org`
4. Click **Add**
5. Resend will show DNS records you need to add

**Status**: ☐ Not Started | ☐ In Progress | ☐ Completed

---

## DNS Configuration

### ☐ Step 4: Access Network Solutions DNS Manager

1. Log into https://www.networksolutions.com
2. Navigate to **My Account** → **Domain Names**
3. Find `accordandharmony.org`
4. Click **Manage** → **Advanced DNS** (or **DNS Manager**)
5. Keep this tab open - you'll add records here

**Status**: ☐ Not Started | ☐ In Progress | ☐ Completed

---

### ☐ Step 5: Add MX Records

**In Resend Dashboard**: Copy the MX record values

**In Network Solutions**:
1. Click **Add Record**
2. Type: **MX**
3. Host: `mail`
4. Priority: `10`
5. Points To: *(paste from Resend - typically `feedback-smtp.us-east-1.amazonses.com`)*
6. TTL: `3600` (or Auto)
7. **Save**

Repeat for second MX record (Priority `20`)

**Records Added**:
- ☐ MX record (Priority 10)
- ☐ MX record (Priority 20)

**Status**: ☐ Not Started | ☐ In Progress | ☐ Completed

---

### ☐ Step 6: Add SPF Record

**In Resend Dashboard**: Copy the SPF (TXT) record value

**In Network Solutions**:
1. Click **Add Record**
2. Type: **TXT**
3. Host: `mail`
4. Text/Value: `v=spf1 include:amazonses.com ~all` *(or exact value from Resend)*
5. TTL: `3600` (or Auto)
6. **Save**

**Status**: ☐ Not Started | ☐ In Progress | ☐ Completed

---

### ☐ Step 7: Add DKIM Records

**In Resend Dashboard**: Copy DKIM record(s) - may be CNAME or TXT

**In Network Solutions** (for each DKIM record):
1. Click **Add Record**
2. Type: **CNAME** or **TXT** (as shown in Resend)
3. Host: *(from Resend, e.g., `resend._domainkey.mail`)*
4. Points To / Value: *(paste from Resend)*
5. TTL: `3600` (or Auto)
6. **Save**

**Records Added**:
- ☐ DKIM record 1
- ☐ DKIM record 2 (if applicable)
- ☐ DKIM record 3 (if applicable)

**Status**: ☐ Not Started | ☐ In Progress | ☐ Completed

---

### ☐ Step 8: Add DMARC Record (Recommended)

**In Network Solutions**:
1. Click **Add Record**
2. Type: **TXT**
3. Host: `_dmarc.mail`
4. Text: `v=DMARC1; p=none; rua=mailto:dmarc@acchm.org`
5. TTL: `3600` (or Auto)
6. **Save**

**Status**: ☐ Not Started | ☐ In Progress | ☐ Completed | ☐ Skipped

---

### ☐ Step 9: Wait for DNS Propagation

DNS records can take time to propagate globally.

**Estimated Time**: 15-30 minutes (can be up to 24 hours)

**Check Propagation**:
- Use https://dnschecker.org
- Or use command line: `dig MX mail.accordandharmony.org`

**Actions While Waiting**:
- ☐ Upload code files (Step 10)
- ☐ Configure API key (Step 11)
- ☐ Prepare test plan

**Status**: ☐ Waiting | ☐ Propagated

---

## Code Deployment

### ☐ Step 10: Upload Files to Server

**Option A: FTP Client (Recommended)**

1. **Connect to FTP**:
   - Host: `ftp.accordandharmony.org` (or IP from Network Solutions)
   - Username: *(from Network Solutions)*
   - Password: *(from Network Solutions)*
   - Port: `21` (or `22` for SFTP)

2. **Navigate to** `public_html/` directory

3. **Upload the following files**:
   ```
   public_html/
   ├── api/
   │   ├── config.php
   │   ├── contact.php
   │   ├── newsletter.php
   │   └── lib/
   │       ├── resend.php
   │       ├── csrf.php
   │       └── ratelimit.php
   ```

4. **Set Permissions**:
   - Files (`.php`): `644` (read/write for owner, read for others)
   - Directories: `755` (read/write/execute for owner, read/execute for others)

**Files Uploaded**:
- ☐ `api/config.php`
- ☐ `api/contact.php`
- ☐ `api/newsletter.php`
- ☐ `api/lib/resend.php`
- ☐ `api/lib/csrf.php`
- ☐ `api/lib/ratelimit.php`

**Option B: Network Solutions File Manager**

1. Log into Network Solutions
2. Go to **Web Hosting** → **File Manager**
3. Navigate to `public_html/`
4. Create folder `api/`
5. Create subfolder `api/lib/`
6. Upload each file via the web interface

**Status**: ☐ Not Started | ☐ In Progress | ☐ Completed

---

### ☐ Step 11: Configure API Key

**Option A: Environment Variable (Most Secure - Recommended)**

1. Log into **cPanel** (if available from Network Solutions)
2. Navigate to **Software** → **Select PHP Version** → **Options**
3. Add variable:
   - Name: `RESEND_API_KEY`
   - Value: *(your API key from Step 2)*
4. Save

**Option B: Edit config.php (Less Secure - Testing Only)**

1. Open `public_html/api/config.php` in FTP or File Manager
2. Find line: `define('RESEND_API_KEY', getenv('RESEND_API_KEY') ?: 'YOUR_RESEND_API_KEY_HERE');`
3. Replace `YOUR_RESEND_API_KEY_HERE` with your actual API key
4. Save file
5. **⚠️ IMPORTANT**: Do NOT commit this file to git!

**Status**: ☐ Not Started | ☐ In Progress | ☐ Completed

---

### ☐ Step 12: Verify Domain in Resend

1. Go back to **Resend Dashboard** → **Domains**
2. Click on `mail.accordandharmony.org`
3. Click **Verify** or **Check DNS Records**
4. Wait for verification (may take a few minutes after DNS propagates)

**Verification Status**:
- ☐ MX Record: ✅ Verified
- ☐ SPF Record: ✅ Verified
- ☐ DKIM Record: ✅ Verified
- ☐ DMARC Record: ✅ Verified (if added)

**Overall Status**: ☐ Pending Verification | ☐ Verified

---

## Testing

### ☐ Step 13: Test API Endpoints Directly

**Test 1: Contact Form API**

```bash
curl -X POST https://accordandharmony.org/api/contact.php \
  -d "name=Test User" \
  -d "email=test@example.com" \
  -d "subject=Test Subject" \
  -d "message=This is a test message"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Thank you for your message! We'll get back to you soon."
}
```

**Result**: ☐ Pass | ☐ Fail

---

**Test 2: Newsletter API**

```bash
curl -X POST https://accordandharmony.org/api/newsletter.php \
  -d "email=test@example.com"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Thank you for subscribing! Check your email for confirmation."
}
```

**Result**: ☐ Pass | ☐ Fail

---

### ☐ Step 14: Test Via Website Forms

**Test Contact Form**:
1. Go to https://accordandharmony.org/contact.html
2. Fill out form:
   - Name: Test User
   - Email: *(your actual email)*
   - Subject: Test
   - Message: Testing contact form
3. Submit
4. Check for:
   - ☐ Success message displayed
   - ☐ Email received at `contact@acchm.org`
   - ☐ Reply-To header is correct
   - ☐ Email not in spam folder

**Test Newsletter Form**:
1. Go to https://accordandharmony.org/index.html
2. Scroll to newsletter section
3. Enter email: *(your actual email)*
4. Submit
5. Check for:
   - ☐ Success message displayed
   - ☐ Confirmation email received
   - ☐ Email not in spam folder

**Status**: ☐ Not Started | ☐ In Progress | ☐ Completed

---

### ☐ Step 15: Test Rate Limiting

1. Submit contact form **6 times quickly**
2. 6th submission should fail with:
   ```json
   {
     "success": false,
     "message": "Too many requests. Please try again later."
   }
   ```
3. Wait 1 hour OR change IP address to test again

**Result**: ☐ Rate limiting works | ☐ Not working | ☐ Skipped

**Status**: ☐ Not Started | ☐ In Progress | ☐ Completed

---

### ☐ Step 16: Check Email Deliverability

**Check 1: Spam Score**
- Use https://www.mail-tester.com
- Send test email to address provided
- Check score (should be 8/10 or higher)

**Score**: _____/10

**Check 2: SPF/DKIM/DMARC**
- View email source in Gmail/Outlook
- Look for authentication headers:
  ```
  spf=pass
  dkim=pass
  dmarc=pass
  ```

**Results**:
- ☐ SPF: Pass
- ☐ DKIM: Pass
- ☐ DMARC: Pass

**Status**: ☐ Not Started | ☐ In Progress | ☐ Completed

---

## Security Hardening

### ☐ Step 17: Add .htaccess Protection

Create or update `.htaccess` file:

```apache
# Prevent direct access to config files
<FilesMatch "^(config\.php)$">
    Order Allow,Deny
    Deny from all
</FilesMatch>

# Enable error logging
php_flag log_errors on
php_value error_log /path/to/logs/php_errors.log

# Disable directory listing
Options -Indexes
```

**Upload** to `public_html/api/.htaccess`

**Status**: ☐ Not Started | ☐ In Progress | ☐ Completed | ☐ Not Supported

---

### ☐ Step 18: Enable CSRF Protection (Optional)

If you want to enable CSRF tokens:

1. **Update Forms** to include CSRF token field
2. **Update `api/contact.php`**: Uncomment CSRF validation lines
3. **Update `api/newsletter.php`**: Uncomment CSRF validation lines
4. **Create token endpoint** (optional): `api/get-token.php`

**Status**: ☐ Implemented | ☐ Skipped for Now

---

### ☐ Step 19: Set Up Error Monitoring

1. **Check Error Logs**:
   - Location: `public_html/api/error.log`
   - Review for any issues

2. **Set Up Monitoring** (Optional):
   - Use Resend dashboard for bounce/complaint alerts
   - Set up email alerts for critical errors

**Status**: ☐ Not Started | ☐ In Progress | ☐ Completed

---

## Final Verification

### ☐ Step 20: End-to-End User Test

Simulate real user experience:

1. **Desktop Test**:
   - ☐ Visit contact page
   - ☐ Fill and submit form
   - ☐ Receive confirmation message
   - ☐ Admin receives email

2. **Mobile Test**:
   - ☐ Visit on mobile device
   - ☐ Fill and submit form
   - ☐ Receive confirmation message

3. **Newsletter Test**:
   - ☐ Subscribe on homepage
   - ☐ Receive confirmation email
   - ☐ Admin receives notification

**Status**: ☐ All Tests Pass | ☐ Issues Found

---

### ☐ Step 21: Document Configuration

Create internal documentation:

**Document the following**:
- ☐ Resend account login
- ☐ API key location (environment variable or config file)
- ☐ DNS records added (for future reference)
- ☐ FTP credentials location
- ☐ Admin email address for form submissions
- ☐ Any customizations made

**Save To**: Password manager, secure wiki, or encrypted file

**Status**: ☐ Not Started | ☐ In Progress | ☐ Completed

---

### ☐ Step 22: Backup Original Configuration

**Before going live**, backup current setup:

1. **Backup old HTML files** (if modified)
2. **Backup DNS records** (screenshot or export)
3. **Save old email configuration** (if any)

**Status**: ☐ Completed | ☐ Not Applicable

---

## Post-Migration Monitoring

### ☐ Step 23: Monitor First Week

**Daily Checks** (First 7 days):
- ☐ Day 1: Check Resend dashboard for email sends
- ☐ Day 2: Verify no bounce/complaints
- ☐ Day 3: Review error logs
- ☐ Day 4: Check spam reports
- ☐ Day 5: Monitor deliverability
- ☐ Day 6: Review rate limiting logs
- ☐ Day 7: Final health check

**Status**: ☐ In Progress | ☐ Completed

---

### ☐ Step 24: Optimize Based on Data

**After 1 Week**:
- ☐ Review Resend analytics
- ☐ Check open rates (if using tracking)
- ☐ Adjust rate limits if needed
- ☐ Update DMARC to `p=quarantine` (if everything working)
- ☐ Add more email templates if needed

**Status**: ☐ Not Started | ☐ In Progress | ☐ Completed

---

## Rollback Plan (If Needed)

### ☐ Emergency Rollback

If something goes wrong:

1. **Disable API Endpoints**:
   - Rename `api/` folder to `api_disabled/`
   - Forms will show error message

2. **Restore Old DNS** (if changed):
   - Remove MX records for subdomain
   - No changes to main domain, so receiving email should still work

3. **Contact Resend Support**:
   - support@resend.com
   - Provide details of issue

**Status**: ☐ Not Needed | ☐ Rollback In Progress | ☐ Rolled Back

---

## Completion Summary

### Final Checklist

- ☐ Resend account created and verified
- ☐ DNS records added and verified
- ☐ Code files uploaded and configured
- ☐ API key securely configured
- ☐ Contact form tested and working
- ☐ Newsletter form tested and working
- ☐ Rate limiting tested
- ☐ Email deliverability verified
- ☐ Security measures in place
- ☐ Documentation completed
- ☐ Monitoring established

**Migration Status**: ☐ In Progress | ☐ **COMPLETED** ✅

---

## Troubleshooting Guide

### Issue: "Resend API key not configured"

**Solution**:
- Check `api/config.php` - ensure API key is set
- If using environment variable, verify it's set in cPanel
- Test: `echo getenv('RESEND_API_KEY');` in PHP file

---

### Issue: "DNS records not verifying"

**Solution**:
- Wait 30-60 minutes for propagation
- Check records with: `dig TXT mail.accordandharmony.org`
- Ensure no typos in Host/Name fields
- Contact Network Solutions support if needed

---

### Issue: "Emails going to spam"

**Solution**:
- Verify SPF, DKIM, DMARC all pass
- Check sender reputation: https://mxtoolbox.com/blacklists.aspx
- Avoid spam trigger words in subject/content
- Ensure proper unsubscribe link in newsletter

---

### Issue: "Rate limiting not working"

**Solution**:
- Check `/tmp/ratelimit/` directory exists and is writable
- Verify server has write permissions
- Try alternative storage method (database or Redis)

---

### Issue: "CORS errors in browser"

**Solution**:
- Verify domain in `ALLOWED_ORIGINS` in `config.php`
- Check browser console for specific error
- Ensure CORS headers in PHP files
- Test with CORS disabled browser extension

---

## Support Contacts

**Resend Support**:
- Email: support@resend.com
- Docs: https://resend.com/docs
- Discord: https://resend.com/discord

**Network Solutions Support**:
- Phone: 1-800-333-7680
- Support: https://www.networksolutions.com/support/

**Emergency Contact**:
- Your IT support team
- Email: contact@acchm.org

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-15 | 1.0 | Initial migration checklist created |

---

**Last Updated**: November 15, 2025
**Next Review**: After successful migration
**Maintained By**: Accord and Harmony Foundation IT Team
