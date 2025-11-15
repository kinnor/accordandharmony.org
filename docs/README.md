# Documentation Index

This directory contains comprehensive documentation for the Accord and Harmony Foundation website email integration.

## 📚 Available Guides

### 1. [DNS Setup Guide](DNS-SETUP-GUIDE.md)
**Purpose**: Complete DNS configuration for Resend email integration

**Use this when**:
- Setting up email for the first time
- Troubleshooting email deliverability issues
- Verifying DNS records

**What's inside**:
- DNS records to add (MX, SPF, DKIM, DMARC)
- Network Solutions setup instructions
- Verification steps
- Troubleshooting common DNS issues

**Estimated time**: 30-60 minutes (including DNS propagation)

---

### 2. [Resend Integration Guide](RESEND-INTEGRATION.md)
**Purpose**: Technical implementation details for Resend API integration

**Use this when**:
- Implementing the email backend
- Understanding the code structure
- Customizing email functionality
- Debugging API issues

**What's inside**:
- Complete PHP backend code
- API client implementation
- Security features (CSRF, rate limiting)
- Testing procedures
- Alternative implementations (Node.js, serverless)

**Estimated time**: 2-3 hours

---

### 3. [Migration Checklist](MIGRATION-CHECKLIST.md)
**Purpose**: Step-by-step migration guide from non-functional to working email system

**Use this when**:
- Performing the complete migration
- Need a systematic approach
- Want to track progress
- Onboarding new team members

**What's inside**:
- Pre-migration preparation steps
- DNS configuration checklist
- Code deployment steps
- Testing procedures
- Post-migration monitoring
- Rollback plan

**Estimated time**: 2-4 hours (full migration)

---

## 🚀 Quick Start

### For First-Time Setup

1. **Start with**: [Migration Checklist](MIGRATION-CHECKLIST.md)
   - Follow the checklist from top to bottom
   - Check off items as you complete them
   - Don't skip steps

2. **Reference**: [DNS Setup Guide](DNS-SETUP-GUIDE.md)
   - Use this when you reach DNS configuration steps
   - Keep it open for DNS record values

3. **Deep Dive**: [Resend Integration Guide](RESEND-INTEGRATION.md)
   - Use this for technical details
   - Reference when customizing code

### For Troubleshooting

1. Check the relevant troubleshooting section in each guide:
   - DNS issues → [DNS Setup Guide - Troubleshooting](DNS-SETUP-GUIDE.md#common-issues--troubleshooting)
   - Email delivery → [DNS Setup Guide - Verification](DNS-SETUP-GUIDE.md#verification-steps)
   - Code errors → [Resend Integration Guide - Testing](RESEND-INTEGRATION.md#testing-checklist)
   - Overall process → [Migration Checklist - Rollback](MIGRATION-CHECKLIST.md#rollback-plan-if-needed)

---

## 📋 Documentation Overview

### Email Architecture

```
User fills out form
    ↓
Frontend (JavaScript) validates input
    ↓
POST to /api/contact.php or /api/newsletter.php
    ↓
PHP backend validates & sanitizes
    ↓
Rate limiting check
    ↓
Resend API sends email
    ↓
Success/error response to user
```

### Key Concepts

**Subdomain Strategy**:
- **Main domain** (`accordandharmony.org`): Keep for receiving email
- **Subdomain** (`mail.accordandharmony.org`): Use for sending via Resend
- **Benefit**: No disruption to existing email setup

**Security Layers**:
1. Input validation & sanitization
2. Rate limiting (5 requests/hour per IP)
3. CSRF protection (optional)
4. API key in environment variable
5. CORS restrictions

**Email Flow**:
- **Contact Form**: User → API → Resend → contact@acchm.org
- **Newsletter**: User → API → Resend → User (confirmation) + Admin (notification)

---

## 🔧 Maintenance

### Regular Tasks

**Weekly**:
- Check Resend dashboard for bounces/complaints
- Review error logs in `api/error.log`
- Monitor rate limiting effectiveness

**Monthly**:
- Review email deliverability metrics
- Check for DNS record changes
- Test forms on all devices

**Quarterly**:
- Rotate API keys
- Update dependencies (if using Node.js version)
- Review and update email templates

---

## 📞 Support

### Getting Help

1. **Check Documentation First**:
   - Search this folder for keywords
   - Review troubleshooting sections

2. **Resend Support**:
   - Email: support@resend.com
   - Docs: https://resend.com/docs
   - Discord: https://resend.com/discord

3. **Network Solutions Support**:
   - Phone: 1-800-333-7680
   - Support: https://www.networksolutions.com/support/

4. **Internal Contact**:
   - Email: contact@acchm.org

---

## 📝 Document Status

| Document | Last Updated | Status | Next Review |
|----------|--------------|--------|-------------|
| DNS Setup Guide | 2025-11-15 | ✅ Current | After migration |
| Resend Integration | 2025-11-15 | ✅ Current | After migration |
| Migration Checklist | 2025-11-15 | ✅ Current | After migration |

---

## 🎯 Success Criteria

Your email integration is successful when:

- ✅ Contact form sends emails to admin
- ✅ Newsletter sends confirmation to users
- ✅ No emails in spam folder
- ✅ SPF, DKIM, DMARC all pass
- ✅ Rate limiting prevents abuse
- ✅ Error logs are clean
- ✅ Deliverability score >8/10

---

## 🔐 Security Checklist

Before going live:

- [ ] API key is in environment variable (NOT hardcoded)
- [ ] `api/config.php` is in `.gitignore`
- [ ] CORS is restricted to your domain
- [ ] Rate limiting is enabled
- [ ] Input validation is working
- [ ] HTTPS is enabled on site
- [ ] Error display is disabled in production
- [ ] `.htaccess` protects config files

---

**Last Updated**: November 15, 2025
**Maintained By**: Accord and Harmony Foundation IT Team
**Contact**: contact@acchm.org
