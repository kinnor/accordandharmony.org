<?php
/**
 * PayPal Configuration for Accord and Harmony Foundation
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a PayPal Business account at https://www.paypal.com/
 * 2. Get your Client ID and Secret from https://developer.paypal.com/
 * 3. Update the credentials below
 * 4. For production, change PAYPAL_MODE to 'live'
 */

// Prevent direct access
if (!defined('FORM_HANDLER')) {
    die('Direct access not permitted');
}

// PayPal Environment
define('PAYPAL_MODE', 'sandbox'); // Change to 'live' for production
define('PAYPAL_SANDBOX_CLIENT_ID', 'YOUR_SANDBOX_CLIENT_ID');
define('PAYPAL_SANDBOX_SECRET', 'YOUR_SANDBOX_SECRET');
define('PAYPAL_LIVE_CLIENT_ID', 'YOUR_LIVE_CLIENT_ID');
define('PAYPAL_LIVE_SECRET', 'YOUR_LIVE_SECRET');

// Get current credentials based on mode
function getPayPalCredentials() {
    if (PAYPAL_MODE === 'live') {
        return [
            'client_id' => PAYPAL_LIVE_CLIENT_ID,
            'secret' => PAYPAL_LIVE_SECRET,
            'api_url' => 'https://api.paypal.com',
            'checkout_url' => 'https://www.paypal.com/checkoutnow'
        ];
    } else {
        return [
            'client_id' => PAYPAL_SANDBOX_CLIENT_ID,
            'secret' => PAYPAL_SANDBOX_SECRET,
            'api_url' => 'https://api.sandbox.paypal.com',
            'checkout_url' => 'https://www.sandbox.paypal.com/checkoutnow'
        ];
    }
}

// PayPal Account Email
define('PAYPAL_EMAIL', 'contact@acchm.org');
define('PAYPAL_PHONE', '+359 (89) 609 7069');

// Currency
define('PAYPAL_CURRENCY', 'EUR');

// Return URLs
define('PAYPAL_RETURN_URL', 'https://accordandharmony.org/donation-success.html');
define('PAYPAL_CANCEL_URL', 'https://accordandharmony.org/donate.html?cancelled=1');
define('PAYPAL_NOTIFY_URL', 'https://accordandharmony.org/php/paypal-ipn.php');

/**
 * Get PayPal access token
 */
function getPayPalAccessToken() {
    $credentials = getPayPalCredentials();

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $credentials['api_url'] . '/v1/oauth2/token');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, 'grant_type=client_credentials');
    curl_setopt($ch, CURLOPT_USERPWD, $credentials['client_id'] . ':' . $credentials['secret']);

    $headers = [
        'Accept: application/json',
        'Accept-Language: en_US'
    ];
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        $response = json_decode($result, true);
        return $response['access_token'] ?? null;
    }

    return null;
}

/**
 * Create PayPal order
 */
function createPayPalOrder($amount, $currency = 'EUR', $description = 'Donation') {
    $credentials = getPayPalCredentials();
    $accessToken = getPayPalAccessToken();

    if (!$accessToken) {
        return ['success' => false, 'error' => 'Failed to get PayPal access token'];
    }

    $orderData = [
        'intent' => 'CAPTURE',
        'purchase_units' => [
            [
                'amount' => [
                    'currency_code' => $currency,
                    'value' => number_format((float)$amount, 2, '.', '')
                ],
                'description' => $description
            ]
        ],
        'application_context' => [
            'return_url' => PAYPAL_RETURN_URL,
            'cancel_url' => PAYPAL_CANCEL_URL,
            'brand_name' => SITE_NAME,
            'shipping_preference' => 'NO_SHIPPING'
        ]
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $credentials['api_url'] . '/v2/checkout/orders');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($orderData));

    $headers = [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $accessToken
    ];
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 201) {
        $response = json_decode($result, true);
        return [
            'success' => true,
            'order_id' => $response['id'] ?? null,
            'approval_url' => $response['links'][1]['href'] ?? null
        ];
    }

    return ['success' => false, 'error' => 'Failed to create PayPal order', 'response' => $result];
}

/**
 * Capture PayPal payment
 */
function capturePayPalPayment($orderId) {
    $credentials = getPayPalCredentials();
    $accessToken = getPayPalAccessToken();

    if (!$accessToken) {
        return ['success' => false, 'error' => 'Failed to get PayPal access token'];
    }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $credentials['api_url'] . '/v2/checkout/orders/' . $orderId . '/capture');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, 1);

    $headers = [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $accessToken
    ];
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 201) {
        $response = json_decode($result, true);
        return [
            'success' => true,
            'capture_id' => $response['purchase_units'][0]['payments']['captures'][0]['id'] ?? null,
            'status' => $response['status'] ?? null
        ];
    }

    return ['success' => false, 'error' => 'Failed to capture payment', 'response' => $result];
}
?>
