/**
 * Test Email Endpoint
 * Handles test email sending requests from test-email.html
 */

import { jsonResponse, validateEmail } from './utils.js';
import { sendEmail, sendNotification, sendWelcomeEmail, sendContactNotification, buildSimpleEmailTemplate } from './email-client.js';

/**
 * Handle test email request
 * @param {Request} request - HTTP request
 * @param {Object} env - Environment bindings
 * @returns {Response} - JSON response
 */
export async function handleTestEmail(request, env) {
    if (request.method !== 'POST') {
        return jsonResponse(false, 'Method not allowed', {}, 405);
    }

    try {
        const data = await request.json();
        const { type, to, name, language, subject, message } = data;

        // Validate
        if (!to || !validateEmail(to)) {
            return jsonResponse(false, 'Valid email address is required', {}, 400);
        }

        if (!type) {
            return jsonResponse(false, 'Email type is required', {}, 400);
        }

        if (!env.RESEND_API_KEY) {
            return jsonResponse(false, 'Email service not configured (missing RESEND_API_KEY)', {}, 500);
        }

        let result;

        switch (type) {
            case 'simple':
                if (!subject || !message) {
                    return jsonResponse(false, 'Subject and message are required for simple emails', {}, 400);
                }
                result = await sendNotification({
                    to,
                    subject,
                    message,
                    buttonText: 'Visit Our Website',
                    buttonUrl: 'https://accordandharmony.org'
                }, env.RESEND_API_KEY);
                break;

            case 'welcome':
                result = await sendWelcomeEmail({
                    to,
                    name: name || 'Friend',
                    language: language || 'en'
                }, env.RESEND_API_KEY);
                break;

            case 'contact':
                if (!message) {
                    return jsonResponse(false, 'Message is required for contact emails', {}, 400);
                }
                result = await sendContactNotification({
                    name: name || 'Test User',
                    email: to,
                    message: message
                }, env.TO_EMAIL || 'contact@acchm.org', env.RESEND_API_KEY);
                break;

            case 'book':
                result = await sendBookPurchaseTestEmail(to, name, language, env.RESEND_API_KEY);
                break;

            default:
                return jsonResponse(false, `Unknown email type: ${type}`, {}, 400);
        }

        if (result.success) {
            return jsonResponse(true, `Test email sent to ${to}`, {
                messageId: result.messageId,
                recipient: to,
                type
            });
        } else {
            return jsonResponse(false, result.error || 'Failed to send email', {}, 500);
        }

    } catch (error) {
        console.error('Test email error:', error);
        return jsonResponse(false, error.message, {}, 500);
    }
}

/**
 * Send a test book purchase email
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} language - Language code
 * @param {string} apiKey - Resend API key
 * @returns {Promise<Object>} - Email result
 */
async function sendBookPurchaseTestEmail(to, name, language, apiKey) {
    const formattedAmount = '$25.00 USD';
    const receiptNumber = `AHF-2025-TEST-${Date.now().toString().slice(-4)}`;
    const downloadUrl = `https://accordandharmony.org/api/download-book/TEST_TOKEN_${Date.now()}`;

    const html = buildSimpleEmailTemplate({
        title: '🎺 Jazz Trumpet Master Class - TEST',
        content: `
            <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 15px; margin-bottom: 20px; border-radius: 5px; text-align: center;">
                <strong>⚠️ THIS IS A TEST EMAIL</strong><br>
                <span style="font-size: 13px;">Testing the book purchase email system</span>
            </div>

            <h2>Dear ${name || 'Valued Customer'},</h2>
            <p style="font-size: 18px; color: #2E9DD8;"><strong>Thank you for your generous donation of ${formattedAmount}!</strong></p>

            <div style="background: rgba(46, 157, 216, 0.1); padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Your purchase directly supports vulnerable children in Bulgaria by funding:</strong></p>
                <p>• Tutoring programs and academic support</p>
                <p>• School supplies and educational materials</p>
                <p>• Educational opportunities for children in need</p>
            </div>

            <hr style="border: 0; border-top: 2px solid #2E9DD8; margin: 30px 0;">

            <h3>Download Your Educational Resource</h3>
            <p>Click the button below to download your Jazz Trumpet Master Class PDF:</p>
            <center>
                <a href="${downloadUrl}" style="display: inline-block; background: linear-gradient(135deg, #2E9DD8 0%, #1B76A8 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0;">
                    Download Jazz Trumpet Master Class
                </a>
            </center>
            <p style="font-size: 13px; color: #666;"><em>This download link is valid for 30 days and allows up to 5 downloads.</em></p>
            <p style="font-size: 12px; color: #999;"><em>Note: This is a test email - the download link is not functional</em></p>

            <hr style="border: 0; border-top: 2px solid #2E9DD8; margin: 30px 0;">

            <div style="background: #f9f9f9; border-left: 4px solid #6B5B4E; padding: 20px; margin: 20px 0; border-radius: 5px;">
                <h3 style="margin-top: 0;">Your Tax-Deductible Donation Receipt</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="border-bottom: 1px solid #e0e0e0;">
                        <td style="padding: 8px 0;"><strong>Receipt Number:</strong></td>
                        <td style="padding: 8px 0; text-align: right;">${receiptNumber}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e0e0e0;">
                        <td style="padding: 8px 0;"><strong>Donation Amount:</strong></td>
                        <td style="padding: 8px 0; text-align: right;">${formattedAmount}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e0e0e0;">
                        <td style="padding: 8px 0;"><strong>Date:</strong></td>
                        <td style="padding: 8px 0; text-align: right;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;"><strong>Email:</strong></td>
                        <td style="padding: 8px 0; text-align: right;">${to}</td>
                    </tr>
                </table>
                <p style="font-size: 13px; color: #666; margin-top: 15px;"><em>Please keep this receipt for your tax records. This is a charitable donation to Accord and Harmony Foundation, a registered non-profit organization.</em></p>
            </div>

            <hr style="border: 0; border-top: 2px solid #2E9DD8; margin: 30px 0;">

            <h3>About Your Educational Resource:</h3>
            <p style="white-space: pre-line; font-size: 14px;">• 28 pages of comprehensive jazz trumpet instruction
• 80+ professional licks from the masters
• Complete music theory and transposition guide
• 24-week structured practice curriculum
• For personal, non-commercial use only</p>

            <hr style="border: 0; border-top: 2px solid #2E9DD8; margin: 30px 0;">

            <p><strong>Questions or need help?</strong><br>Contact us at contact@acchm.org</p>
            <p>Thank you for making a difference in children's lives!</p>
            <p style="white-space: pre-line;">With gratitude,
The Accord and Harmony Foundation Team</p>
        `
    });

    return await sendEmail({
        to,
        subject: '[TEST] Thank you for supporting children\'s education! Your Jazz Trumpet Master Class',
        html
    }, apiKey);
}
