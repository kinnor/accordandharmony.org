<?php
/**
 * Newsletter Subscription Handler
 * Processes newsletter signup form submissions
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
$email = isset($_POST['email']) ? sanitizeInput($_POST['email']) : '';
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
if (!checkRateLimit('newsletter_' . $_SERVER['REMOTE_ADDR'])) {
    if ($isAjax) {
        jsonResponse(false, 'Too many requests. Please try again later.');
    } else {
        die('Too many requests. Please try again later.');
    }
}

// Validate email
if (empty($email)) {
    if ($isAjax) {
        jsonResponse(false, 'Please enter your email address.');
    } else {
        die('Email is required');
    }
}

if (!validateEmail($email)) {
    if ($isAjax) {
        jsonResponse(false, 'Please enter a valid email address.');
    } else {
        die('Invalid email address');
    }
}

// Prepare email to admin
$subject = 'New Newsletter Subscription - ' . SITE_NAME;
$message = '
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
                ' . htmlspecialchars($email) . '
            </div>
            <div class="info-row">
                <span class="label">Date:</span><br>
                ' . date('F j, Y, g:i a') . '
            </div>
            <div class="info-row">
                <span class="label">IP Address:</span><br>
                ' . htmlspecialchars($_SERVER['REMOTE_ADDR']) . '
            </div>
        </div>
        <div class="footer">
            <p>This email was sent from the newsletter subscription form on ' . SITE_NAME . '</p>
        </div>
    </div>
</body>
</html>
';

// Send email to admin
$emailSent = sendEmail(TO_EMAIL, $subject, $message);

if (!$emailSent) {
    logError('Failed to send newsletter subscription email for: ' . $email);
}

// Send confirmation email to subscriber
$confirmSubject = 'Thank You for Subscribing - ' . SITE_NAME;
$confirmMessage = '
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
            <p>Thank you for subscribing to the <strong>' . SITE_NAME . '</strong> newsletter!</p>
            <p>You will now receive updates about our latest initiatives, impact stories, and ways to get involved in supporting those in need and championing children\'s education across Bulgaria.</p>
            <p>If you have any questions, feel free to contact us at <a href="mailto:' . REPLY_TO_EMAIL . '">' . REPLY_TO_EMAIL . '</a></p>
            <p style="margin-top: 30px;">With gratitude,<br><strong>The ' . SITE_NAME . ' Team</strong></p>
        </div>
        <div class="footer">
            <p>Accord and Harmony Foundation<br>
            Odrin 95 st, Sofia 1303, Bulgaria<br>
            Phone: +359 (89) 609 7069</p>
        </div>
    </div>
</body>
</html>
';

sendEmail($email, $confirmSubject, $confirmMessage);

// Respond based on request type
if ($isAjax) {
    jsonResponse(true, 'Thank you for subscribing! You will receive our newsletter soon.', [
        'email' => $email
    ]);
} else {
    // Redirect to success page
    header('Location: /../index.html?subscribed=1');
    exit;
}
?>
