/**
 * Contact Form Handler (Cloudflare Worker)
 * Converted from php/contact-handler.php
 */

import { sanitizeInput, validateEmail, sendEmail, jsonResponse, handleCORS } from './utils.js';

export async function handleContact(request, env) {
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
    const name = sanitizeInput(formData.get('name'));
    const email = sanitizeInput(formData.get('email'));
    const subject = sanitizeInput(formData.get('subject'));
    const message = sanitizeInput(formData.get('message'));

    // Validate required fields
    const errors = [];

    if (!name) {
      errors.push('Name is required');
    }

    if (!email) {
      errors.push('Email is required');
    } else if (!validateEmail(email)) {
      errors.push('Please enter a valid email address');
    }

    if (!subject) {
      errors.push('Subject is required');
    }

    if (!message) {
      errors.push('Message is required');
    }

    if (errors.length > 0) {
      return jsonResponse(false, errors.join(', '), {}, 400);
    }

    // Get client IP
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const currentDate = new Date().toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });

    // Prepare email to admin
    const emailSubject = `New Contact Form Submission - ${subject}`;
    const emailMessage = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1684C9; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .info-row { margin-bottom: 20px; }
        .label { font-weight: bold; color: #1684C9; margin-bottom: 5px; display: block; }
        .value { background-color: white; padding: 10px; border-left: 3px solid #96CDD4; }
        .message-box { background-color: white; padding: 15px; border-left: 3px solid #96CDD4; white-space: pre-wrap; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>New Contact Form Submission</h2>
        </div>
        <div class="content">
            <div class="info-row">
                <span class="label">Name:</span>
                <div class="value">${name}</div>
            </div>
            <div class="info-row">
                <span class="label">Email:</span>
                <div class="value"><a href="mailto:${email}">${email}</a></div>
            </div>
            <div class="info-row">
                <span class="label">Subject:</span>
                <div class="value">${subject}</div>
            </div>
            <div class="info-row">
                <span class="label">Message:</span>
                <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
            </div>
            <div class="info-row">
                <span class="label">Submitted:</span>
                <div class="value">${currentDate}</div>
            </div>
            <div class="info-row">
                <span class="label">IP Address:</span>
                <div class="value">${clientIP}</div>
            </div>
        </div>
        <div class="footer">
            <p>This email was sent from the contact form on ${env.SITE_NAME || 'Accord and Harmony Foundation'}</p>
            <p>To reply, send an email to: <a href="mailto:${email}">${email}</a></p>
        </div>
    </div>
</body>
</html>
`;

    // Send email to admin (with Reply-To header)
    const emailSent = await sendEmail(
      env.TO_EMAIL || 'contact@acchm.org',
      emailSubject,
      emailMessage,
      env,
      email // Reply-To
    );

    if (!emailSent) {
      return jsonResponse(
        false,
        `Sorry, there was an error sending your message. Please try again or email us directly at ${env.TO_EMAIL || 'contact@acchm.org'}`,
        {},
        500
      );
    }

    // Send confirmation email to sender
    const confirmSubject = `Thank You for Contacting Us - ${env.SITE_NAME || 'Accord and Harmony Foundation'}`;
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
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Thank You for Contacting Us</h2>
        </div>
        <div class="content">
            <p>Dear ${name},</p>
            <p>Thank you for reaching out to <strong>${env.SITE_NAME || 'Accord and Harmony Foundation'}</strong>. We have received your message and will respond within 24 hours.</p>
            <p><strong>Your message details:</strong></p>
            <div style="background-color: white; padding: 15px; border-left: 3px solid #96CDD4; margin: 20px 0;">
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong><br>${message.replace(/\n/g, '<br>')}</p>
            </div>
            <p>If you need immediate assistance, you can also reach us at:</p>
            <ul>
                <li>Phone: <a href="tel:+359896097069">+359 (89) 609 7069</a></li>
                <li>Email: <a href="mailto:${env.TO_EMAIL || 'contact@acchm.org'}">${env.TO_EMAIL || 'contact@acchm.org'}</a></li>
            </ul>
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

    return jsonResponse(true, 'Thank you for your message! We will get back to you soon.', {
      name: name,
      email: email
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return jsonResponse(false, 'An error occurred. Please try again later.', {}, 500);
  }
}
