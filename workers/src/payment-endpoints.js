/**
 * Payment API Endpoints
 * Handles Stripe checkout, webhooks, and transaction management
 */

import { jsonResponse } from './utils.js';
import {
  createBookCheckoutSession,
  createDonationCheckoutSession,
  handleStripeWebhook,
  verifyWebhookSignature,
  getCheckoutSession
} from './stripe-service.js';
import { ProductDB, TransactionDB } from './db.js';

/**
 * GET /api/products
 * Get all available products
 */
export async function handleGetProducts(request, env) {
  try {
    const result = await ProductDB.getAllActive(env.DB);

    if (!result.success) {
      return jsonResponse(false, 'Failed to fetch products', {}, 500);
    }

    return jsonResponse(true, 'Products retrieved', {
      products: result.results
    });

  } catch (error) {
    console.error('Get products error:', error);
    return jsonResponse(false, 'Failed to fetch products', {}, 500);
  }
}

/**
 * GET /api/products/:id
 * Get product by ID
 */
export async function handleGetProduct(request, env, productId) {
  try {
    const result = await ProductDB.findById(env.DB, productId);

    if (!result.success || !result.result) {
      return jsonResponse(false, 'Product not found', {}, 404);
    }

    return jsonResponse(true, 'Product retrieved', {
      product: result.result
    });

  } catch (error) {
    console.error('Get product error:', error);
    return jsonResponse(false, 'Failed to fetch product', {}, 500);
  }
}

/**
 * POST /api/checkout/book
 * Create Stripe checkout session for book purchase
 * Requires authentication
 */
export async function handleBookCheckout(request, env, authResult) {
  try {
    if (!authResult.authenticated) {
      return jsonResponse(false, authResult.error, {}, authResult.status);
    }

    const body = await request.json();
    const { productId, currency, amount } = body;

    if (!productId) {
      return jsonResponse(false, 'Product ID required', {}, 400);
    }

    const user = authResult.user;

    const result = await createBookCheckoutSession(env, {
      userId: user.id,
      productId: productId,
      userEmail: user.email,
      userName: user.full_name,
      currency: currency,  // Optional: override product currency
      amount: amount       // Optional: override product price
    });

    if (!result.success) {
      return jsonResponse(false, result.error, {}, 400);
    }

    return jsonResponse(true, 'Checkout session created', {
      sessionId: result.sessionId,
      sessionUrl: result.sessionUrl,
      transactionId: result.transactionId
    });

  } catch (error) {
    console.error('Book checkout error:', error);
    return jsonResponse(false, 'Failed to create checkout session', {}, 500);
  }
}

/**
 * POST /api/checkout/donation
 * Create Stripe checkout session for donation
 * Requires authentication
 */
export async function handleDonationCheckout(request, env, authResult) {
  try {
    if (!authResult.authenticated) {
      return jsonResponse(false, authResult.error, {}, authResult.status);
    }

    const body = await request.json();
    const { amount, currency, recurring } = body;

    if (!amount || amount <= 0) {
      return jsonResponse(false, 'Valid donation amount required', {}, 400);
    }

    const user = authResult.user;

    const result = await createDonationCheckoutSession(env, {
      userId: user.id,
      amount: parseFloat(amount),
      currency: currency || 'EUR',
      recurring: recurring || false,
      userEmail: user.email
    });

    if (!result.success) {
      return jsonResponse(false, result.error, {}, 400);
    }

    return jsonResponse(true, 'Checkout session created', {
      sessionId: result.sessionId,
      sessionUrl: result.sessionUrl,
      transactionId: result.transactionId
    });

  } catch (error) {
    console.error('Donation checkout error:', error);
    return jsonResponse(false, 'Failed to create checkout session', {}, 500);
  }
}

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
export async function handleStripeWebhookEndpoint(request, env) {
  try {
    const signature = request.headers.get('stripe-signature');
    const body = await request.text();

    if (!signature) {
      return jsonResponse(false, 'No signature', {}, 400);
    }

    // Verify webhook signature
    const event = verifyWebhookSignature(body, signature, env.STRIPE_WEBHOOK_SECRET);

    if (!event) {
      return jsonResponse(false, 'Invalid signature', {}, 400);
    }

    // Handle the event
    const result = await handleStripeWebhook(env, event);

    if (!result.success) {
      console.error('Webhook handler failed:', result.error);
      return jsonResponse(false, result.error, {}, 500);
    }

    return jsonResponse(true, 'Webhook processed');

  } catch (error) {
    console.error('Stripe webhook error:', error);
    return jsonResponse(false, 'Webhook processing failed', {}, 500);
  }
}

/**
 * GET /api/checkout/session/:sessionId
 * Get checkout session details
 * Requires authentication
 */
export async function handleGetCheckoutSession(request, env, authResult, sessionId) {
  try {
    if (!authResult.authenticated) {
      return jsonResponse(false, authResult.error, {}, authResult.status);
    }

    const result = await getCheckoutSession(env, sessionId);

    if (!result.success) {
      return jsonResponse(false, result.error, {}, 404);
    }

    return jsonResponse(true, 'Session retrieved', {
      session: {
        id: result.session.id,
        status: result.session.status,
        payment_status: result.session.payment_status,
        customer_email: result.session.customer_email,
        amount_total: result.session.amount_total,
        currency: result.session.currency
      }
    });

  } catch (error) {
    console.error('Get session error:', error);
    return jsonResponse(false, 'Failed to get session', {}, 500);
  }
}

/**
 * GET /api/transactions
 * Get user's transaction history
 * Requires authentication
 */
export async function handleGetTransactions(request, env, authResult) {
  try {
    if (!authResult.authenticated) {
      return jsonResponse(false, authResult.error, {}, authResult.status);
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 50;

    const result = await TransactionDB.getUserTransactions(env.DB, authResult.user.id, limit);

    if (!result.success) {
      return jsonResponse(false, 'Failed to fetch transactions', {}, 500);
    }

    return jsonResponse(true, 'Transactions retrieved', {
      transactions: result.results
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    return jsonResponse(false, 'Failed to fetch transactions', {}, 500);
  }
}
