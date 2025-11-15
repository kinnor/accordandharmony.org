# DNS Setup Guide for Resend Email Integration

## Overview

This guide documents the DNS configuration for integrating Resend email service with the **mail.accordandharmony.org** subdomain. Using a subdomain ensures your main domain's email receiving capabilities remain intact.

**Domain Strategy:**
- **Main Domain**: `accordandharmony.org` - Keep existing email setup (no changes to MX records)
- **Subdomain**: `mail.accordandharmony.org` - Use for sending transactional emails via Resend

---

## Why Use a Subdomain?

### Benefits:
1. **No Disruption**: Your current email receiving at `contact@acchm.org` continues to work
2. **Better Deliverability**: Dedicated subdomain for transactional emails improves sender reputation
3. **Isolation**: Issues with transactional email won't affect your main domain reputation
4. **Flexibility**: Can switch email providers without affecting main domain

### Email Configuration:
- **Send From**: `noreply@mail.accordandharmony.org` or `contact@mail.accordandharmony.org`
- **Reply-To Header**: `contact@acchm.org` (your actual email where you receive replies)

---

## DNS Records to Add

### Step 1: Get Your Resend DNS Records

1. Log into your Resend dashboard at https://resend.com/domains
2. Add the domain: `mail.accordandharmony.org`
3. Resend will provide you with specific DNS records. They will look similar to the examples below.

### Step 2: Add Records in Network Solutions

Log into Network Solutions DNS Manager and add the following records:

---

### Record 1: MX Records (Mail Exchange)

**Purpose**: Tells email servers where to route email for the subdomain

| Type | Host/Name | Priority | Points To / Value | TTL |
|------|-----------|----------|-------------------|-----|
| MX | mail | 10 | `feedback-smtp.us-east-1.amazonses.com` | 3600 |
| MX | mail | 20 | `feedback-smtp.us-east-2.amazonses.com` | 3600 |

**Important Notes:**
- Resend uses Amazon SES infrastructure
- The exact server names will be provided by Resend - use those instead of the examples above
- Priority 10 is primary, Priority 20 is backup
- "mail" is the subdomain prefix

---

### Record 2: SPF Record (Sender Policy Framework)

**Purpose**: Authorizes Resend to send email on behalf of your subdomain

| Type | Host/Name | Value | TTL |
|------|-----------|-------|-----|
| TXT | mail | `v=spf1 include:amazonses.com ~all` | 3600 |

**What this means:**
- `v=spf1` - SPF version 1
- `include:amazonses.com` - Allow Amazon SES (Resend's infrastructure) to send
- `~all` - Soft fail for other senders (won't reject, but marks as suspicious)

**Important**: Resend will provide the exact SPF record - it may include additional values

---

### Record 3: DKIM Records (DomainKeys Identified Mail)

**Purpose**: Cryptographic signature that proves emails are legitimate

Resend will provide 1-3 DKIM records that look like this:

**Example DKIM Record:**
| Type | Host/Name | Value | TTL |
|------|-----------|-------|-----|
| CNAME | `resend._domainkey.mail` | `resend._domainkey.mail.accordandharmony.org.amazonses.com` | 3600 |

**Or as TXT records:**
| Type | Host/Name | Value | TTL |
|------|-----------|-------|-----|
| TXT | `resend._domainkey.mail` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GN...` (long public key string) | 3600 |

**Important Notes:**
- Resend will provide the exact record(s) - they include long cryptographic keys
- Copy these exactly as provided
- Some providers give CNAME, others give TXT - use what Resend provides
- The selector name (`resend._domainkey`) may be different

---

### Record 4: DMARC Record (Optional but Recommended)

**Purpose**: Tells receiving servers how to handle emails that fail SPF/DKIM checks

| Type | Host/Name | Value | TTL |
|------|-----------|-------|-----|
| TXT | `_dmarc.mail` | `v=DMARC1; p=none; rua=mailto:dmarc@acchm.org` | 3600 |

**What this means:**
- `v=DMARC1` - DMARC version 1
- `p=none` - Monitor only, don't reject failed emails (recommended when starting)
- `rua=mailto:dmarc@acchm.org` - Send aggregate reports to this email

**After Testing (Optional):**
You can tighten the policy to:
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@acchm.org; pct=10
```
- `p=quarantine` - Mark failed emails as spam
- `pct=10` - Apply to 10% of emails (gradual rollout)

---

### Record 5: Custom Tracking Domain (Optional)

**Purpose**: Use your domain for email tracking links instead of Resend's domain

| Type | Host/Name | Points To | TTL |
|------|-----------|-----------|-----|
| CNAME | `track.mail` | `track.resend.com` | 3600 |

**Note**: Only add if you want branded tracking links like `track.mail.accordandharmony.org`

---

## Network Solutions Setup Instructions

### Method 1: Network Solutions Web Interface

1. **Login** to https://www.networksolutions.com/
2. Navigate to **My Account** > **Domain Names**
3. Click on **accordandharmony.org**
4. Click **Manage** > **Advanced DNS**
5. Click **Add Record**

**For MX Records:**
- Type: MX
- Host: mail
- Priority: 10
- Points To: (paste Resend's MX server)
- TTL: 3600 or Auto

**For TXT Records (SPF, DMARC):**
- Type: TXT
- Host: mail (or _dmarc.mail)
- Text: (paste the full value)
- TTL: 3600

**For CNAME Records (DKIM, Tracking):**
- Type: CNAME
- Host: resend._domainkey.mail
- Points To: (paste Resend's CNAME target)
- TTL: 3600

6. **Save** each record
7. Wait 15-30 minutes for DNS propagation

---

### Method 2: Network Solutions Advanced DNS (if available)

If Network Solutions provides a zone file editor:

```dns
; MX Records for mail subdomain
mail.accordandharmony.org.    3600    IN    MX    10 feedback-smtp.us-east-1.amazonses.com.
mail.accordandharmony.org.    3600    IN    MX    20 feedback-smtp.us-east-2.amazonses.com.

; SPF Record
mail.accordandharmony.org.    3600    IN    TXT    "v=spf1 include:amazonses.com ~all"

; DKIM Record (example - use actual from Resend)
resend._domainkey.mail.accordandharmony.org.    3600    IN    CNAME    resend._domainkey.mail.accordandharmony.org.amazonses.com.

; DMARC Record
_dmarc.mail.accordandharmony.org.    3600    IN    TXT    "v=DMARC1; p=none; rua=mailto:dmarc@acchm.org"
```

**Note**: Replace with actual values from Resend dashboard

---

## Verification Steps

### 1. Verify DNS Propagation

After adding records, check if they're live:

**Using Command Line:**
```bash
# Check MX records
dig MX mail.accordandharmony.org

# Check SPF record
dig TXT mail.accordandharmony.org

# Check DKIM record
dig TXT resend._domainkey.mail.accordandharmony.org

# Check DMARC record
dig TXT _dmarc.mail.accordandharmony.org
```

**Using Online Tools:**
- MXToolbox: https://mxtoolbox.com/SuperTool.aspx
- Google Admin Toolbox: https://toolbox.googleapps.com/apps/dig/
- DNS Checker: https://dnschecker.org/

### 2. Verify in Resend Dashboard

1. Go to https://resend.com/domains
2. Click on `mail.accordandharmony.org`
3. Check verification status for:
   - ✅ SPF Record
   - ✅ DKIM Record
   - ✅ DMARC Record (if added)
   - ✅ MX Record

**All should show green checkmarks**

### 3. Send Test Email

After verification passes, send a test email through Resend:

```bash
# Using Resend API
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "noreply@mail.accordandharmony.org",
    "to": "contact@acchm.org",
    "subject": "Test Email from Resend",
    "html": "<p>This is a test email!</p>"
  }'
```

Check your inbox at `contact@acchm.org` to confirm receipt.

---

## Common Issues & Troubleshooting

### Issue 1: Records Not Verifying
**Solution:**
- Wait 30-60 minutes for DNS propagation
- Some DNS providers cache records for up to 24 hours
- Check for typos in Host/Name fields
- Ensure no trailing dots in values (unless required)

### Issue 2: MX Record Shows Error
**Problem**: "Could not find a valid MX record"
**Solution:**
- Verify MX record points to correct server from Resend
- Check priority is set (usually 10)
- Ensure Host is `mail` not `mail.accordandharmony.org`

### Issue 3: SPF Record Invalid
**Problem**: "Multiple SPF records found" or "SPF syntax error"
**Solution:**
- Only one SPF record per domain/subdomain
- Check for syntax errors (must start with `v=spf1`)
- Ensure no extra spaces or line breaks

### Issue 4: DKIM Not Verifying
**Problem**: "DKIM record not found"
**Solution:**
- Double-check the selector name (e.g., `resend._domainkey.mail`)
- Verify CNAME points to correct target
- If TXT record, ensure entire key is copied (they're very long)
- Some providers strip whitespace - DKIM keys are case-sensitive

### Issue 5: Network Solutions Strips Special Characters
**Problem**: TXT records have quotes or semicolons stripped
**Solution:**
- Network Solutions usually handles quotes automatically
- Don't add extra quotes if the interface already shows them
- Contact Network Solutions support if records are malformed

---

## Security Best Practices

### 1. Protect Your Resend API Key
- Never commit API keys to git repositories
- Use environment variables in production
- Rotate keys periodically
- Use separate keys for development/production

### 2. Monitor Email Sending
- Set up DMARC reports to monitor unauthorized sending
- Review Resend dashboard for bounce/complaint rates
- Alert on unusual sending patterns

### 3. Rate Limiting
- Implement rate limiting on contact form (prevent spam)
- Add CSRF protection to forms
- Use Google reCAPTCHA v3 or hCaptcha

### 4. Data Privacy
- Don't log email addresses in server logs
- Hash/encrypt email addresses in database
- Implement unsubscribe for newsletter
- GDPR compliance for EU users

---

## DNS Record Reference Sheet

**Quick copy-paste reference (replace with actual values from Resend):**

```
# ==================================================
# DNS Records for mail.accordandharmony.org
# Provider: Resend
# Date Added: [DATE]
# ==================================================

# MX Records
Type: MX
Host: mail
Priority: 10
Value: [RESEND_MX_PRIMARY]
TTL: 3600

Type: MX
Host: mail
Priority: 20
Value: [RESEND_MX_BACKUP]
TTL: 3600

# SPF Record
Type: TXT
Host: mail
Value: v=spf1 include:amazonses.com ~all
TTL: 3600

# DKIM Record
Type: CNAME (or TXT - check Resend dashboard)
Host: [RESEND_DKIM_SELECTOR].mail
Value: [RESEND_DKIM_VALUE]
TTL: 3600

# DMARC Record
Type: TXT
Host: _dmarc.mail
Value: v=DMARC1; p=none; rua=mailto:dmarc@acchm.org
TTL: 3600
```

---

## Next Steps

After DNS is configured and verified:

1. ✅ Test sending emails from Resend dashboard
2. ✅ Integrate Resend API into website forms (see `RESEND-INTEGRATION.md`)
3. ✅ Set up CSRF protection
4. ✅ Add rate limiting to prevent abuse
5. ✅ Monitor deliverability in Resend dashboard
6. ✅ Set up email templates in Resend
7. ✅ Configure webhook for bounce/complaint handling

---

## Support Resources

**Resend Documentation:**
- Getting Started: https://resend.com/docs/send-with-nodejs
- Domain Verification: https://resend.com/docs/dashboard/domains/introduction
- DNS Setup: https://resend.com/docs/dashboard/domains/dns-records

**Network Solutions Support:**
- DNS Management: https://www.networksolutions.com/support/
- Contact Support: 1-800-333-7680

**Email Authentication Standards:**
- SPF: https://www.rfc-editor.org/rfc/rfc7208.html
- DKIM: https://www.rfc-editor.org/rfc/rfc6376.html
- DMARC: https://dmarc.org/overview/

---

## Change Log

| Date | Change | Updated By |
|------|--------|------------|
| 2025-11-15 | Initial DNS setup guide created | Claude |
| | Configured subdomain mail.accordandharmony.org | |
| | Added Resend DNS records | |

---

**Last Updated**: November 15, 2025
**Maintained By**: Accord and Harmony Foundation IT Team
**Contact**: contact@acchm.org
