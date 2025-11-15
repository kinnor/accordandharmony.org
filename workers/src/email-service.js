/**
 * Email Service
 * Handles email delivery using Resend API
 */

import { EmailLogDB } from './db.js';

/**
 * Send email via Resend
 */
async function sendEmail(env, { to, subject, html, text }) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Accord and Harmony Foundation <noreply@accordandharmony.org>',
        to: [to],
        subject,
        html,
        text
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', result);
      return {
        success: false,
        error: result.message || 'Failed to send email'
      };
    }

    return {
      success: true,
      messageId: result.id
    };

  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(env, { to, userName, userId }) {
  const subject = 'Welcome to Accord and Harmony Foundation';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4A90E2 0%, #5DADE2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
        .button { display: inline-block; padding: 12px 30px; background: #4A90E2; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Accord and Harmony!</h1>
        </div>
        <div class="content">
          <p>Dear ${userName},</p>

          <p>Thank you for joining the Accord and Harmony Foundation community! We're thrilled to have you with us.</p>

          <p>At Accord and Harmony, we believe in the power of unity and the transformative impact it can have on the lives of those in need. Your support helps us provide educational opportunities, essential resources, and hope to families across Bulgaria.</p>

          <h3>What's Next?</h3>
          <ul>
            <li>Explore our educational resources and programs</li>
            <li>Make a donation to support our mission</li>
            <li>Purchase the Jazz Trumpet Master Class book</li>
            <li>Stay updated on our latest initiatives</li>
          </ul>

          <a href="https://accordandharmony.org/about.html" class="button">Learn More About Us</a>

          <p>If you have any questions, please don't hesitate to reach out to us at <a href="mailto:contact@acchm.org">contact@acchm.org</a>.</p>

          <p>With gratitude,<br>
          <strong>The Accord and Harmony Foundation Team</strong></p>
        </div>
        <div class="footer">
          <p>Accord and Harmony Foundation<br>
          Odrin 95 st, Sofia 1303, Bulgaria<br>
          <a href="https://accordandharmony.org">www.accordandharmony.org</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome to Accord and Harmony Foundation!

Dear ${userName},

Thank you for joining the Accord and Harmony Foundation community! We're thrilled to have you with us.

At Accord and Harmony, we believe in the power of unity and the transformative impact it can have on the lives of those in need.

Visit us at: https://accordandharmony.org

Best regards,
The Accord and Harmony Foundation Team
  `;

  const result = await sendEmail(env, { to, subject, html, text });

  // Log email
  await EmailLogDB.create(env.DB, {
    user_id: userId,
    email_to: to,
    email_type: 'welcome',
    subject,
    provider: 'resend',
    provider_message_id: result.messageId || null,
    status: result.success ? 'sent' : 'failed'
  });

  return result;
}

/**
 * Send purchase confirmation and download link email
 */
export async function sendPurchaseConfirmationEmail(env, { to, userName, productName, amount, currency, downloadToken, transactionId, isDonation = false }) {
  const subject = isDonation
    ? 'Thank You for Your Donation - Accord and Harmony Foundation'
    : `Your Book is Ready to Download - ${productName}`;

  // Use worker URL directly if FRONTEND_URL routes are not configured
  // Once Cloudflare routes are set up, env.FRONTEND_URL should be https://accordandharmony.org
  const workerUrl = env.FRONTEND_URL && env.FRONTEND_URL.includes('workers.dev')
    ? env.FRONTEND_URL
    : 'https://accordandharmony-workers.rossen-kinov.workers.dev';

  const downloadUrl = downloadToken
    ? `${workerUrl}/api/download?token=${downloadToken}`
    : null;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6BCF7F 0%, #A8E063 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
        .receipt { background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .receipt-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
        .receipt-total { font-size: 18px; font-weight: bold; color: #4A90E2; padding-top: 15px; border-top: 2px solid #4A90E2; margin-top: 10px; }
        .download-box { background: #E8F5FF; border: 2px solid #4A90E2; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center; }
        .button { display: inline-block; padding: 15px 40px; background: #4A90E2; color: white; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; }
        .button:hover { background: #357ABD; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        .watermark-notice { background: #FFF4E0; border-left: 4px solid #FFD93D; padding: 15px; margin: 20px 0; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${isDonation ? '🙏 Thank You!' : '📚 Your Purchase is Complete!'}</h1>
        </div>
        <div class="content">
          <p>Dear ${userName},</p>

          ${isDonation ? `
            <p>Thank you so much for your generous donation to Accord and Harmony Foundation! Your support makes a real difference in the lives of children and families across Bulgaria.</p>
          ` : `
            <p>Thank you for purchasing <strong>${productName}</strong> and supporting Accord and Harmony Foundation!</p>

            <p>Your purchase helps us provide educational opportunities, essential resources, and hope to families across Bulgaria. By buying this book, you're making a direct impact on our mission.</p>
          `}

          <div class="receipt">
            <h3 style="margin-top: 0; color: #4A90E2;">Receipt</h3>
            ${!isDonation ? `
              <div class="receipt-row">
                <span>Product:</span>
                <span><strong>${productName}</strong></span>
              </div>
            ` : `
              <div class="receipt-row">
                <span>Type:</span>
                <span><strong>Charitable Donation</strong></span>
              </div>
            `}
            <div class="receipt-row">
              <span>Amount:</span>
              <span><strong>${currency} ${amount.toFixed(2)}</strong></span>
            </div>
            <div class="receipt-row">
              <span>Transaction ID:</span>
              <span><code>${transactionId}</code></span>
            </div>
            <div class="receipt-row">
              <span>Date:</span>
              <span>${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</span>
            </div>
            <div class="receipt-row receipt-total">
              <span>Total Paid:</span>
              <span>${currency} ${amount.toFixed(2)}</span>
            </div>
          </div>

          ${downloadUrl ? `
            <div class="download-box">
              <h2 style="margin-top: 0; color: #4A90E2;">📥 Download Your Book</h2>
              <p>Click the button below to download your personalized copy of ${productName}.</p>
              <a href="${downloadUrl}" class="button">Download Now</a>
              <p style="margin-top: 20px; font-size: 14px; color: #666;">
                This download link will expire in 24 hours.<br>
                You can download the book up to 5 times.
              </p>
            </div>

            <div class="watermark-notice">
              <strong>📝 Important:</strong> Your PDF is personalized with your name and email. This copy is licensed for your personal use only. Unauthorized distribution or sharing is prohibited and violates our terms of service.
            </div>
          ` : ''}

          ${isDonation ? `
            <p><strong>Tax Receipt:</strong> A tax-deductible receipt for your donation will be issued shortly. Please keep this email for your records.</p>
          ` : ''}

          <p>If you have any questions or need assistance, please contact us at <a href="mailto:contact@acchm.org">contact@acchm.org</a>.</p>

          <p>With heartfelt gratitude,<br>
          <strong>The Accord and Harmony Foundation Team</strong></p>
        </div>
        <div class="footer">
          <p>Accord and Harmony Foundation<br>
          Odrin 95 st, Sofia 1303, Bulgaria<br>
          <a href="https://accordandharmony.org">www.accordandharmony.org</a></p>

          <p style="font-size: 12px; color: #999;">
            This is an automated email. Please do not reply directly to this message.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
${isDonation ? 'Thank You for Your Donation!' : 'Your Purchase is Complete!'}

Dear ${userName},

${isDonation
  ? `Thank you for your generous donation of ${currency} ${amount.toFixed(2)} to Accord and Harmony Foundation!`
  : `Thank you for purchasing ${productName} for ${currency} ${amount.toFixed(2)}!`
}

Transaction ID: ${transactionId}
Date: ${new Date().toISOString()}

${downloadUrl ? `
Download your book here:
${downloadUrl}

This link expires in 24 hours. Your PDF is personalized for your use only.
` : ''}

Thank you for supporting our mission!

Best regards,
The Accord and Harmony Foundation Team

www.accordandharmony.org
  `;

  const result = await sendEmail(env, { to, subject, html, text });

  // Log email
  const txQuery = 'SELECT user_id FROM transactions WHERE id = ?';
  const txResult = await env.DB.prepare(txQuery).bind(transactionId).first();

  await EmailLogDB.create(env.DB, {
    user_id: txResult?.user_id || null,
    email_to: to,
    email_type: isDonation ? 'receipt' : 'download',
    subject,
    provider: 'resend',
    provider_message_id: result.messageId || null,
    status: result.success ? 'sent' : 'failed'
  });

  return result;
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(env, { to, userName, resetToken, userId }) {
  const subject = 'Reset Your Password - Accord and Harmony Foundation';
  const resetUrl = `${env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
        .button { display: inline-block; padding: 15px 40px; background: #FF8C42; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        .warning { background: #FFF4E0; border-left: 4px solid #FFD93D; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔑 Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Dear ${userName},</p>

          <p>We received a request to reset your password for your Accord and Harmony Foundation account.</p>

          <p>Click the button below to reset your password:</p>

          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>

          <p style="font-size: 14px; color: #666;">
            Or copy and paste this link into your browser:<br>
            <code>${resetUrl}</code>
          </p>

          <div class="warning">
            <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour. If you didn't request this password reset, please ignore this email and your password will remain unchanged.
          </div>

          <p>If you have any concerns, please contact us at <a href="mailto:contact@acchm.org">contact@acchm.org</a>.</p>

          <p>Best regards,<br>
          <strong>The Accord and Harmony Foundation Team</strong></p>
        </div>
        <div class="footer">
          <p>Accord and Harmony Foundation<br>
          <a href="https://accordandharmony.org">www.accordandharmony.org</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Password Reset Request

Dear ${userName},

We received a request to reset your password.

Reset your password here: ${resetUrl}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

Best regards,
The Accord and Harmony Foundation Team
  `;

  const result = await sendEmail(env, { to, subject, html, text });

  // Log email
  await EmailLogDB.create(env.DB, {
    user_id: userId,
    email_to: to,
    email_type: 'password_reset',
    subject,
    provider: 'resend',
    provider_message_id: result.messageId || null,
    status: result.success ? 'sent' : 'failed'
  });

  return result;
}
