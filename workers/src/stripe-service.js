/**
 * Stripe Payment Service
 * Handles Stripe Checkout, payment intents, and webhooks
 */

import Stripe from 'stripe';
import { TransactionDB, ProductDB, DownloadDB, AuditLogDB, EmailLogDB } from './db.js';
import { sendPurchaseConfirmationEmail } from './email-service.js';
import { nanoid } from 'nanoid';

/**
 * Initialize Stripe with secret key
 */
function getStripeClient(env) {
  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
  });
}

/**
 * Create Stripe Checkout Session for book purchase
 */
export async function createBookCheckoutSession(env, { userId, productId, userEmail, userName, currency, amount }) {
  try {
    const stripe = getStripeClient(env);

    // Get product details
    const productResult = await ProductDB.findById(env.DB, productId);
    if (!productResult.success || !productResult.result) {
      return {
        success: false,
        error: 'Product not found'
      };
    }

    const product = productResult.result;

    // Use provided currency/amount or fall back to product defaults
    const finalCurrency = currency || product.currency;
    const finalAmount = amount ? Math.round(amount * 100) : product.price_cents;

    // Create transaction record (pending)
    const transactionResult = await TransactionDB.create(env.DB, {
      user_id: userId,
      product_id: productId,
      amount_cents: finalAmount,
      currency: finalCurrency,
      payment_method: 'stripe',
      payment_status: 'pending',
      transaction_type: 'product_purchase',
      is_recurring: 0
    });

    if (!transactionResult.success) {
      return {
        success: false,
        error: 'Failed to create transaction'
      };
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      client_reference_id: transactionResult.transactionId,
      line_items: [
        {
          price_data: {
            currency: finalCurrency.toLowerCase(),
            unit_amount: finalAmount,
            product_data: {
              name: product.name,
              description: product.description,
              metadata: {
                product_id: productId,
                product_type: product.product_type
              }
            }
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${env.FRONTEND_URL}/donate.html?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.FRONTEND_URL}/donate.html?purchase=canceled`,
      metadata: {
        transaction_id: transactionResult.transactionId,
        user_id: userId,
        product_id: productId,
        user_name: userName
      },
      payment_intent_data: {
        metadata: {
          transaction_id: transactionResult.transactionId,
          user_id: userId,
          product_id: productId
        }
      }
    });

    // Update transaction with Stripe session ID
    await TransactionDB.updateStripeInfo(env.DB, transactionResult.transactionId, {
      session_id: session.id,
      customer_id: session.customer || null,
      payment_intent_id: null // Will be set when payment completes
    });

    return {
      success: true,
      sessionId: session.id,
      sessionUrl: session.url,
      transactionId: transactionResult.transactionId
    };

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create checkout session'
    };
  }
}

/**
 * Create Stripe Checkout Session for donation
 */
export async function createDonationCheckoutSession(env, { userId, amount, currency, recurring, userEmail }) {
  try {
    const stripe = getStripeClient(env);

    const amountCents = Math.round(amount * 100);

    // Create transaction record (pending)
    const transactionResult = await TransactionDB.create(env.DB, {
      user_id: userId,
      product_id: null,
      amount_cents: amountCents,
      currency: currency || 'EUR',
      payment_method: 'stripe',
      payment_status: 'pending',
      transaction_type: 'donation',
      is_recurring: recurring ? 1 : 0
    });

    if (!transactionResult.success) {
      return {
        success: false,
        error: 'Failed to create transaction'
      };
    }

    const sessionConfig = {
      customer_email: userEmail,
      client_reference_id: transactionResult.transactionId,
      line_items: [
        {
          price_data: {
            currency: (currency || 'EUR').toLowerCase(),
            unit_amount: amountCents,
            product_data: {
              name: 'Donation to Accord and Harmony Foundation',
              description: recurring ? 'Monthly recurring donation' : 'One-time donation'
            },
            recurring: recurring ? { interval: 'month' } : undefined
          },
          quantity: 1
        }
      ],
      mode: recurring ? 'subscription' : 'payment',
      success_url: `${env.FRONTEND_URL}/donation-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.FRONTEND_URL}/donate.html?donation=canceled`,
      metadata: {
        transaction_id: transactionResult.transactionId,
        user_id: userId,
        transaction_type: 'donation'
      }
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Update transaction with Stripe session ID
    await TransactionDB.updateStripeInfo(env.DB, transactionResult.transactionId, {
      session_id: session.id,
      customer_id: session.customer || null,
      payment_intent_id: null
    });

    return {
      success: true,
      sessionId: session.id,
      sessionUrl: session.url,
      transactionId: transactionResult.transactionId
    };

  } catch (error) {
    console.error('Stripe donation checkout error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create donation checkout'
    };
  }
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(payload, signature, webhookSecret) {
  try {
    const stripe = new Stripe('', { apiVersion: '2023-10-16' }); // No key needed for verification
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return null;
  }
}

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(env, event) {
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        return await handleCheckoutCompleted(env, event.data.object);

      case 'payment_intent.succeeded':
        return await handlePaymentSucceeded(env, event.data.object);

      case 'payment_intent.payment_failed':
        return await handlePaymentFailed(env, event.data.object);

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        return await handleSubscriptionUpdated(env, event.data.object);

      case 'customer.subscription.deleted':
        return await handleSubscriptionCanceled(env, event.data.object);

      default:
        console.log(`Unhandled event type: ${event.type}`);
        return { success: true, message: 'Event not handled' };
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutCompleted(env, session) {
  const transactionId = session.client_reference_id || session.metadata?.transaction_id;

  if (!transactionId) {
    console.error('No transaction ID in checkout session');
    return { success: false, error: 'Missing transaction ID' };
  }

  // Update transaction with payment intent ID
  if (session.payment_intent) {
    await TransactionDB.updateStripeInfo(env.DB, transactionId, {
      payment_intent_id: session.payment_intent,
      customer_id: session.customer,
      session_id: session.id
    });
  }

  // For subscriptions, mark as completed immediately
  if (session.mode === 'subscription') {
    await TransactionDB.markCompleted(env.DB, transactionId);
  }

  return { success: true };
}

/**
 * Handle payment_intent.succeeded event
 */
async function handlePaymentSucceeded(env, paymentIntent) {
  const transactionId = paymentIntent.metadata?.transaction_id;

  if (!transactionId) {
    console.error('No transaction ID in payment intent');
    return { success: false, error: 'Missing transaction ID' };
  }

  // Mark transaction as completed
  await TransactionDB.markCompleted(env.DB, transactionId);

  // Get transaction details
  const txQuery = `
    SELECT t.*, u.email, u.full_name, p.name as product_name, p.id as product_id
    FROM transactions t
    JOIN users u ON t.user_id = u.id
    LEFT JOIN products p ON t.product_id = p.id
    WHERE t.id = ?
  `;

  const result = await env.DB.prepare(txQuery).bind(transactionId).first();

  if (!result) {
    console.error('Transaction not found:', transactionId);
    return { success: false, error: 'Transaction not found' };
  }

  // If this is a product purchase, create download record
  if (result.transaction_type === 'product_purchase' && result.product_id) {
    const downloadToken = nanoid(32);

    // Generate watermark text
    const watermarkText = `Licensed to: ${result.full_name}\nEmail: ${result.email}\nPurchase Date: ${new Date().toISOString().split('T')[0]}\n\nThis copy is for personal use only.\nUnauthorized distribution is prohibited.\n\nAccord and Harmony Foundation\nwww.accordandharmony.org`;

    // Create download record
    await DownloadDB.create(env.DB, {
      user_id: result.user_id,
      transaction_id: transactionId,
      product_id: result.product_id,
      download_token: downloadToken,
      watermark_text: watermarkText
    });

    // Increment product sales count
    await ProductDB.incrementSales(env.DB, result.product_id);

    // Send purchase confirmation email with download link
    await sendPurchaseConfirmationEmail(env, {
      to: result.email,
      userName: result.full_name,
      productName: result.product_name,
      amount: result.amount_cents / 100,
      currency: result.currency,
      downloadToken: downloadToken,
      transactionId: transactionId
    });

    // Log audit trail
    await AuditLogDB.create(env.DB, {
      user_id: result.user_id,
      action_type: 'purchase_completed',
      entity_type: 'transaction',
      entity_id: transactionId,
      changes: {
        product_id: result.product_id,
        amount: result.amount_cents,
        download_token: downloadToken
      }
    });

  } else {
    // Regular donation - send thank you email
    await sendPurchaseConfirmationEmail(env, {
      to: result.email,
      userName: result.full_name,
      productName: null, // No product for donations
      amount: result.amount_cents / 100,
      currency: result.currency,
      downloadToken: null,
      transactionId: transactionId,
      isDonation: true
    });

    // Log audit trail
    await AuditLogDB.create(env.DB, {
      user_id: result.user_id,
      action_type: 'donation_completed',
      entity_type: 'transaction',
      entity_id: transactionId,
      changes: {
        amount: result.amount_cents,
        recurring: result.is_recurring
      }
    });
  }

  return { success: true };
}

/**
 * Handle payment_intent.payment_failed event
 */
async function handlePaymentFailed(env, paymentIntent) {
  const transactionId = paymentIntent.metadata?.transaction_id;

  if (!transactionId) {
    return { success: false, error: 'Missing transaction ID' };
  }

  // Update transaction status to failed
  await env.DB.prepare(`
    UPDATE transactions
    SET payment_status = 'failed',
        updated_at = ?
    WHERE id = ?
  `).bind(new Date().toISOString(), transactionId).run();

  // Log audit trail
  const txResult = await env.DB.prepare('SELECT user_id FROM transactions WHERE id = ?').bind(transactionId).first();

  if (txResult) {
    await AuditLogDB.create(env.DB, {
      user_id: txResult.user_id,
      action_type: 'payment_failed',
      entity_type: 'transaction',
      entity_id: transactionId,
      changes: {
        error: paymentIntent.last_payment_error?.message || 'Payment failed'
      }
    });
  }

  return { success: true };
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(env, subscription) {
  // Handle recurring donations
  // This would track subscription status and create transaction records for each payment

  console.log('Subscription updated:', subscription.id);
  return { success: true };
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCanceled(env, subscription) {
  // Handle canceled recurring donations

  console.log('Subscription canceled:', subscription.id);
  return { success: true };
}

/**
 * Retrieve Stripe Checkout Session
 */
export async function getCheckoutSession(env, sessionId) {
  try {
    const stripe = getStripeClient(env);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return {
      success: true,
      session
    };
  } catch (error) {
    console.error('Error retrieving session:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
