/**
 * Newsletter Subscription Handler (Cloudflare Worker)
 * Converted from php/newsletter-handler.php
 */

import { sanitizeInput, validateEmail, sendEmail, jsonResponse, handleCORS } from './utils.js';

export async function handleNewsletter(request, env) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCORS();
  }

  // Only allow POST requests
  if (request.method !== 'POST') {
    return jsonResponse(false, 'Invalid request method', {}, 405);
  }

  try {
    // Parse form data
    const formData = await request.formData();
    const email = sanitizeInput(formData.get('email'));
    const csrfToken = formData.get('csrf_token');

    // Note: CSRF validation would require session storage
    // For Cloudflare Workers, consider using encrypted tokens or skip for now
    // In production, use Cloudflare Turnstile for bot protection

    // Validate email
    if (!email) {
      return jsonResponse(false, 'Please enter your email address.', {}, 400);
    }

    if (!validateEmail(email)) {
      return jsonResponse(false, 'Please enter a valid email address.', {}, 400);
    }

    // Get client IP for rate limiting
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

    // Prepare email to admin
    const subject = `New Newsletter Subscription - ${env.SITE_NAME || 'Accord and Harmony Foundation'}`;
    const adminMessage = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1684C9; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .info-row { margin-bottom: 15px; }
        .label { font-weight: bold; color: #1684C9; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>New Newsletter Subscription</h2>
        </div>
        <div class="content">
            <div class="info-row">
                <span class="label">Email Address:</span><br>
                ${email}
            </div>
            <div class="info-row">
                <span class="label">Date:</span><br>
                ${new Date().toLocaleString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  hour12: true
                })}
            </div>
            <div class="info-row">
                <span class="label">IP Address:</span><br>
                ${clientIP}
            </div>
        </div>
        <div class="footer">
            <p>This email was sent from the newsletter subscription form on ${env.SITE_NAME || 'Accord and Harmony Foundation'}</p>
        </div>
    </div>
</body>
</html>
`;

    // Send email to admin
    const emailSent = await sendEmail(
      env.TO_EMAIL || 'contact@acchm.org',
      subject,
      adminMessage,
      env
    );

    // Send confirmation email to subscriber
    const confirmSubject = `Thank You for Subscribing - ${env.SITE_NAME || 'Accord and Harmony Foundation'}`;
    const confirmMessage = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1684C9; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .button { display: inline-block; padding: 12px 30px; background-color: #1684C9; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Welcome to Our Newsletter!</h2>
        </div>
        <div class="content">
            <p>Dear Subscriber,</p>
            <p>Thank you for subscribing to the <strong>${env.SITE_NAME || 'Accord and Harmony Foundation'}</strong> newsletter!</p>
            <p>You will now receive updates about our latest initiatives, impact stories, and ways to get involved in supporting those in need and championing children's education across Bulgaria.</p>
            <p>If you have any questions, feel free to contact us at <a href="mailto:${env.REPLY_TO_EMAIL || 'contact@acchm.org'}">${env.REPLY_TO_EMAIL || 'contact@acchm.org'}</a></p>
            <p style="margin-top: 30px;">With gratitude,<br><strong>The ${env.SITE_NAME || 'Accord and Harmony Foundation'} Team</strong></p>
        </div>
        <div class="footer">
            <p>Accord and Harmony Foundation<br>
            Odrin 95 st, Sofia 1303, Bulgaria<br>
            Phone: +359 (89) 609 7069</p>
        </div>
    </div>
</body>
</html>
`;

    await sendEmail(
      email,
      confirmSubject,
      confirmMessage,
      env
    );

    return jsonResponse(true, 'Thank you for subscribing! You will receive our newsletter soon.', {
      email: email
    });

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return jsonResponse(false, 'An error occurred. Please try again later.', {}, 500);
  }
}
