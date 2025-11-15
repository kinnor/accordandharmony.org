# Email System Documentation

## Overview

A simple, reusable email sending system integrated into the Accord and Harmony Foundation website. The system uses Resend API for reliable email delivery and supports multiple email types with bilingual templates.

## Features

- ✅ **Simple Integration**: Reusable email client for all Workers
- ✅ **Multiple Email Types**: Notifications, welcome emails, contact forms, book purchases
- ✅ **Bilingual Support**: English, German, French, Bulgarian
- ✅ **Professional Templates**: Responsive HTML emails with foundation branding
- ✅ **Test Interface**: Web-based email testing tool (`test-email.html`)
- ✅ **Error Handling**: Comprehensive error handling and logging

## File Structure

```
workers/src/
├── email-client.js          # Core email sending functionality
├── test-email.js            # Test email endpoint handler
├── book-purchase.js         # Uses email client for book emails
└── index.js                 # Routes test email endpoint

accordandharmony-fresh/
└── test-email.html           # Web interface for testing emails
```

## Email Client API

### Core Functions

#### `sendEmail(params, apiKey)`

Send a basic email via Resend.

```javascript
import { sendEmail } from './email-client.js';

const result = await sendEmail({
    to: 'recipient@example.com',
    subject: 'Hello World',
    html: '<h1>Hello!</h1><p>This is a test email.</p>',
    from: 'Custom Sender <sender@accordandharmony.org>' // Optional
}, env.RESEND_API_KEY);

if (result.success) {
    console.log('Email sent!', result.messageId);
} else {
    console.error('Failed:', result.error);
}
```

**Parameters:**
- `params.to` (string|array): Recipient email(s)
- `params.subject` (string): Email subject
- `params.html` (string): HTML content
- `params.from` (string, optional): Sender (defaults to noreply@accordandharmony.org)
- `apiKey` (string): Resend API key

**Returns:**
```javascript
{
    success: boolean,
    messageId?: string,  // Resend message ID
    error?: string       // Error message if failed
}
```

---

#### `sendNotification(params, apiKey)`

Send a simple notification email with optional button.

```javascript
import { sendNotification } from './email-client.js';

await sendNotification({
    to: 'user@example.com',
    subject: 'Payment Received',
    message: 'Thank you for your donation of $25!\n\nYour support helps children in need.',
    buttonText: 'View Receipt',
    buttonUrl: 'https://accordandharmony.org/receipt/123'
}, env.RESEND_API_KEY);
```

**Parameters:**
- `params.to` (string): Recipient email
- `params.subject` (string): Email subject
- `params.message` (string): Plain text message (newlines converted to `<br>`)
- `params.buttonText` (string, optional): CTA button text
- `params.buttonUrl` (string, optional): CTA button URL
- `apiKey` (string): Resend API key

---

#### `sendWelcomeEmail(params, apiKey)`

Send a multilingual welcome email.

```javascript
import { sendWelcomeEmail } from './email-client.js';

await sendWelcomeEmail({
    to: 'newuser@example.com',
    name: 'John Doe',
    language: 'de'  // en, de, fr, bg
}, env.RESEND_API_KEY);
```

**Supported Languages:**
- `en` - English
- `de` - German (Deutsch)
- `fr` - French (Français)
- `bg` - Bulgarian (Български)

---

#### `sendContactNotification(params, adminEmail, apiKey)`

Send contact form notification to admin.

```javascript
import { sendContactNotification } from './email-client.js';

await sendContactNotification({
    name: 'Jane Smith',
    email: 'jane@example.com',
    message: 'I would like to learn more about your programs.'
}, 'admin@acchm.org', env.RESEND_API_KEY);
```

---

#### `buildSimpleEmailTemplate(params)`

Build a professional HTML email template.

```javascript
import { buildSimpleEmailTemplate } from './email-client.js';

const html = buildSimpleEmailTemplate({
    title: 'Welcome!',
    content: '<p>Thank you for joining us!</p>',
    buttonText: 'Get Started',
    buttonUrl: 'https://accordandharmony.org/start',
    footer: '<p>Custom footer content</p>' // Optional
});
```

## Testing the Email System

### Option 1: Web Interface (Recommended)

1. **Open the test page:**
   ```
   Open: accordandharmony-fresh/test-email.html
   ```

2. **Configure settings:**
   - Email Type: Select from dropdown (Simple, Welcome, Contact, Book Purchase)
   - Recipient: Email address to receive test
   - Name: Recipient name
   - Language: Select language for templates

3. **Send test email:**
   - Click "Send Test Email"
   - Check recipient inbox (and spam folder!)

### Option 2: Command Line Test

Run the standalone test script:

```bash
cd workers
RESEND_API_KEY=re_xxxxx node send-test-email.js
```

This sends a book purchase test email to **rossen@kinov.com**.

### Option 3: API Request

```bash
curl -X POST https://accordandharmony.org/api/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "welcome",
    "to": "rossen@kinov.com",
    "name": "Rossen Kinov",
    "language": "en"
  }'
```

## Email Types

### 1. Simple Notification

Basic email with custom subject and message.

**Use case:** Order confirmations, payment receipts, system notifications

**Example:**
```javascript
await sendNotification({
    to: 'user@example.com',
    subject: 'Donation Received',
    message: 'Thank you for your $50 donation!',
    buttonText: 'View Receipt',
    buttonUrl: 'https://accordandharmony.org/receipt'
}, env.RESEND_API_KEY);
```

### 2. Welcome Email

Multilingual welcome email with foundation information.

**Use case:** New newsletter subscribers, new donors

**Templates:** English, German, French, Bulgarian

**Example:**
```javascript
await sendWelcomeEmail({
    to: 'newuser@example.com',
    name: 'Maria Schmidt',
    language: 'de'
}, env.RESEND_API_KEY);
```

### 3. Contact Form Notification

Sends user's contact form message to admin.

**Use case:** Contact form submissions

**Example:**
```javascript
await sendContactNotification({
    name: 'John Doe',
    email: 'john@example.com',
    message: 'Question about volunteering opportunities.'
}, 'contact@acchm.org', env.RESEND_API_KEY);
```

### 4. Book Purchase Email

Complete book purchase email with watermark info, receipt, and download link.

**Use case:** Jazz Trumpet Master Class purchases

**Features:**
- Tax-deductible receipt
- Secure download link
- Bilingual (user's language + English)
- Watermark information

**Example:** See `workers/src/book-purchase.js`

## Setup Instructions

### 1. Get Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Create an API key
3. Verify your sending domain (accordandharmony.org)

### 2. Configure Cloudflare Worker

Set the `RESEND_API_KEY` environment variable:

**Via Dashboard:**
1. Go to Cloudflare Dashboard > Workers
2. Select your worker
3. Settings > Variables
4. Add `RESEND_API_KEY` as a secret

**Via Wrangler:**
```bash
npx wrangler secret put RESEND_API_KEY
# Paste your API key when prompted
```

### 3. Deploy Worker

```bash
cd workers
npm run deploy
```

### 4. Test Email System

Open `test-email.html` in your browser and send a test email to verify everything works.

## Integration Examples

### Newsletter Subscription

```javascript
// In newsletter.js
import { sendWelcomeEmail } from './email-client.js';

export async function handleNewsletter(request, env) {
    const { email, name, language } = await request.json();

    // Save to database...

    // Send welcome email
    await sendWelcomeEmail({ to: email, name, language }, env.RESEND_API_KEY);

    return jsonResponse(true, 'Subscribed successfully!');
}
```

### Contact Form

```javascript
// In contact.js
import { sendContactNotification } from './email-client.js';

export async function handleContact(request, env) {
    const { name, email, message } = await request.json();

    // Send to admin
    await sendContactNotification(
        { name, email, message },
        env.TO_EMAIL || 'contact@acchm.org',
        env.RESEND_API_KEY
    );

    return jsonResponse(true, 'Message sent!');
}
```

### Custom Email

```javascript
import { sendEmail, buildSimpleEmailTemplate } from './email-client.js';

const html = buildSimpleEmailTemplate({
    title: 'Custom Event Invitation',
    content: `
        <p>Dear ${userName},</p>
        <p>You're invited to our charity concert on March 15th!</p>
        <p>We hope to see you there.</p>
    `,
    buttonText: 'RSVP Now',
    buttonUrl: 'https://accordandharmony.org/events/rsvp'
});

await sendEmail({
    to: userEmail,
    subject: 'You\'re Invited!',
    html
}, env.RESEND_API_KEY);
```

## Email Template Customization

All emails use the foundation's branding:

**Colors:**
- Primary: `#2E9DD8` (Sky Blue)
- Secondary: `#1B76A8` (Deep Blue)
- Accent: `#6B5B4E` (Bronze)

**Fonts:**
- Sans-serif (Arial, Segoe UI)

**Structure:**
- Header with gradient background
- White content area
- Optional call-to-action button
- Footer with contact information

To customize, edit `buildSimpleEmailTemplate()` in `email-client.js`.

## Troubleshooting

### Email not received

1. **Check spam folder** - First place to look
2. **Verify RESEND_API_KEY** - Make sure it's set correctly
3. **Check Resend dashboard** - View delivery logs
4. **Verify sender domain** - Must be verified in Resend

### Email delivery failed

1. **Check Worker logs:**
   ```bash
   npx wrangler tail
   ```

2. **Verify email format:**
   ```javascript
   import { validateEmail } from './utils.js';
   if (!validateEmail(email)) {
       // Invalid email
   }
   ```

3. **Check Resend API response:**
   ```javascript
   const result = await sendEmail(...);
   if (!result.success) {
       console.error('Email error:', result.error);
   }
   ```

### Rate limits

Resend free tier limits:
- **3,000 emails/month**
- **100 emails/day**

Upgrade to paid plan for higher limits.

## Security Best Practices

1. **Never expose API key** - Always use environment variables
2. **Validate email addresses** - Use `validateEmail()` from utils.js
3. **Sanitize content** - Escape HTML in user-provided content
4. **Rate limiting** - Implement rate limiting for public endpoints
5. **HTTPS only** - All email endpoints should require HTTPS

## Monitoring

### Check delivery status

View real-time delivery logs in [Resend Dashboard](https://resend.com/emails).

### Monitor Worker logs

```bash
npx wrangler tail
```

### Track metrics

Monitor:
- Email send success rate
- Delivery time
- Bounce rate
- Open rate (if enabled in Resend)

## Next Steps

1. ✅ Test email system with `test-email.html`
2. ✅ Send test email to rossen@kinov.com
3. ⏳ Integrate email notifications into all forms
4. ⏳ Add book purchase email integration
5. ⏳ Monitor delivery rates in Resend dashboard

## Support

For questions or issues:
- Email: contact@acchm.org
- Check Worker logs: `npx wrangler tail`
- Review Resend dashboard: [resend.com/emails](https://resend.com/emails)
