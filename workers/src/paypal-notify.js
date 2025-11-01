/**
 * PayPal Donation Notification Handler (Cloudflare Worker)
 * Converted from php/paypal-notify.php
 */

import { sanitizeInput, sendEmail, jsonResponse, handleCORS } from './utils.js';

export async function handlePayPalNotification(request, env) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCORS();
  }

  // Only allow POST requests
  if (request.method !== 'POST') {
    return jsonResponse(false, 'Invalid request method', {}, 405);
  }

  try {
    // Parse JSON data
    const data = await request.json();

    if (!data) {
      return jsonResponse(false, 'Invalid data', {}, 400);
    }

    // Extract donation details
    const orderID = sanitizeInput(data.orderID || '');
    const payerName = sanitizeInput(data.payerName || 'Anonymous');
    const payerEmail = sanitizeInput(data.payerEmail || '');
    const amount = sanitizeInput(data.amount || '0');
    const currency = sanitizeInput(data.currency || 'EUR');
    const donorName = sanitizeInput(data.donorName || '');
    const donorEmail = sanitizeInput(data.donorEmail || '');
    const recurring = data.recurring || false;

    const formattedAmount = `${currency} ${parseFloat(amount).toFixed(2)}`;
    const donationType = recurring ? 'Monthly Recurring' : 'One-Time';
    const currentDate = new Date().toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      timeZoneName: 'short'
    });

    // Send notification email to foundation
    const subject = `💚 New PayPal Donation Received - ${formattedAmount}`;

    let message = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1893DF; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .amount { font-size: 32px; font-weight: bold; color: #1893DF; text-align: center; padding: 25px; background-color: white; border-radius: 8px; margin: 20px 0; }
        .info-row { margin-bottom: 15px; padding: 12px; background-color: white; border-left: 4px solid #96CDD4; }
        .label { font-weight: bold; color: #1684C9; display: block; margin-bottom: 5px; }
        .value { color: #333; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="margin: 0;">💚 New Donation Received!</h2>
        </div>
        <div class="content">
            <div class="amount">${formattedAmount}</div>

            <div class="info-row">
                <span class="label">Donation Type:</span>
                <span class="value">${donationType}</span>
            </div>

            <div class="info-row">
                <span class="label">PayPal Payer Name:</span>
                <span class="value">${payerName}</span>
            </div>

            <div class="info-row">
                <span class="label">PayPal Payer Email:</span>
                <span class="value"><a href="mailto:${payerEmail}">${payerEmail}</a></span>
            </div>`;

    if (donorName) {
      message += `
            <div class="info-row">
                <span class="label">Donor Name (from form):</span>
                <span class="value">${donorName}</span>
            </div>`;
    }

    if (donorEmail) {
      message += `
            <div class="info-row">
                <span class="label">Donor Email (from form):</span>
                <span class="value"><a href="mailto:${donorEmail}">${donorEmail}</a></span>
            </div>`;
    }

    message += `
            <div class="info-row">
                <span class="label">PayPal Order ID:</span>
                <span class="value">${orderID}</span>
            </div>

            <div class="info-row">
                <span class="label">Date & Time:</span>
                <span class="value">${currentDate}</span>
            </div>

            <p style="margin-top: 30px; padding: 15px; background-color: #e8f5e9; border-left: 4px solid #4caf50; border-radius: 4px;">
                <strong>✅ Payment Processed Successfully</strong><br>
                The donation has been completed through PayPal. Check your PayPal account for transaction details.
            </p>
        </div>
        <div class="footer">
            <p>This notification was sent from your website donation system.<br>
            Login to <a href="https://www.paypal.com">PayPal</a> to view full transaction details.</p>
        </div>
    </div>
</body>
</html>
`;

    // Send email
    const emailSent = await sendEmail(
      env.TO_EMAIL || 'contact@acchm.org',
      subject,
      message,
      env
    );

    // Log the donation (using console.log in Cloudflare Workers)
    const logMessage = `PayPal Donation: ${donationType} | Amount: ${formattedAmount} | Payer: ${payerName} (${payerEmail}) | Order: ${orderID}`;
    console.log(logMessage);

    return jsonResponse(true, 'Notification sent', {
      email_sent: emailSent
    });

  } catch (error) {
    console.error('PayPal notification error:', error);
    return jsonResponse(false, 'An error occurred processing the notification', {}, 500);
  }
}
