<?php
/**
 * Configuration file for Accord and Harmony Foundation website
 *
 * IMPORTANT: Update the email addresses and SMTP settings before deployment
 */

// Prevent direct access
if (!defined('FORM_HANDLER')) {
    die('Direct access not permitted');
}

// Email Configuration
define('TO_EMAIL', 'contact@acchm.org'); // Main contact email
define('FROM_EMAIL', 'contact@acchm.org'); // Sender email
define('SITE_NAME', 'Accord and Harmony Foundation');
define('REPLY_TO_EMAIL', 'contact@acchm.org');

// SMTP Configuration (Network Solutions)
define('SMTP_HOST', 'web-smtp-oxcs.hostingplatform.com');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', 'contact@acchm.org');
define('SMTP_PASSWORD', '@4290713Ross');
define('SMTP_ENCRYPTION', 'tls'); // Use TLS for port 587
define('SMTP_FROM_NAME', 'Accord and Harmony Foundation');

// Form Settings
define('ENABLE_CSRF_PROTECTION', true);
define('RATE_LIMIT_ENABLED', true);
define('MAX_REQUESTS_PER_HOUR', 5); // Prevent spam

// Redirect URLs (relative to site root)
define('SUCCESS_REDIRECT', '/thank-you.html');
define('ERROR_REDIRECT', '/error.html');

// Session configuration
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Generate CSRF token
 */
function generateCSRFToken() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Verify CSRF token
 */
function verifyCSRFToken($token) {
    if (!ENABLE_CSRF_PROTECTION) {
        return true;
    }

    if (empty($_SESSION['csrf_token']) || empty($token)) {
        return false;
    }

    return hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Check rate limiting
 */
function checkRateLimit($identifier) {
    if (!RATE_LIMIT_ENABLED) {
        return true;
    }

    $key = 'rate_limit_' . $identifier;
    $now = time();

    if (!isset($_SESSION[$key])) {
        $_SESSION[$key] = [];
    }

    // Remove old entries (older than 1 hour)
    $_SESSION[$key] = array_filter($_SESSION[$key], function($timestamp) use ($now) {
        return ($now - $timestamp) < 3600;
    });

    // Check if limit exceeded
    if (count($_SESSION[$key]) >= MAX_REQUESTS_PER_HOUR) {
        return false;
    }

    // Add current request
    $_SESSION[$key][] = $now;

    return true;
}

/**
 * Sanitize input data
 */
function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}

/**
 * Validate email address
 */
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Send email using SMTP
 *
 * Uses PHP's built-in SMTP functionality
 */
function sendEmail($to, $subject, $message, $headers = []) {
    // Try SMTP first, fall back to mail() if SMTP fails
    try {
        return sendEmailSMTP($to, $subject, $message, $headers);
    } catch (Exception $e) {
        logError('SMTP failed, trying mail(): ' . $e->getMessage());

        // Fallback to basic mail()
        $defaultHeaders = [
            'From: ' . SMTP_FROM_NAME . ' <' . FROM_EMAIL . '>',
            'Reply-To: ' . REPLY_TO_EMAIL,
            'X-Mailer: PHP/' . phpversion(),
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8'
        ];

        $allHeaders = array_merge($defaultHeaders, $headers);
        $headerString = implode("\r\n", $allHeaders);

        return mail($to, $subject, $message, $headerString);
    }
}

/**
 * Send email via SMTP directly
 */
function sendEmailSMTP($to, $subject, $message, $customHeaders = []) {
    // Build headers
    $from = SMTP_FROM_NAME . ' <' . FROM_EMAIL . '>';
    $replyTo = isset($customHeaders['Reply-To']) ? $customHeaders['Reply-To'] : REPLY_TO_EMAIL;

    $headers = "From: $from\r\n";
    $headers .= "Reply-To: $replyTo\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

    // Add custom headers
    foreach ($customHeaders as $key => $value) {
        if ($key !== 'Reply-To') {
            $headers .= "$key: $value\r\n";
        }
    }

    // Configure PHP to use SMTP
    ini_set('SMTP', SMTP_HOST);
    ini_set('smtp_port', SMTP_PORT);
    ini_set('sendmail_from', FROM_EMAIL);

    // For Windows servers with auth
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
        ini_set('sendmail_path', '');
    }

    // Send email
    $result = mail($to, $subject, $message, $headers);

    if (!$result) {
        throw new Exception('Failed to send email via SMTP');
    }

    return $result;
}

/**
 * Log error for debugging
 */
function logError($message) {
    $logFile = __DIR__ . '/error.log';
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] $message\n";
    error_log($logMessage, 3, $logFile);
}

/**
 * Return JSON response
 */
function jsonResponse($success, $message, $data = []) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}
?>
