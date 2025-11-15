# Resend DNS Setup for accordandharmony.org

## Current Status

✅ **Working:** Using `onboarding@resend.dev` test domain
⏳ **Pending:** Verify `accordandharmony.org` to use `noreply@accordandharmony.org`

## Why Verify Your Domain?

Currently emails are sent from `onboarding@resend.dev` which works for testing but:
- Recipients see "from: Accord and Harmony Foundation <onboarding@resend.dev>"
- Looks less professional
- Some spam filters may flag it

After verification, emails will come from:
- "from: Accord and Harmony Foundation <noreply@accordandharmony.org>"
- Better deliverability
- More professional appearance

## DNS Records to Add

You need to add these records to your **Network Solutions DNS settings** for accordandharmony.org:

### 1. Domain Verification (DKIM) - Required

**Type:** TXT
**Name/Host:** `resend._domainkey`
**Value/Content:**
```
p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDNXPYbBoK46fe2HGVnXjjtA8KLWZPuBT1yLq4MkdxyrTMsfZlESQ1AqHmmsaBZXLN56eosaERqFfM820GO+xIxAoRdMhp+FSDNj7fkGFMyYNc50pZ7E/5HVBzncIZd+hgOVa3x2WuIXtUBm/o1td2NrxpiV2RC58GPNjy7+DucFwIDAQAB
```
**TTL:** 3600 (or Auto)

---

### 2. Enable Sending - SPF (Required)

**Type:** MX
**Name/Host:** `send` (creates send.accordandharmony.org)
**Value/Content:** `feedback-smtp.us-east-1.amazonses.com`
**Priority:** 10
**TTL:** 3600 (or Auto)

**Type:** TXT
**Name/Host:** `send`
**Value/Content:** `v=spf1 include:amazonses.com ~all`
**TTL:** 3600 (or Auto)

---

### 3. DMARC (Optional but Recommended)

**Type:** TXT
**Name/Host:** `_dmarc`
**Value/Content:** `v=DMARC1; p=none;`
**TTL:** 3600 (or Auto)

---

## How to Add DNS Records in Network Solutions

### Step-by-Step:

1. **Log in to Network Solutions**
   - Go to https://www.networksolutions.com
   - Sign in with your account

2. **Navigate to DNS Management**
   - My Account → Account Manager
   - Find "accordandharmony.org"
   - Click "Manage" → "Change Where Domain Points"
   - Select "Advanced DNS"

3. **Add TXT Record for DKIM**
   - Click "Add Record"
   - Type: TXT
   - Host: `resend._domainkey`
   - Text: (paste the DKIM value from above)
   - TTL: 3600
   - Save

4. **Add MX Record for Sending**
   - Click "Add Record"
   - Type: MX
   - Host: `send`
   - Mail Server: `feedback-smtp.us-east-1.amazonses.com`
   - Priority: 10
   - TTL: 3600
   - Save

5. **Add TXT Record for SPF**
   - Click "Add Record"
   - Type: TXT
   - Host: `send`
   - Text: `v=spf1 include:amazonses.com ~all`
   - TTL: 3600
   - Save

6. **Add TXT Record for DMARC (Optional)**
   - Click "Add Record"
   - Type: TXT
   - Host: `_dmarc`
   - Text: `v=DMARC1; p=none;`
   - TTL: 3600
   - Save

7. **Wait for Propagation**
   - DNS changes can take 5 minutes to 48 hours
   - Usually takes 15-30 minutes

8. **Verify in Resend**
   - Go back to https://resend.com/domains
   - Click "Verify" next to each record
   - Once all show ✅ green checkmarks, you're done!

---

## After Verification

Once your domain is verified, update the email client:

**Edit:** `workers/src/email-client.js`

**Change line 26 from:**
```javascript
const sender = from || 'Accord and Harmony Foundation <onboarding@resend.dev>';
```

**To:**
```javascript
const sender = from || 'Accord and Harmony Foundation <noreply@accordandharmony.org>';
```

Then redeploy:
```bash
cd workers
npm run deploy
```

---

## Testing After Verification

Send another test email:
```bash
cd workers
RESEND_API_KEY=re_NzhRQAfU_NvnTCG8GSx9Q3gP4PFnQZh1M node send-test-email.js
```

The email should now come from `noreply@accordandharmony.org`!

---

## Troubleshooting

### DNS records not verifying?

1. **Check the format:** Make sure there are no extra spaces or quotes
2. **Wait longer:** DNS can take up to 48 hours to propagate
3. **Use DNS checker:** https://dnschecker.org to see if records are visible
4. **Contact support:** Network Solutions support can help add records

### Still getting "domain not verified" error?

- Make sure ALL required records are added (DKIM, MX for send, TXT for send)
- Wait at least 30 minutes after adding records
- Click "Verify" in Resend dashboard after waiting

---

## Need Help?

- **Resend Support:** https://resend.com/support
- **Network Solutions Support:** https://www.networksolutions.com/support
- **DNS Checker Tool:** https://dnschecker.org

---

## Summary

**Current Setup (Working):**
- ✅ Emails sent from `onboarding@resend.dev`
- ✅ Test email successfully sent to rossen.kinov@gmail.com
- ✅ Email system fully functional

**Next Step (Optional but Recommended):**
- Add DNS records to Network Solutions
- Verify domain in Resend
- Update sender to `noreply@accordandharmony.org`
- Professional branded emails!

**Don't worry about this right now** - your email system is already working with the test domain. You can verify the real domain whenever you're ready!
