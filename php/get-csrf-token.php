<?php
/**
 * CSRF Token Generator
 * Returns a CSRF token for form protection
 */

define('FORM_HANDLER', true);
require_once __DIR__ . '/config.php';

// Generate and return CSRF token
$token = generateCSRFToken();

header('Content-Type: application/json');
echo json_encode([
    'csrf_token' => $token,
    'expires' => time() + 3600 // Token valid for 1 hour
]);
?>
