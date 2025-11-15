<?php
// api/contact.php
// Handle contact form submissions

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
    $name = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $subject = trim($_POST['subject'] ?? '');
    $message = trim($_POST['message'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $csrfToken = $_POST['csrf_token'] ?? '';

    // Validate CSRF token (optional - uncomment if using CSRF)
    // if (!CSRF::validateToken($csrfToken)) {
    //     throw new Exception('Invalid security token. Please refresh the page and try again.');
    // }

    // Validate required fields
    if (empty($name) || empty($email) || empty($subject) || empty($message)) {
        throw new Exception('Please fill in all required fields.');
    }

    // Validate email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Please enter a valid email address.');
    }

    // Sanitize inputs
    $name = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
    $email = filter_var($email, FILTER_SANITIZE_EMAIL);
    $subject = htmlspecialchars($subject, ENT_QUOTES, 'UTF-8');
    $message = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
    $phone = htmlspecialchars($phone, ENT_QUOTES, 'UTF-8');

    // Build email HTML
    $emailHtml = "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1684C9; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #1684C9; }
            .value { margin-top: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>New Contact Form Submission</h2>
            </div>
            <div class='content'>
                <div class='field'>
                    <div class='label'>From:</div>
                    <div class='value'>{$name}</div>
                </div>
                <div class='field'>
                    <div class='label'>Email:</div>
                    <div class='value'>{$email}</div>
                </div>
                " . ($phone ? "
                <div class='field'>
                    <div class='label'>Phone:</div>
                    <div class='value'>{$phone}</div>
                </div>
                " : "") . "
                <div class='field'>
                    <div class='label'>Subject:</div>
                    <div class='value'>{$subject}</div>
                </div>
                <div class='field'>
                    <div class='label'>Message:</div>
                    <div class='value'>" . nl2br($message) . "</div>
                </div>
            </div>
            <div class='footer'>
                <p>Sent from accordandharmony.org contact form</p>
                <p>IP Address: {$ip} | Time: " . date('Y-m-d H:i:s') . "</p>
            </div>
        </div>
    </body>
    </html>
    ";

    // Send email via Resend
    $resend = new ResendClient();
    $result = $resend->sendEmail([
        'from' => FROM_NAME . ' <' . FROM_EMAIL . '>',
        'to' => [ADMIN_EMAIL],
        'reply_to' => $email,
        'subject' => 'Contact Form: ' . $subject,
        'html' => $emailHtml
    ]);

    // Success response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Thank you for your message! We\'ll get back to you soon.'
    ]);

    // Clear CSRF token
    // CSRF::clearToken();

} catch (Exception $e) {
    error_log('Contact form error: ' . $e->getMessage());

    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
