<?php
/**
 * Donation Form Handler
 * Processes donation form submissions and notifies admin
 *
 * NOTE: This handler processes donation INTENT only.
 * For actual payment processing, integrate with:
 * - PayPal (https://developer.paypal.com/)
 * - Stripe (https://stripe.com/docs/api)
 * - Bank transfer confirmation system
 */

define('FORM_HANDLER', true);
require_once __DIR__ . '/config.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, 'Invalid request method');
}

// Check if this is an AJAX request
$isAjax = !empty($_SERVER['HTTP_X_REQUESTED_WITH']) &&
          strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';

// Get and sanitize input
$name = isset($_POST['name']) ? sanitizeInput($_POST['name']) : '';
$email = isset($_POST['email']) ? sanitizeInput($_POST['email']) : '';
$amount = isset($_POST['amount']) ? sanitizeInput($_POST['amount']) : '';
$recurring = isset($_POST['recurring']) ? (bool)$_POST['recurring'] : false;
$csrfToken = isset($_POST['csrf_token']) ? $_POST['csrf_token'] : '';

// Validate CSRF token
if (!verifyCSRFToken($csrfToken)) {
    if ($isAjax) {
        jsonResponse(false, 'Security validation failed. Please refresh the page and try again.');
    } else {
        die('Security validation failed');
    }
}

// Check rate limiting
if (!checkRateLimit('donation_' . $_SERVER['REMOTE_ADDR'])) {
    if ($isAjax) {
        jsonResponse(false, 'Too many requests. Please try again later.');
    } else {
        die('Too many requests. Please try again later.');
    }
}

// Validate required fields
$errors = [];

if (empty($name)) {
    $errors[] = 'Name is required';
}

if (empty($email)) {
    $errors[] = 'Email is required';
} elseif (!validateEmail($email)) {
    $errors[] = 'Please enter a valid email address';
}

if (empty($amount)) {
    $errors[] = 'Donation amount is required';
} elseif (!is_numeric($amount) || floatval($amount) <= 0) {
    $errors[] = 'Please enter a valid donation amount';
}

if (!empty($errors)) {
    if ($isAjax) {
        jsonResponse(false, implode(', ', $errors));
    } else {
        die('Validation error: ' . implode(', ', $errors));
    }
}

// Format amount
$formattedAmount = '€' . number_format(floatval($amount), 2);
$donationType = $recurring ? 'Recurring (Monthly)' : 'One-Time';

// Prepare email to admin
$subject = 'New Donation Intent - ' . $formattedAmount . ' - ' . SITE_NAME;
$message = '
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1893DF; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .info-row { margin-bottom: 20px; }
        .label { font-weight: bold; color: #1684C9; margin-bottom: 5px; display: block; }
        .value { background-color: white; padding: 10px; border-left: 3px solid #96CDD4; }
        .amount { font-size: 24px; font-weight: bold; color: #1893DF; text-align: center; padding: 20px; background-color: white; border-radius: 5px; margin: 20px 0; }
        .warning { background-color: #fff3cd; border-left: 3px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>💚 New Donation Intent</h2>
        </div>
        <div class="content">
            <div class="amount">' . $formattedAmount . '</div>

            <div class="info-row">
                <span class="label">Donor Name:</span>
                <div class="value">' . htmlspecialchars($name) . '</div>
            </div>
            <div class="info-row">
                <span class="label">Email:</span>
                <div class="value"><a href="mailto:' . htmlspecialchars($email) . '">' . htmlspecialchars($email) . '</a></div>
            </div>
            <div class="info-row">
                <span class="label">Donation Type:</span>
                <div class="value">' . $donationType . '</div>
            </div>
            <div class="info-row">
                <span class="label">Amount:</span>
                <div class="value">' . $formattedAmount . '</div>
            </div>
            <div class="info-row">
                <span class="label">Submitted:</span>
                <div class="value">' . date('F j, Y, g:i a') . '</div>
            </div>
            <div class="info-row">
                <span class="label">IP Address:</span>
                <div class="value">' . htmlspecialchars($_SERVER['REMOTE_ADDR']) . '</div>
            </div>

            <div class="warning">
                <strong>⚠️ Action Required:</strong> This is a donation intent notification. Please follow up with the donor to complete the donation process via bank transfer or payment gateway.
            </div>
        </div>
        <div class="footer">
            <p>This email was sent from the donation form on ' . SITE_NAME . '</p>
        </div>
    </div>
</body>
</html>
';

// Send email to admin
$emailSent = sendEmail(TO_EMAIL, $subject, $message);

if (!$emailSent) {
    logError('Failed to send donation notification email for: ' . $email . ' - Amount: ' . $formattedAmount);
    if ($isAjax) {
        jsonResponse(false, 'Sorry, there was an error processing your donation. Please try again or contact us directly.');
    } else {
        die('Error sending email');
    }
}

// Send thank you/instructions email to donor
$confirmSubject = 'Thank You for Your Generous Donation - ' . SITE_NAME;
$confirmMessage = '
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1893DF; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .amount { font-size: 24px; font-weight: bold; color: #1893DF; text-align: center; padding: 20px; background-color: white; border-radius: 5px; margin: 20px 0; }
        .instructions { background-color: white; padding: 20px; border-left: 3px solid #1684C9; margin: 20px 0; }
        .bank-details { background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>💚 Thank You for Your Generous Donation!</h2>
        </div>
        <div class="content">
            <p>Dear ' . htmlspecialchars($name) . ',</p>
            <p>Thank you for your intention to donate to <strong>' . SITE_NAME . '</strong>. Your generosity helps us transform lives through education and community support across Bulgaria.</p>

            <div class="amount">' . $formattedAmount . '</div>
            <p style="text-align: center; color: #666;"><em>' . $donationType . ' Donation</em></p>

            <div class="instructions">
                <h3 style="color: #1684C9; margin-top: 0;">How to Complete Your Donation:</h3>

                <p><strong>Option 1: Bank Transfer</strong></p>
                <div class="bank-details">
                    <p><strong>Bank Name:</strong> [Your Bank Name]</p>
                    <p><strong>Account Name:</strong> Accord and Harmony Foundation</p>
                    <p><strong>IBAN:</strong> [Your IBAN]</p>
                    <p><strong>BIC/SWIFT:</strong> [Your BIC/SWIFT Code]</p>
                    <p><strong>Reference:</strong> Donation - ' . htmlspecialchars($name) . '</p>
                </div>

                <p><strong>Option 2: Contact Us</strong></p>
                <p>Our team will contact you within 24 hours to arrange the donation and answer any questions you may have.</p>

                <p><strong>Questions?</strong></p>
                <p>Email: <a href="mailto:' . TO_EMAIL . '">' . TO_EMAIL . '</a><br>
                Phone: <a href="tel:+359896097069">+359 (89) 609 7069</a></p>
            </div>

            <p>Your support means the world to us and the communities we serve. Together, we\'re building a harmonious future.</p>

            <p style="margin-top: 30px;">With heartfelt gratitude,<br><strong>The ' . SITE_NAME . ' Team</strong></p>
        </div>
        <div class="footer">
            <p>Accord and Harmony Foundation<br>
            Odrin 95 st, Sofia 1303, Bulgaria<br>
            EU Tax ID (ЕИК): BG 207609600</p>
        </div>
    </div>
</body>
</html>
';

sendEmail($email, $confirmSubject, $confirmMessage);

// Respond based on request type
if ($isAjax) {
    jsonResponse(true, 'Thank you for your generous donation of ' . $formattedAmount . '! Check your email for payment instructions.', [
        'name' => $name,
        'email' => $email,
        'amount' => $formattedAmount,
        'recurring' => $recurring
    ]);
} else {
    // Redirect to success page
    header('Location: /../donate.html?donated=1&amount=' . urlencode($amount));
    exit;
}
?>
