<?php
// api/lib/csrf.php
// CSRF token generation and validation

define('API_LOADED', true);
require_once __DIR__ . '/../config.php';

class CSRF {
    /**
     * Generate CSRF token
     */
    public static function generateToken() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $token = bin2hex(random_bytes(32));
        $_SESSION[CSRF_TOKEN_NAME] = $token;
        $_SESSION[CSRF_TOKEN_NAME . '_time'] = time();

        return $token;
    }

    /**
     * Validate CSRF token
     */
    public static function validateToken($token) {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // Check if token exists
        if (!isset($_SESSION[CSRF_TOKEN_NAME])) {
            return false;
        }

        // Check if token matches
        if (!hash_equals($_SESSION[CSRF_TOKEN_NAME], $token)) {
            return false;
        }

        // Check if token is expired
        $tokenTime = $_SESSION[CSRF_TOKEN_NAME . '_time'] ?? 0;
        if (time() - $tokenTime > CSRF_TOKEN_EXPIRY) {
            return false;
        }

        return true;
    }

    /**
     * Clear token after use
     */
    public static function clearToken() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        unset($_SESSION[CSRF_TOKEN_NAME]);
        unset($_SESSION[CSRF_TOKEN_NAME . '_time']);
    }
}

?>
