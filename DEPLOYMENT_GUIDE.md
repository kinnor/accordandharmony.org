# Complete Deployment Guide
**Accord and Harmony Foundation Website**
**Last Updated:** November 2025

This guide will help you deploy your fully functional website to Network Solutions hosting with working forms and PayPal donations.

---

## 📋 Pre-Deployment Checklist

Before uploading, you need to configure a few settings:

### 1. Update Email Password

**File:** `php/config.php` (Line 23)

```php
define('SMTP_PASSWORD', 'YOUR_EMAIL_PASSWORD_HERE');
```

**Replace with:** Your actual email password for contact@acchm.org

### 2. Setup PayPal Account

**A. Create PayPal Business Account** (if not done)
1. Go to https://www.paypal.com/businessaccount
2. Sign up with: contact@acchm.org
3. Complete verification

**B. Get PayPal Client ID**
1. Go to https://developer.paypal.com/
2. Log in with your PayPal account
3. Click "Apps & Credentials"
4. Click "Create App"
5. App Name: "Accord Harmony Donations"
6. Copy the **Live Client ID**

**C. Update Website Files**

**File:** `donate.html` (Line 13)

```html
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_PAYPAL_CLIENT_ID&currency=EUR"></script>
```

**Replace:** `YOUR_PAYPAL_CLIENT_ID` with your actual Live Client ID

### 3. Update Bank Information (Optional)

**File:** `donate.html` (Lines 162-166)

Replace the placeholder bank information with your actual bank details:
```html
<p><strong>Bank Name:</strong> [Your Bank Name]</p>
<p><strong>Account Name:</strong> Accord and Harmony Foundation</p>
<p><strong>IBAN:</strong> [Your IBAN Number]</p>
<p><strong>BIC/SWIFT:</strong> [Your BIC/SWIFT Code]</p>
```

---

## 🚀 Deployment Steps

### Step 1: Upload Files to Server

**Upload these files/folders to your Network Solutions hosting:**

```
public_html/
├── index.html
├── about.html
├── contact.html
├── donate.html
├── gallery.html
├── donation-success.html
├── styles.css
├── script.js
├── paypal-donate.js
├── CLAUDE.md
├── README.md
├── images/
│   ├── logo.jpg
│   └── gallery/
│       ├── gallery-1.jpg through gallery-10.jpg
└── php/
    ├── config.php
    ├── newsletter-handler.php
    ├── contact-handler.php
    ├── donation-handler.php
    ├── paypal-config.php
    ├── paypal-notify.php
    └── get-csrf-token.php
```

**Upload Methods:**
- **FTP:** Use FileZilla or similar FTP client
- **cPanel File Manager:** Use web interface
- **Network Solutions File Manager:** Use dashboard

### Step 2: Set File Permissions

**Using FTP client or cPanel:**

- **Files:** Set to `644` (rw-r--r--)
- **Directories:** Set to `755` (rwxr-xr-x)
- **php/ directory:** Set to `755`

**Important:** Make sure `php/config.php` is NOT publicly readable for security

### Step 3: Create Error Log File

Create an empty file for logging:
```
php/error.log
```
Set permissions to `666` (rw-rw-rw-)

### Step 4: Test PHP Functionality

Create a test file: `test-php.php`

```php
<?php
phpinfo();
?>
```

Visit: `https://accordandharmony.org/test-php.php`

**Verify:**
- ✅ PHP version 7.4 or higher
- ✅ mail() function enabled
- ✅ curl extension enabled
- ✅ JSON extension enabled

**Delete this file after testing!**

---

## 📧 Email Configuration

Your email is already configured in `php/config.php`:

```php
Email: contact@acchm.org
SMTP Server: web-smtp-oxcs.hostingplatform.com
Port: 587
Encryption: TLS
```

**Test Email Sending:**

1. Go to: `https://accordandharmony.org/contact.html`
2. Fill out contact form
3. Submit
4. Check your inbox at contact@acchm.org

**If emails don't arrive:**
- Check spam/junk folder
- Verify password in `php/config.php`
- Check `php/error.log` for errors
- Contact Network Solutions support

---

## 💳 PayPal Setup

### For Quick Setup (Recommended for Testing)

1. **Sandbox Testing:**
   - Keep `PAYPAL_MODE = 'sandbox'` in `php/paypal-config.php`
   - Use sandbox credentials
   - Test donations with test accounts

2. **Go Live:**
   - Change to `PAYPAL_MODE = 'live'`
   - Update to live credentials
   - Test with small real donation (€1)

### Alternative: Simple Donation Buttons

If you prefer not to use API:

1. Go to PayPal account → Tools → PayPal Buttons
2. Create "Donate" button
3. Get button code
4. Replace PayPal Smart Buttons in `donate.html`

---

## 🔒 Security Configuration

### 1. CSRF Protection

Already enabled in `php/config.php`:
```php
define('ENABLE_CSRF_PROTECTION', true);
```

### 2. Rate Limiting

Already enabled:
```php
define('RATE_LIMIT_ENABLED', true);
define('MAX_REQUESTS_PER_HOUR', 5);
```

### 3. Hide Sensitive Files

Create `.htaccess` in root directory:

```apache
# Protect sensitive files
<FilesMatch "^(CLAUDE\.md|README\.md|DEPLOYMENT_GUIDE\.md|PAYPAL_SETUP\.md|TEST_REPORT\.md|\.git)">
    Order allow,deny
    Deny from all
</FilesMatch>

# Protect PHP config
<Files "config.php">
    Order allow,deny
    Deny from all
</Files>

# Protect log files
<Files "error.log">
    Order allow,deny
    Deny from all
</Files>

# Enable PHP error logging (but don't display errors)
php_flag display_errors Off
php_flag log_errors On
php_value error_log php/error.log
```

---

## ✅ Testing Checklist

Test each feature after deployment:

### Newsletter Form
- [ ] Go to homepage
- [ ] Enter email in newsletter form
- [ ] Submit form
- [ ] Check for success message
- [ ] Verify email received at contact@acchm.org

### Contact Form
- [ ] Go to contact page
- [ ] Fill out all fields
- [ ] Submit form
- [ ] Check for success message
- [ ] Verify email received
- [ ] Verify confirmation email sent to sender

### PayPal Donations
- [ ] Go to donate page
- [ ] Select amount (€10)
- [ ] Click amount button
- [ ] PayPal button appears
- [ ] Click PayPal button
- [ ] Complete payment (use Sandbox for testing)
- [ ] Redirected to success page
- [ ] Order ID displayed
- [ ] Email notification received

### Gallery
- [ ] Go to gallery page
- [ ] All 10 images load
- [ ] Images display correctly
- [ ] Responsive on mobile

---

## 🌐 DNS & Domain Configuration

Your domain `acchm.org` needs these DNS records:

### Already Configured Email (MX Records)
```
MX @ mx001.webcom.xion.oxcs.net (Priority: 10)
MX @ mx002.webcom.xion.oxcs.net (Priority: 10)
MX @ mx003.webcom.xion.oxcs.net (Priority: 10)
MX @ mx004.webcom.xion.oxcs.net (Priority: 10)
```

### SPF Record (for email)
```
TXT @ v=spf1 include:spf.cloudus.oxcs.net ~all
```

### Website (A Record)
Point to your Network Solutions server IP (check with hosting provider)

---

## 🔧 Troubleshooting

### Forms Not Submitting

**Symptoms:** Form submission doesn't work

**Solutions:**
1. Check browser console for JavaScript errors
2. Verify `script.js` is loading
3. Check PHP error log: `php/error.log`
4. Ensure PHP files have correct permissions

### Emails Not Sending

**Symptoms:** Form submits but no email received

**Solutions:**
1. Check spam folder
2. Verify SMTP password in `php/config.php`
3. Check `php/error.log`
4. Test with basic mail() function
5. Contact Network Solutions to verify SMTP settings

### PayPal Button Not Showing

**Symptoms:** PayPal button area is blank

**Solutions:**
1. Check browser console for errors
2. Verify Client ID in `donate.html`
3. Check if PayPal SDK is blocked (ad blockers)
4. Verify `paypal-donate.js` is loading
5. Check if amount is selected

### Images Not Loading

**Symptoms:** Broken images on gallery page

**Solutions:**
1. Verify `images/` folder uploaded
2. Check file permissions (644 for images)
3. Check image paths in HTML
4. Clear browser cache

---

## 📱 Mobile Testing

Test on these devices/browsers:
- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] iPad
- [ ] Desktop Chrome
- [ ] Desktop Firefox
- [ ] Desktop Edge

**Test:**
- Navigation menu (hamburger)
- Forms submission
- PayPal button
- Image loading
- Responsive layout

---

## 🎯 Go-Live Final Checklist

Before announcing your website:

- [ ] Email password updated in config.php
- [ ] PayPal Client ID updated (LIVE, not sandbox)
- [ ] PayPal mode set to 'live'
- [ ] Bank details updated (if using bank transfer)
- [ ] All forms tested and working
- [ ] PayPal donations tested with €1 transaction
- [ ] Emails being received at contact@acchm.org
- [ ] SSL certificate active (https://)
- [ ] Gallery images loading
- [ ] Mobile responsive
- [ ] .htaccess file in place
- [ ] test-php.php deleted
- [ ] Privacy policy page created (recommended)
- [ ] Google Analytics added (optional)

---

## 📊 Monitoring & Maintenance

### Check Weekly:
1. Test contact form
2. Check email deliverability
3. Review `php/error.log` for errors
4. Verify PayPal account for donations

### Check Monthly:
1. PayPal donation reports
2. Update PHP if needed
3. Backup website files
4. Review form submissions

### Annual Tasks:
1. Renew SSL certificate (usually auto)
2. Renew domain registration
3. Update copyright year in footer
4. Review and update content

---

## 🆘 Getting Help

### Website Issues
- Email: contact@acchm.org
- Phone: +359 (89) 609 7069

### Hosting Support
- Network Solutions Support
- Phone: Check your hosting dashboard
- Email: Via customer portal

### PayPal Support
- https://www.paypal.com/help
- Via PayPal Message Center

### Technical Documentation
- `README.md` - Basic site information
- `CLAUDE.md` - Developer guide
- `PAYPAL_SETUP.md` - PayPal integration details
- `TEST_REPORT.md` - Testing results

---

## 🎉 You're Ready!

Your website now has:
- ✅ Fully functional contact form with email notifications
- ✅ Newsletter subscription system
- ✅ PayPal donation integration
- ✅ Professional gallery with real images
- ✅ SMTP email delivery
- ✅ Security features (CSRF, rate limiting)
- ✅ Mobile-responsive design
- ✅ Proper error handling

**Launch your website and start making a difference!**

---

**Questions?** Email contact@acchm.org or call +359 (89) 609 7069

**Good luck with your mission to support education and families in Bulgaria!** 💚
