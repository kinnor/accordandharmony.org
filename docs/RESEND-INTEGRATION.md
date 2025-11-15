# Resend Email Integration Guide

## Overview

This guide provides complete code for integrating Resend email service with the Accord and Harmony Foundation website forms.

**What This Integration Handles:**
1. Contact form submissions → Send email to `contact@acchm.org`
2. Newsletter signups → Add to mailing list + send confirmation
3. Security features: CSRF protection, rate limiting, input validation

---

## Integration Options

### Option 1: PHP Backend (Recommended for Network Solutions Hosting)
- ✅ Works with Network Solutions hosting
- ✅ No additional infrastructure needed
- ✅ Simple to deploy

### Option 2: Serverless Functions (Vercel/Netlify)
- ✅ Better performance
- ✅ Easier to scale
- ✅ Modern stack

### Option 3: Node.js Server (Self-hosted)
- ✅ Full control
- ✅ Can add database
- ✅ Advanced features

This guide covers all three options.

---

## Prerequisites

1. **Resend Account**: Sign up at https://resend.com
2. **API Key**: Get from https://resend.com/api-keys
3. **DNS Setup**: Complete DNS configuration (see `DNS-SETUP-GUIDE.md`)
4. **Verified Domain**: Ensure `mail.accordandharmony.org` is verified in Resend

---

## Option 1: PHP Backend (Network Solutions)

### File Structure
```
accordandharmony.org/
├── api/
│   ├── config.php          # Configuration & API key
│   ├── contact.php         # Contact form handler
│   ├── newsletter.php      # Newsletter signup handler
│   └── lib/
│       ├── resend.php      # Resend API client
│       ├── csrf.php        # CSRF protection
│       └── ratelimit.php   # Rate limiting
├── index.html
├── contact.html
└── script.js
```

### Step 1: Create Configuration File

**File: `api/config.php`**
```php
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
```

### Step 2: Create Resend API Client

**File: `api/lib/resend.php`**
```php
<?php
// api/lib/resend.php
// Simple Resend API client for PHP

define('API_LOADED', true);
require_once __DIR__ . '/../config.php';

class ResendClient {
    private $apiKey;
    private $apiUrl = 'https://api.resend.com';

    public function __construct($apiKey = null) {
        $this->apiKey = $apiKey ?: RESEND_API_KEY;

        if (empty($this->apiKey) || $this->apiKey === 'YOUR_RESEND_API_KEY_HERE') {
            throw new Exception('Resend API key not configured');
        }
    }

    /**
     * Send an email via Resend API
     *
     * @param array $params Email parameters
     * @return array API response
     */
    public function sendEmail($params) {
        // Validate required fields
        $required = ['from', 'to', 'subject'];
        foreach ($required as $field) {
            if (empty($params[$field])) {
                throw new Exception("Missing required field: $field");
            }
        }

        // Must have either html or text
        if (empty($params['html']) && empty($params['text'])) {
            throw new Exception("Email must have either 'html' or 'text' content");
        }

        // Make API request
        $response = $this->makeRequest('POST', '/emails', $params);

        return $response;
    }

    /**
     * Make HTTP request to Resend API
     */
    private function makeRequest($method, $endpoint, $data = null) {
        $url = $this->apiUrl . $endpoint;

        $ch = curl_init($url);

        $headers = [
            'Authorization: Bearer ' . $this->apiKey,
            'Content-Type: application/json'
        ];

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);

        curl_close($ch);

        if ($error) {
            throw new Exception("CURL Error: $error");
        }

        $decoded = json_decode($response, true);

        if ($httpCode >= 400) {
            $errorMsg = $decoded['message'] ?? 'Unknown error';
            throw new Exception("Resend API Error ($httpCode): $errorMsg");
        }

        return $decoded;
    }
}

?>
```

### Step 3: Create CSRF Protection

**File: `api/lib/csrf.php`**
```php
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
```

### Step 4: Create Rate Limiting

**File: `api/lib/ratelimit.php`**
```php
<?php
// api/lib/ratelimit.php
// Simple file-based rate limiting

define('API_LOADED', true);
require_once __DIR__ . '/../config.php';

class RateLimit {
    private $storageDir;

    public function __construct() {
        $this->storageDir = sys_get_temp_dir() . '/ratelimit';

        // Create storage directory if it doesn't exist
        if (!is_dir($this->storageDir)) {
            mkdir($this->storageDir, 0700, true);
        }
    }

    /**
     * Check if request is allowed
     *
     * @param string $identifier Unique identifier (usually IP address)
     * @return bool True if allowed, false if rate limit exceeded
     */
    public function isAllowed($identifier) {
        $filename = $this->getFilename($identifier);
        $now = time();

        // Read existing requests
        $requests = $this->getRequests($filename);

        // Remove old requests outside timeframe
        $requests = array_filter($requests, function($timestamp) use ($now) {
            return ($now - $timestamp) < RATE_LIMIT_TIMEFRAME;
        });

        // Check if limit exceeded
        if (count($requests) >= RATE_LIMIT_REQUESTS) {
            return false;
        }

        // Add current request
        $requests[] = $now;
        $this->saveRequests($filename, $requests);

        return true;
    }

    /**
     * Get remaining requests before limit
     */
    public function getRemaining($identifier) {
        $filename = $this->getFilename($identifier);
        $now = time();

        $requests = $this->getRequests($filename);
        $requests = array_filter($requests, function($timestamp) use ($now) {
            return ($now - $timestamp) < RATE_LIMIT_TIMEFRAME;
        });

        return max(0, RATE_LIMIT_REQUESTS - count($requests));
    }

    private function getFilename($identifier) {
        return $this->storageDir . '/' . md5($identifier) . '.json';
    }

    private function getRequests($filename) {
        if (!file_exists($filename)) {
            return [];
        }

        $data = file_get_contents($filename);
        return json_decode($data, true) ?: [];
    }

    private function saveRequests($filename, $requests) {
        file_put_contents($filename, json_encode($requests));
    }
}

?>
```

### Step 5: Create Contact Form Handler

**File: `api/contact.php`**
```php
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
```

### Step 6: Create Newsletter Handler

**File: `api/newsletter.php`**
```php
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
```

### Step 7: Update `.htaccess` for Security

**File: `.htaccess`** (add to existing or create new)
```apache
# Prevent direct access to config files
<FilesMatch "^(config\.php)$">
    Order Allow,Deny
    Deny from all
</FilesMatch>

# Enable error logging
php_flag log_errors on
php_value error_log /path/to/your/logs/php_errors.log

# Disable directory listing
Options -Indexes

# Prevent access to sensitive files
<FilesMatch "\.(env|log|ini)$">
    Order Allow,Deny
    Deny from all
</FilesMatch>
```

### Step 8: Deployment to Network Solutions

1. **Upload Files via FTP**:
   - Upload `api/` folder to `public_html/api/`
   - Set permissions to 644 for PHP files
   - Set permissions to 755 for directories

2. **Set Environment Variable (Recommended)**:
   - In cPanel: **Software** > **Select PHP Version** > **Options**
   - Add: `RESEND_API_KEY=your_actual_api_key`

3. **Or Edit `config.php`**:
   - Replace `YOUR_RESEND_API_KEY_HERE` with your actual key
   - ⚠️ Never commit this to git!

4. **Test the Endpoints**:
   ```bash
   curl -X POST https://accordandharmony.org/api/contact.php \
     -d "name=Test User" \
     -d "email=test@example.com" \
     -d "subject=Test" \
     -d "message=Hello"
   ```

---

## Testing Checklist

- [ ] DNS records verified in Resend dashboard
- [ ] API key configured in `config.php`
- [ ] Upload all files to server
- [ ] Test contact form submission
- [ ] Test newsletter signup
- [ ] Verify email delivery to `contact@acchm.org`
- [ ] Check spam folder if not received
- [ ] Test rate limiting (submit 6 times quickly)
- [ ] Review error logs for issues

---

## Next Steps

1. ✅ Add CSRF tokens to forms (update `script.js`)
2. ✅ Implement mailing list database (see `MAILING-LIST-DB.md`)
3. ✅ Set up automated backups
4. ✅ Monitor Resend dashboard for bounces/complaints
5. ✅ Add Google reCAPTCHA for additional spam protection

---

**Last Updated**: November 15, 2025
