/**
 * Main Cloudflare Worker
 * Routes API requests to appropriate handlers
 */

import { handleNewsletter } from './newsletter.js';
import { handleContact } from './contact.js';
import { handlePayPalNotification } from './paypal-notify.js';
import { generateCSRFToken, jsonResponse, handleCORS } from './utils.js';

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
    // Route based on pathname
    switch (url.pathname) {
      case '/api/newsletter':
        return await handleNewsletter(request, env);

      case '/api/contact':
        return await handleContact(request, env);

      case '/api/paypal-notify':
        return await handlePayPalNotification(request, env);

      case '/api/csrf-token':
        // Generate and return CSRF token
        const token = generateCSRFToken();
        return jsonResponse(true, 'Token generated', {
          csrf_token: token,
          expires: Date.now() + 3600000 // 1 hour
        });

      default:
        return jsonResponse(false, 'Endpoint not found', {}, 404);
    }
  } catch (error) {
    console.error('API Error:', error);
    return jsonResponse(false, 'Internal server error', {}, 500);
  }
}
