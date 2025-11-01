<?php
/**
 * Contact Form Handler
 * Processes contact form submissions
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
$subject = isset($_POST['subject']) ? sanitizeInput($_POST['subject']) : '';
$message = isset($_POST['message']) ? sanitizeInput($_POST['message']) : '';
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
if (!checkRateLimit('contact_' . $_SERVER['REMOTE_ADDR'])) {
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

if (empty($subject)) {
    $errors[] = 'Subject is required';
}

if (empty($message)) {
    $errors[] = 'Message is required';
}

if (!empty($errors)) {
    if ($isAjax) {
        jsonResponse(false, implode(', ', $errors));
    } else {
        die('Validation error: ' . implode(', ', $errors));
    }
}

// Prepare email to admin
$emailSubject = 'New Contact Form Submission - ' . $subject;
$emailMessage = '
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
                <div class="value">' . htmlspecialchars($name) . '</div>
            </div>
            <div class="info-row">
                <span class="label">Email:</span>
                <div class="value"><a href="mailto:' . htmlspecialchars($email) . '">' . htmlspecialchars($email) . '</a></div>
            </div>
            <div class="info-row">
                <span class="label">Subject:</span>
                <div class="value">' . htmlspecialchars($subject) . '</div>
            </div>
            <div class="info-row">
                <span class="label">Message:</span>
                <div class="message-box">' . nl2br(htmlspecialchars($message)) . '</div>
            </div>
            <div class="info-row">
                <span class="label">Submitted:</span>
                <div class="value">' . date('F j, Y, g:i a') . '</div>
            </div>
            <div class="info-row">
                <span class="label">IP Address:</span>
                <div class="value">' . htmlspecialchars($_SERVER['REMOTE_ADDR']) . '</div>
            </div>
        </div>
        <div class="footer">
            <p>This email was sent from the contact form on ' . SITE_NAME . '</p>
            <p>To reply, send an email to: <a href="mailto:' . htmlspecialchars($email) . '">' . htmlspecialchars($email) . '</a></p>
        </div>
    </div>
</body>
</html>
';

// Set Reply-To header to sender's email
$headers = [
    'Reply-To: ' . $email
];

// Send email to admin
$emailSent = sendEmail(TO_EMAIL, $emailSubject, $emailMessage, $headers);

if (!$emailSent) {
    logError('Failed to send contact form email from: ' . $email);
    if ($isAjax) {
        jsonResponse(false, 'Sorry, there was an error sending your message. Please try again or email us directly at ' . TO_EMAIL);
    } else {
        die('Error sending email');
    }
}

// Send confirmation email to sender
$confirmSubject = 'Thank You for Contacting Us - ' . SITE_NAME;
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
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Thank You for Contacting Us</h2>
        </div>
        <div class="content">
            <p>Dear ' . htmlspecialchars($name) . ',</p>
            <p>Thank you for reaching out to <strong>' . SITE_NAME . '</strong>. We have received your message and will respond within 24 hours.</p>
            <p><strong>Your message details:</strong></p>
            <div style="background-color: white; padding: 15px; border-left: 3px solid #96CDD4; margin: 20px 0;">
                <p><strong>Subject:</strong> ' . htmlspecialchars($subject) . '</p>
                <p><strong>Message:</strong><br>' . nl2br(htmlspecialchars($message)) . '</p>
            </div>
            <p>If you need immediate assistance, you can also reach us at:</p>
            <ul>
                <li>Phone: <a href="tel:+359896097069">+359 (89) 609 7069</a></li>
                <li>Email: <a href="mailto:' . TO_EMAIL . '">' . TO_EMAIL . '</a></li>
            </ul>
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
    jsonResponse(true, 'Thank you for your message! We will get back to you soon.', [
        'name' => $name,
        'email' => $email
    ]);
} else {
    // Redirect to success page
    header('Location: /../contact.html?sent=1');
    exit;
}
?>
