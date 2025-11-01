# PayPal Integration Setup Guide
**Accord and Harmony Foundation**

This guide will help you set up PayPal donations for your website. We've implemented two options - choose the one that works best for you.

---

## Option 1: Simple PayPal Donate Buttons (RECOMMENDED)

**Best for:** Quick setup, no technical knowledge required
**Cost:** 2.9% + €0.35 per transaction (standard PayPal fees)
**Setup Time:** 10-15 minutes

### Step 1: Create PayPal Business Account
1. Go to https://www.paypal.com/businessaccount
2. Click "Sign Up" for a Business Account
3. Fill in your organization details:
   - Business Name: Accord and Harmony Foundation
   - Email: contact@acchm.org
   - Phone: +359 (89) 609 7069
   - Address: Odrin 95 st, Sofia 1303, Bulgaria

### Step 2: Create Donate Buttons
1. Log in to your PayPal account
2. Go to: https://www.paypal.com/buttons/
3. Click "Create Button"
4. Select "Donations"
5. Fill in the details:
   - **Organization name:** Accord and Harmony Foundation
   - **Button ID:** Choose "Donate" or "Give"
   - **Currency:** EUR (Euro)
   - **Donation amounts:** Add preset amounts: €10, €25, €50, €100, €250

### Step 3: Get Button Code
1. After creating the button, PayPal will give you HTML code
2. Copy the code
3. Open `donate.html` in the website files
4. Find the section marked `<!-- PayPal Button Will Go Here -->`
5. Replace the placeholder with your PayPal button code

### Step 4: Configure IPN (Instant Payment Notification)
1. In PayPal, go to: Account Settings → Notifications → Instant payment notifications
2. Click "Update"
3. Enter Notification URL: `https://accordandharmony.org/php/paypal-ipn.php`
4. Enable IPN
5. Save

---

## Option 2: Advanced PayPal Integration (Custom)

**Best for:** Full control, custom donation flow, recurring donations
**Cost:** Same fees (2.9% + €0.35)
**Setup Time:** 30-45 minutes
**Requires:** Technical knowledge or developer help

### Step 1: Create PayPal Developer Account
1. Go to https://developer.paypal.com/
2. Log in with your PayPal Business account
3. Go to "Apps & Credentials"

### Step 2: Create App
1. Click "Create App"
2. App Name: "Accord and Harmony Donations"
3. App Type: "Merchant"
4. Click "Create App"

### Step 3: Get Credentials
1. You'll see two sets of credentials:
   - **Sandbox** (for testing)
   - **Live** (for production)
2. Copy both **Client ID** and **Secret**

### Step 4: Configure Website
1. Open `php/paypal-config.php`
2. Update the credentials:
   ```php
   define('PAYPAL_SANDBOX_CLIENT_ID', 'YOUR_SANDBOX_ID_HERE');
   define('PAYPAL_SANDBOX_SECRET', 'YOUR_SANDBOX_SECRET_HERE');
   define('PAYPAL_LIVE_CLIENT_ID', 'YOUR_LIVE_ID_HERE');
   define('PAYPAL_LIVE_SECRET', 'YOUR_LIVE_SECRET_HERE');
   define('PAYPAL_EMAIL', 'contact@acchm.org');
   ```

3. For testing, keep:
   ```php
   define('PAYPAL_MODE', 'sandbox');
   ```

4. For production, change to:
   ```php
   define('PAYPAL_MODE', 'live');
   ```

### Step 5: Update Return URLs
In `php/paypal-config.php`, update:
```php
define('PAYPAL_RETURN_URL', 'https://accordandharmony.org/donation-success.html');
define('PAYPAL_CANCEL_URL', 'https://accordandharmony.org/donate.html?cancelled=1');
```

---

## Current Implementation

The website currently uses **PayPal Smart Payment Buttons** which provides:
- ✅ One-time donations
- ✅ Recurring donations (monthly subscriptions)
- ✅ Multiple currency support (EUR, USD, GBP)
- ✅ Mobile-optimized checkout
- ✅ No redirect required
- ✅ Instant confirmation

### Files Included:
- `donate.html` - Donation page with PayPal buttons
- `php/paypal-config.php` - PayPal configuration
- `php/paypal-create-order.php` - Creates PayPal order
- `php/paypal-capture-order.php` - Captures completed payment
- `php/paypal-ipn.php` - Handles payment notifications
- `script.js` - Updated with PayPal integration

---

## Testing Your Integration

### Sandbox Testing (Before Going Live)
1. Use PayPal sandbox accounts: https://developer.paypal.com/developer/accounts/
2. Create a test buyer account
3. Make test donations
4. Verify emails are sent
5. Check PayPal dashboard for test transactions

### Test Card Numbers (Sandbox):
- **Visa:** 4111 1111 1111 1111
- **Mastercard:** 5555 5555 5555 4444
- **AmEx:** 3782 822463 10005
- **Expiry:** Any future date
- **CVV:** Any 3 digits

---

## Recurring Donations Setup

For monthly recurring donations:

1. In PayPal account, go to Products & Services → Subscriptions
2. Create subscription plans:
   - €10/month - "Monthly Supporter"
   - €25/month - "Dedicated Partner"
   - €50/month - "Champion Circle"

3. Get subscription button codes or use PayPal SDK

The website is already configured to support recurring donations!

---

## Security & Compliance

### PCI Compliance
✅ **You don't need PCI compliance** because PayPal handles all payment processing. Your website never sees credit card data.

### GDPR Compliance
Ensure you have:
- Privacy Policy (mention PayPal data processing)
- Cookie Policy (PayPal may set cookies)
- Terms of Service

### Tax Receipts
As a non-profit, you may want to:
1. Set up automatic email receipts through PayPal
2. Use PayPal's reporting to generate annual tax documents
3. Keep records of all donations for Bulgarian tax authorities

---

## Fees & Costs

### Standard Fees (Bulgaria/Europe)
- **Donation Fee:** 2.9% + €0.35 per transaction
- **Monthly Fee:** €0 (no subscription required)
- **Setup Fee:** €0

### Example:
- €100 donation = €2.90 + €0.35 = €3.25 fee
- **You receive:** €96.75

### Lower Fees for Non-Profits
PayPal offers **reduced fees** for registered non-profits:
- **Reduced Rate:** 1.9% + €0.35 (instead of 2.9%)
- **Apply here:** https://www.paypal.com/nonprofits

**To Apply:**
1. Register at PayPal Giving Fund
2. Submit proof of non-profit status
3. Provide: ЕИК BG 207609600
4. Wait for approval (usually 1-2 weeks)

**Potential Savings:**
- €100 donation with non-profit rate = €1.90 + €0.35 = €2.25 fee
- **You receive:** €97.75
- **Savings:** €1.00 per €100 donation

---

## Troubleshooting

### Common Issues:

**Problem:** Button doesn't show
- **Solution:** Check if PayPal Client ID is correct in donate.html

**Problem:** Payment succeeds but no email received
- **Solution:** Check spam folder, verify email in php/config.php

**Problem:** "Sandbox/Live mismatch" error
- **Solution:** Make sure PAYPAL_MODE matches your credentials (sandbox vs live)

**Problem:** IPN not working
- **Solution:** Verify IPN URL is correct and server can receive POST requests

---

## Going Live Checklist

Before accepting real donations:

- [ ] PayPal Business account verified
- [ ] Bank account linked to PayPal
- [ ] Test donations in sandbox mode
- [ ] Update PAYPAL_MODE to 'live'
- [ ] Update PayPal credentials to LIVE credentials
- [ ] Update return URLs to production domain
- [ ] Test with small real donation (€1)
- [ ] Verify email notifications work
- [ ] Check PayPal dashboard shows transaction
- [ ] Applied for non-profit reduced fees (optional)

---

## Support

### PayPal Support
- Website: https://www.paypal.com/help
- Phone (Bulgaria): Check PayPal website for local number
- Email: Via PayPal Message Center

### Integration Help
- PayPal Developer Docs: https://developer.paypal.com/docs/
- Community Forum: https://www.paypal-community.com/

---

## Alternative: Bank Transfer Info

If you want to also accept direct bank transfers, add this to donation-success.html:

```html
<div class="bank-info">
    <h3>Or Donate via Bank Transfer</h3>
    <p><strong>Bank Name:</strong> [Your Bank]</p>
    <p><strong>Account Name:</strong> Accord and Harmony Foundation</p>
    <p><strong>IBAN:</strong> [Your IBAN]</p>
    <p><strong>BIC/SWIFT:</strong> [Your BIC/SWIFT]</p>
    <p><strong>Reference:</strong> Donation - [Donor Name]</p>
</div>
```

---

**Last Updated:** November 2025
**For Questions:** contact@acchm.org or +359 (89) 609 7069
