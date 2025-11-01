/**
 * Utility functions for Cloudflare Workers
 * Converted from PHP config.php
 */

/**
 * Sanitize input data
 */
export function sanitizeInput(data) {
  if (!data) return '';
  return String(data).trim().replace(/[<>]/g, '');
}

/**
 * Validate email address
 */
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(token, storedToken) {
  if (!token || !storedToken) return false;
  return token === storedToken;
}

/**
 * Rate limiting using Cloudflare KV or Durable Objects
 * For now, simplified version
 */
export async function checkRateLimit(ip, maxRequests = 5) {
  // In production, use Cloudflare KV or Durable Objects
  // For now, allowing all requests
  return true;
}

/**
 * Send email via SMTP using external service
 * Uses fetch to call an email API
 */
export async function sendEmail(to, subject, htmlBody, env, replyTo = null) {
  // For Cloudflare Workers, we'll use an email service API
  // Option 1: Use Cloudflare Email Workers (requires setup)
  // Option 2: Use external service like SendGrid, Mailgun, etc.

  // For now, using a simple SMTP relay via third-party service
  // You can replace this with SendGrid, Mailgun, or other services

  try {
    // Using Resend API (alternative email service for serverless)
    // You'll need to set RESEND_API_KEY in Cloudflare environment variables

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${env.FROM_NAME || 'Accord and Harmony Foundation'} <${env.FROM_EMAIL || 'contact@acchm.org'}>`,
        to: [to],
        reply_to: replyTo || env.REPLY_TO_EMAIL || 'contact@acchm.org',
        subject: subject,
        html: htmlBody,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

/**
 * Alternative: Send email via Mailgun
 */
export async function sendEmailMailgun(to, subject, htmlBody, env, replyTo = null) {
  try {
    const formData = new FormData();
    formData.append('from', `${env.FROM_NAME || 'Accord and Harmony Foundation'} <${env.FROM_EMAIL || 'contact@acchm.org'}>`);
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('html', htmlBody);
    if (replyTo) {
      formData.append('h:Reply-To', replyTo);
    }

    const response = await fetch(
      `https://api.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`api:${env.MAILGUN_API_KEY}`)}`,
        },
        body: formData,
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Mailgun email failed:', error);
    return false;
  }
}

/**
 * Return JSON response
 */
export function jsonResponse(success, message, data = {}, status = 200) {
  return new Response(
    JSON.stringify({
      success,
      message,
      data,
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Adjust for production
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}

/**
 * Handle CORS preflight
 */
export function handleCORS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
