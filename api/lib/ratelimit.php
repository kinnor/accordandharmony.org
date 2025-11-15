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
