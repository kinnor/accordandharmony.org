/**
 * Main Cloudflare Worker
 * Routes API requests to appropriate handlers
 */

import { handleNewsletter } from './newsletter.js';
import { handleContact } from './contact.js';
import { handlePayPalNotification } from './paypal-notify.js';
import { handleBookPurchase } from './book-purchase.js';
import { handleBookDownload } from './download-book.js';
import { handleTestEmail } from './test-email.js';
import { generateCSRFToken, jsonResponse, handleCORS } from './utils.js';
import { authenticateRequest } from './auth.js';

// Authentication endpoints
import {
  handleRegister,
  handleLogin,
  handleRefreshToken,
  handleLogout,
  handleGoogleAuth,
  handleFacebookAuth,
  handleGetMe
} from './auth-endpoints.js';

// Payment endpoints
import {
  handleGetProducts,
  handleGetProduct,
  handleBookCheckout,
  handleDonationCheckout,
  handleStripeWebhookEndpoint,
  handleGetCheckoutSession,
  handleGetTransactions
} from './payment-endpoints.js';

// Download endpoints
import {
  handleDownload,
  handleDownloadInfo,
  handleResendDownloadLink
} from './download-endpoint.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle CORS preflight for all API routes
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    // Route API requests
    if (url.pathname.startsWith('/api/')) {
      return handleAPIRequest(request, env, url);
    }

    // If not an API request, return 404
    return new Response('Not Found', { status: 404 });
  }
};

async function handleAPIRequest(request, env, url) {
  try {
    const method = request.method;

    // ========================================
    // Public endpoints (no authentication required)
    // ========================================

    // Legacy endpoints
    if (url.pathname === '/api/newsletter' && method === 'POST') {
      return await handleNewsletter(request, env);
    }

    if (url.pathname === '/api/contact' && method === 'POST') {
      return await handleContact(request, env);
    }

    if (url.pathname === '/api/paypal-notify' && method === 'POST') {
      return await handlePayPalNotification(request, env);
    }

    // CSRF token
    if (url.pathname === '/api/csrf-token' && method === 'GET') {
      const token = generateCSRFToken();
      return jsonResponse(true, 'Token generated', {
        csrf_token: token,
        expires: Date.now() + 3600000
      });
    }

    // Authentication endpoints
    if (url.pathname === '/api/auth/register' && method === 'POST') {
      return await handleRegister(request, env);
    }

    if (url.pathname === '/api/auth/login' && method === 'POST') {
      return await handleLogin(request, env);
    }

    if (url.pathname === '/api/auth/refresh' && method === 'POST') {
      return await handleRefreshToken(request, env);
    }

    if (url.pathname === '/api/auth/logout' && method === 'POST') {
      return await handleLogout(request, env);
    }

    if (url.pathname === '/api/auth/google' && method === 'POST') {
      return await handleGoogleAuth(request, env);
    }

    if (url.pathname === '/api/auth/facebook' && method === 'POST') {
      return await handleFacebookAuth(request, env);
    }

    // Product endpoints (public)
    if (url.pathname === '/api/products' && method === 'GET') {
      return await handleGetProducts(request, env);
    }

    if (url.pathname.startsWith('/api/products/') && method === 'GET') {
      const productId = url.pathname.split('/')[3];
      return await handleGetProduct(request, env, productId);
    }

    // Download endpoints (public but token-protected)
    if (url.pathname === '/api/download' && method === 'GET') {
      return await handleDownload(request, env);
    }

    if (url.pathname === '/api/download/info' && method === 'GET') {
      return await handleDownloadInfo(request, env);
    }

    // Book purchase endpoint (PayPal direct)
    if (url.pathname === '/api/book-purchase' && method === 'POST') {
      return await handleBookPurchase(request, env);
    }

    // Book download endpoint (token-based)
    if (url.pathname.startsWith('/api/download-book/') && method === 'GET') {
      const token = url.pathname.split('/')[3];
      return await handleBookDownload(token, env);
    }

    // Test email endpoint (for development/testing)
    if (url.pathname === '/api/test-email' && method === 'POST') {
      return await handleTestEmail(request, env);
    }

    // Stripe webhook (public but signature-verified)
    if (url.pathname === '/api/webhooks/stripe' && method === 'POST') {
      return await handleStripeWebhookEndpoint(request, env);
    }

    // ========================================
    // Protected endpoints (authentication required)
    // ========================================

    // Authenticate request for protected routes
    const authResult = await authenticateRequest(request, env);

    if (url.pathname === '/api/auth/me' && method === 'GET') {
      return await handleGetMe(request, env, authResult);
    }

    if (url.pathname === '/api/checkout/book' && method === 'POST') {
      return await handleBookCheckout(request, env, authResult);
    }

    if (url.pathname === '/api/checkout/donation' && method === 'POST') {
      return await handleDonationCheckout(request, env, authResult);
    }

    if (url.pathname.startsWith('/api/checkout/session/') && method === 'GET') {
      const sessionId = url.pathname.split('/')[4];
      return await handleGetCheckoutSession(request, env, authResult, sessionId);
    }

    if (url.pathname === '/api/transactions' && method === 'GET') {
      return await handleGetTransactions(request, env, authResult);
    }

    if (url.pathname === '/api/download/resend' && method === 'POST') {
      return await handleResendDownloadLink(request, env, authResult);
    }

    // No matching route
    return jsonResponse(false, 'Endpoint not found', {}, 404);

  } catch (error) {
    console.error('API Error:', error);
    return jsonResponse(false, 'Internal server error', { error: error.message }, 500);
  }
}
