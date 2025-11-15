<?php
// api/newsletter.php
// Handle newsletter signups

define('API_LOADED', true);
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/resend.php';
require_once __DIR__ . '/lib/csrf.php';
require_once __DIR__ . '/lib/ratelimit.php';

// Set JSON header
header('Content-Type: application/json');

// CORS headers
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, ALLOWED_ORIGINS)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
    header('Access-Control-Allow-Credentials: true');
}

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    // Rate limiting
    $rateLimit = new RateLimit();
    $ip = $_SERVER['REMOTE_ADDR'];

    if (!$rateLimit->isAllowed($ip)) {
        http_response_code(429);
        echo json_encode([
            'success' => false,
            'message' => 'Too many requests. Please try again later.'
        ]);
        exit;
    }

    // Get form data
    $email = trim($_POST['email'] ?? '');
    $csrfToken = $_POST['csrf_token'] ?? '';

    // Validate required fields
    if (empty($email)) {
        throw new Exception('Please enter your email address.');
    }

    // Validate email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Please enter a valid email address.');
    }

    // Sanitize email
    $email = filter_var($email, FILTER_SANITIZE_EMAIL);

    // TODO: Add email to your mailing list database
    // For now, we'll just send a confirmation email

    // Send confirmation email
    $emailHtml = "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1684C9; color: white; padding: 30px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .button { display: inline-block; background: #1684C9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>Welcome to Our Newsletter!</h1>
            </div>
            <div class='content'>
                <p>Thank you for subscribing to the Accord and Harmony Foundation newsletter!</p>
                <p>You'll receive inspiring stories, impact updates, and exclusive opportunities to help children delivered to your inbox monthly.</p>
                <p>We're thrilled to have you as part of our community of changemakers.</p>
                <p><strong>What to expect:</strong></p>
                <ul>
                    <li>Monthly impact stories from children we serve</li>
                    <li>Updates on our programs and initiatives</li>
                    <li>Volunteer opportunities</li>
                    <li>Ways to get involved and make a difference</li>
                </ul>
            </div>
            <div class='footer'>
                <p>Accord and Harmony Foundation<br>
                Odrin 95 st, Sofia 1303, Bulgaria<br>
                <a href='mailto:contact@acchm.org'>contact@acchm.org</a></p>
                <p style='font-size: 11px; color: #999;'>
                    You're receiving this email because you subscribed to our newsletter.<br>
                    <a href='mailto:contact@acchm.org?subject=Unsubscribe'>Unsubscribe</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    ";

    $resend = new ResendClient();
    $result = $resend->sendEmail([
        'from' => FROM_NAME . ' <' . FROM_EMAIL . '>',
        'to' => [$email],
        'subject' => 'Welcome to Accord and Harmony Newsletter',
        'html' => $emailHtml
    ]);

    // Also notify admin
    $resend->sendEmail([
        'from' => FROM_NAME . ' <' . FROM_EMAIL . '>',
        'to' => [ADMIN_EMAIL],
        'subject' => 'New Newsletter Subscriber',
        'html' => "<p>New newsletter subscriber: <strong>{$email}</strong></p><p>Subscribed at: " . date('Y-m-d H:i:s') . "</p>"
    ]);

    // Success response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Thank you for subscribing! Check your email for confirmation.'
    ]);

} catch (Exception $e) {
    error_log('Newsletter signup error: ' . $e->getMessage());

    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
