<?php
// api/config.php
// Configuration for Resend email integration

// Prevent direct access
if (!defined('API_LOADED')) {
    http_response_code(403);
    die('Direct access not permitted');
}

// ==================================================
// RESEND API CONFIGURATION
// ==================================================

// Get API key from environment variable (recommended)
// Or hardcode for testing (NOT recommended for production)
define('RESEND_API_KEY', getenv('RESEND_API_KEY') ?: 'YOUR_RESEND_API_KEY_HERE');

// Email configuration
define('FROM_EMAIL', 'noreply@mail.accordandharmony.org');
define('FROM_NAME', 'Accord and Harmony Foundation');
define('REPLY_TO_EMAIL', 'contact@acchm.org');
define('ADMIN_EMAIL', 'contact@acchm.org'); // Where contact form emails go

// ==================================================
// SECURITY CONFIGURATION
// ==================================================

// CSRF token settings
define('CSRF_TOKEN_NAME', 'csrf_token');
define('CSRF_TOKEN_EXPIRY', 3600); // 1 hour

// Rate limiting (requests per IP per timeframe)
define('RATE_LIMIT_REQUESTS', 5);     // Max 5 requests
define('RATE_LIMIT_TIMEFRAME', 3600); // Per hour (in seconds)

// Allowed origins for CORS
define('ALLOWED_ORIGINS', [
    'https://accordandharmony.org',
    'https://www.accordandharmony.org',
    'http://localhost:8000' // For local testing
]);

// ==================================================
// ERROR REPORTING (disable in production)
// ==================================================

// Uncomment for debugging
// error_reporting(E_ALL);
// ini_set('display_errors', 1);

// Production settings
error_reporting(0);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

// ==================================================
// TIMEZONE
// ==================================================

date_default_timezone_set('Europe/Sofia');

?>
