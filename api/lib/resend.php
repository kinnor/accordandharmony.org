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
