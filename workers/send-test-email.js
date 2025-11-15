/**
 * Send Test Email Script
 * Sends a test book purchase email to rossen@kinov.com using Resend API
 *
 * Usage:
 * 1. Set RESEND_API_KEY environment variable
 * 2. Run: node send-test-email.js
 *
 * Or with inline API key:
 * RESEND_API_KEY=re_xxxxx node send-test-email.js
 */

// Email template (same as in book-purchase.js)
const EMAIL_TEMPLATES = {
    en: {
        subject: "Thank you for supporting children's education! Your Jazz Trumpet Master Class",
        thankYou: "Dear",
        intro: "Thank you for your generous donation of {amount}!",
        impact: "Your purchase directly supports vulnerable children in Bulgaria by funding:",
        impact1: "• Tutoring programs and academic support",
        impact2: "• School supplies and educational materials",
        impact3: "• Educational opportunities for children in need",
        downloadTitle: "Download Your Educational Resource",
        downloadText: "Click the button below to download your Jazz Trumpet Master Class PDF:",
        downloadButton: "Download Jazz Trumpet Master Class",
        downloadNote: "This download link is valid for 30 days and allows up to 5 downloads.",
        receiptTitle: "Your Tax-Deductible Donation Receipt",
        receiptNumber: "Receipt Number:",
        receiptAmount: "Donation Amount:",
        receiptDate: "Date:",
        receiptEmail: "Email:",
        receiptNote: "Please keep this receipt for your tax records. This is a charitable donation to Accord and Harmony Foundation, a registered non-profit organization.",
        bookInfo: "About Your Educational Resource:",
        bookFeatures: "• 28 pages of comprehensive jazz trumpet instruction\n• 80+ professional licks from the masters\n• Complete music theory and transposition guide\n• 24-week structured practice curriculum\n• For personal, non-commercial use only",
        support: "Questions or need help?",
        contactUs: "Contact us at contact@acchm.org",
        closing: "Thank you for making a difference in children's lives!",
        signature: "With gratitude,\nThe Accord and Harmony Foundation Team"
    }
};

/**
 * Build HTML email content
 */
function buildEmailHTML(template, data) {
    const { name, email, amount, currency, downloadUrl, receiptNumber, purchaseDate } = data;

    const formattedAmount = `$${parseFloat(amount).toFixed(2)} ${currency}`;
    const t = EMAIL_TEMPLATES.en;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2E9DD8 0%, #1B76A8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .download-button { display: inline-block; background: linear-gradient(135deg, #2E9DD8 0%, #1B76A8 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .download-button:hover { background: linear-gradient(135deg, #1B76A8 0%, #2E9DD8 100%); }
        .receipt-box { background: #f9f9f9; border-left: 4px solid #6B5B4E; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .receipt-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
        .receipt-row:last-child { border-bottom: none; }
        .impact-list { background: rgba(46, 157, 216, 0.1); padding: 20px; border-radius: 5px; margin: 20px 0; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 14px; color: #666; border-radius: 0 0 10px 10px; }
        .divider { border-top: 2px solid #2E9DD8; margin: 30px 0; }
        .test-notice { background: #fff3cd; border: 2px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎺 Jazz Trumpet Master Class</h1>
            <p>${t.subject}</p>
        </div>

        <div class="content">
            <div class="test-notice">
                <strong>⚠️ THIS IS A TEST EMAIL</strong><br>
                Testing the book purchase email system for Accord and Harmony Foundation
            </div>

            <h2>${t.thankYou} ${name || 'Friend'},</h2>
            <p style="font-size: 18px; color: #2E9DD8;"><strong>${t.intro.replace('{amount}', formattedAmount)}</strong></p>

            <div class="impact-list">
                <p><strong>${t.impact}</strong></p>
                <p>${t.impact1}</p>
                <p>${t.impact2}</p>
                <p>${t.impact3}</p>
            </div>

            <div class="divider"></div>

            <h3>${t.downloadTitle}</h3>
            <p>${t.downloadText}</p>
            <center>
                <a href="${downloadUrl}" class="download-button">${t.downloadButton}</a>
            </center>
            <p style="font-size: 13px; color: #666;"><em>${t.downloadNote}</em></p>
            <p style="font-size: 12px; color: #999;"><em>Note: This is a test email - the download link is not functional</em></p>

            <div class="divider"></div>

            <div class="receipt-box">
                <h3 style="margin-top: 0;">${t.receiptTitle}</h3>
                <div class="receipt-row">
                    <strong>${t.receiptNumber}</strong>
                    <span>${receiptNumber}</span>
                </div>
                <div class="receipt-row">
                    <strong>${t.receiptAmount}</strong>
                    <span>${formattedAmount}</span>
                </div>
                <div class="receipt-row">
                    <strong>${t.receiptDate}</strong>
                    <span>${purchaseDate}</span>
                </div>
                <div class="receipt-row">
                    <strong>${t.receiptEmail}</strong>
                    <span>${email}</span>
                </div>
                <p style="font-size: 13px; color: #666; margin-top: 15px;"><em>${t.receiptNote}</em></p>
            </div>

            <div class="divider"></div>

            <h3>${t.bookInfo}</h3>
            <p style="white-space: pre-line; font-size: 14px;">${t.bookFeatures}</p>

            <div class="divider"></div>

            <p><strong>${t.support}</strong><br>${t.contactUs}</p>
            <p>${t.closing}</p>
            <p style="white-space: pre-line;">${t.signature}</p>
        </div>

        <div class="footer">
            <p>Accord and Harmony Foundation<br>
            Odrin 95 st, Sofia 1303, Bulgaria<br>
            <a href="https://accordandharmony.org">accordandharmony.org</a></p>
        </div>
    </div>
</body>
</html>`;

    return html;
}

/**
 * Send test email via Resend
 */
async function sendTestEmail() {
    console.log('='.repeat(60));
    console.log('SENDING TEST EMAIL TO rossen@kinov.com');
    console.log('='.repeat(60));
    console.log('');

    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
        console.error('❌ Error: RESEND_API_KEY environment variable not set');
        console.error('');
        console.error('Usage:');
        console.error('  RESEND_API_KEY=re_xxxxx node send-test-email.js');
        process.exit(1);
    }

    // Test email data
    const emailData = {
        name: 'Rossen Kinov',
        email: 'rossen.kinov@gmail.com',  // Using verified account email for testing
        amount: '25.00',
        currency: 'USD',
        downloadUrl: 'https://accordandharmony.org/api/download-book/TEST_TOKEN_12345',
        receiptNumber: 'AHF-2025-TEST-0001',
        purchaseDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    };

    console.log('Email Details:');
    console.log(`  To: ${emailData.email}`);
    console.log(`  Name: ${emailData.name}`);
    console.log(`  Amount: $${emailData.amount} ${emailData.currency}`);
    console.log(`  Receipt: ${emailData.receiptNumber}`);
    console.log('');

    const htmlContent = buildEmailHTML(EMAIL_TEMPLATES.en, emailData);
    const subject = EMAIL_TEMPLATES.en.subject;

    console.log('Sending email via Resend API...');

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Accord and Harmony <onboarding@resend.dev>',  // Using Resend test domain
                to: [emailData.email],
                subject: `[TEST] ${subject}`,
                html: htmlContent
            })
        });

        const result = await response.json();

        if (response.ok) {
            console.log('');
            console.log('✅ Email sent successfully!');
            console.log('');
            console.log('Response:', JSON.stringify(result, null, 2));
            console.log('');
            console.log('⚠️  Please check rossen@kinov.com inbox (and spam folder)');
        } else {
            console.error('');
            console.error('❌ Failed to send email');
            console.error('');
            console.error('Error:', JSON.stringify(result, null, 2));
        }

    } catch (error) {
        console.error('');
        console.error('❌ Error sending email:', error.message);
        console.error(error.stack);
    }

    console.log('');
    console.log('='.repeat(60));
}

// Run the test
sendTestEmail().catch(console.error);
