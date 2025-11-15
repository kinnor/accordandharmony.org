/**
 * Test Book Purchase Script
 * Sends a test purchase email to rossen@kinov.com
 *
 * Usage:
 * node test-book-purchase.js
 *
 * Note: This is a local test that directly calls the handler function
 * For testing the deployed endpoint, use curl or Postman with:
 * POST https://accordandharmony.org/api/book-purchase
 */

import { handleBookPurchase } from './src/book-purchase.js';

/**
 * Mock environment object for testing
 */
const mockEnv = {
    // Mock R2 bucket - in real scenario, you need actual R2 bucket
    R2_BUCKET: {
        async get(key) {
            console.log(`[MOCK R2] Getting: ${key}`);
            // Return null to simulate missing PDF for now
            // In real test, you'd need to have the PDF uploaded
            return null;
        },
        async put(key, value, options) {
            console.log(`[MOCK R2] Putting: ${key}`);
            console.log(`[MOCK R2] Size: ${value.length} bytes`);
            return true;
        }
    },

    // Mock D1 database
    DB: {
        prepare(sql) {
            console.log(`[MOCK DB] SQL: ${sql}`);
            return {
                bind(...args) {
                    console.log(`[MOCK DB] Bound values:`, args);
                    return {
                        async run() {
                            console.log(`[MOCK DB] Query executed`);
                            return { success: true };
                        },
                        async first() {
                            console.log(`[MOCK DB] Query executed (first)`);
                            return null;
                        }
                    };
                }
            };
        }
    },

    // Mock Resend API key
    RESEND_API_KEY: 'YOUR_RESEND_API_KEY_HERE' // Replace with actual key for real test
};

/**
 * Create mock request object
 */
function createMockRequest(data) {
    return {
        method: 'POST',
        async json() {
            return data;
        }
    };
}

/**
 * Run test
 */
async function runTest() {
    console.log('='.repeat(60));
    console.log('BOOK PURCHASE TEST - Email to rossen@kinov.com');
    console.log('='.repeat(60));
    console.log('');

    // Test data for different languages
    const testCases = [
        {
            name: 'English (USD)',
            data: {
                email: 'rossen@kinov.com',
                name: 'Rossen Kinov',
                language: 'en',
                amount: '25.00',
                currency: 'USD',
                paypalOrderId: 'TEST-PAYPAL-ORDER-EN-' + Date.now()
            }
        },
        {
            name: 'German (EUR)',
            data: {
                email: 'rossen@kinov.com',
                name: 'Rossen Kinov',
                language: 'de',
                amount: '25.00',
                currency: 'EUR',
                paypalOrderId: 'TEST-PAYPAL-ORDER-DE-' + Date.now()
            }
        },
        {
            name: 'French (EUR)',
            data: {
                email: 'rossen@kinov.com',
                name: 'Rossen Kinov',
                language: 'fr',
                amount: '25.00',
                currency: 'EUR',
                paypalOrderId: 'TEST-PAYPAL-ORDER-FR-' + Date.now()
            }
        },
        {
            name: 'Bulgarian (EUR)',
            data: {
                email: 'rossen@kinov.com',
                name: 'Rossen Kinov',
                language: 'bg',
                amount: '25.00',
                currency: 'EUR',
                paypalOrderId: 'TEST-PAYPAL-ORDER-BG-' + Date.now()
            }
        }
    ];

    // Run one test (change index to test different languages)
    const testCase = testCases[0]; // Testing English version

    console.log(`Test Case: ${testCase.name}`);
    console.log('Request Data:', JSON.stringify(testCase.data, null, 2));
    console.log('');

    try {
        const mockRequest = createMockRequest(testCase.data);
        const response = await handleBookPurchase(mockRequest, mockEnv);

        console.log('Response Status:', response.status);
        const responseData = await response.json();
        console.log('Response Data:', JSON.stringify(responseData, null, 2));
        console.log('');

        if (responseData.success) {
            console.log('✓ Test PASSED');
            console.log('');
            console.log('NOTE: For a complete test with PDF watermarking and email sending:');
            console.log('1. Upload the master PDF to R2: books/master/JAZZ_TRUMPET_MASTER_CLASS.pdf');
            console.log('2. Set RESEND_API_KEY environment variable with your actual API key');
            console.log('3. Deploy the worker to Cloudflare and test with actual R2 bucket');
        } else {
            console.log('✗ Test FAILED:', responseData.message);
        }

    } catch (error) {
        console.error('✗ Test ERROR:', error.message);
        console.error(error.stack);
    }

    console.log('');
    console.log('='.repeat(60));
}

// Run the test
runTest().catch(console.error);
