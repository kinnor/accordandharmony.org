<?php
/**
 * PayPal Donation Notification Handler
 * Sends email notification to foundation when donation is received
 */

define('FORM_HANDLER', true);
require_once __DIR__ . '/config.php';

// Get POST data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid data']);
    exit;
}

// Extract donation details
$orderID = isset($data['orderID']) ? sanitizeInput($data['orderID']) : '';
$payerName = isset($data['payerName']) ? sanitizeInput($data['payerName']) : 'Anonymous';
$payerEmail = isset($data['payerEmail']) ? sanitizeInput($data['payerEmail']) : '';
$amount = isset($data['amount']) ? sanitizeInput($data['amount']) : '0';
$currency = isset($data['currency']) ? sanitizeInput($data['currency']) : 'EUR';
$donorName = isset($data['donorName']) ? sanitizeInput($data['donorName']) : '';
$donorEmail = isset($data['donorEmail']) ? sanitizeInput($data['donorEmail']) : '';
$recurring = isset($data['recurring']) && $data['recurring'];

$formattedAmount = $currency . ' ' . number_format(floatval($amount), 2);
$donationType = $recurring ? 'Monthly Recurring' : 'One-Time';

// Send notification email to foundation
$subject = '💚 New PayPal Donation Received - ' . $formattedAmount;
$message = '
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1893DF; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .amount { font-size: 32px; font-weight: bold; color: #1893DF; text-align: center; padding: 25px; background-color: white; border-radius: 8px; margin: 20px 0; }
        .info-row { margin-bottom: 15px; padding: 12px; background-color: white; border-left: 4px solid #96CDD4; }
        .label { font-weight: bold; color: #1684C9; display: block; margin-bottom: 5px; }
        .value { color: #333; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="margin: 0;">💚 New Donation Received!</h2>
        </div>
        <div class="content">
            <div class="amount">' . htmlspecialchars($formattedAmount) . '</div>

            <div class="info-row">
                <span class="label">Donation Type:</span>
                <span class="value">' . $donationType . '</span>
            </div>

            <div class="info-row">
                <span class="label">PayPal Payer Name:</span>
                <span class="value">' . htmlspecialchars($payerName) . '</span>
            </div>

            <div class="info-row">
                <span class="label">PayPal Payer Email:</span>
                <span class="value"><a href="mailto:' . htmlspecialchars($payerEmail) . '">' . htmlspecialchars($payerEmail) . '</a></span>
            </div>';

if ($donorName) {
    $message .= '
            <div class="info-row">
                <span class="label">Donor Name (from form):</span>
                <span class="value">' . htmlspecialchars($donorName) . '</span>
            </div>';
}

if ($donorEmail) {
    $message .= '
            <div class="info-row">
                <span class="label">Donor Email (from form):</span>
                <span class="value"><a href="mailto:' . htmlspecialchars($donorEmail) . '">' . htmlspecialchars($donorEmail) . '</a></span>
            </div>';
}

$message .= '
            <div class="info-row">
                <span class="label">PayPal Order ID:</span>
                <span class="value">' . htmlspecialchars($orderID) . '</span>
            </div>

            <div class="info-row">
                <span class="label">Date & Time:</span>
                <span class="value">' . date('F j, Y, g:i a T') . '</span>
            </div>

            <p style="margin-top: 30px; padding: 15px; background-color: #e8f5e9; border-left: 4px solid #4caf50; border-radius: 4px;">
                <strong>✅ Payment Processed Successfully</strong><br>
                The donation has been completed through PayPal. Check your PayPal account for transaction details.
            </p>
        </div>
        <div class="footer">
            <p>This notification was sent from your website donation system.<br>
            Login to <a href="https://www.paypal.com">PayPal</a> to view full transaction details.</p>
        </div>
    </div>
</body>
</html>
';

// Send email
$emailSent = sendEmail(TO_EMAIL, $subject, $message);

// Log the donation
$logMessage = sprintf(
    "PayPal Donation: %s | Amount: %s | Payer: %s (%s) | Order: %s",
    $donationType,
    $formattedAmount,
    $payerName,
    $payerEmail,
    $orderID
);
logError($logMessage); // Using logError as a general log function

// Return response
header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'message' => 'Notification sent',
    'email_sent' => $emailSent
]);
?>
