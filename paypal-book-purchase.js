/**
 * PayPal Book Purchase Integration
 * Integrates with existing /api/book-purchase endpoint
 */

const BOOK_PRODUCT_ID = 'jazz-trumpet-masterclass-2025';
const BOOK_PRICE = 25.00; // EUR price from database
const BOOK_CURRENCY = 'EUR';

document.addEventListener('DOMContentLoaded', () => {
  initPayPalBookPurchase();
});

/**
 * Initialize PayPal button for book purchase
 */
function initPayPalBookPurchase() {
  const purchaseBtn = document.getElementById('purchase-book-btn');
  if (!purchaseBtn) return;

  purchaseBtn.addEventListener('click', handleBookPurchaseClick);
}

/**
 * Handle book purchase button click
 */
async function handleBookPurchaseClick() {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    showAuthModal();
    return;
  }

  // Show PayPal modal
  showPayPalModal();
}

/**
 * Show PayPal payment modal
 */
function showPayPalModal() {
  // Create modal if it doesn't exist
  let modal = document.getElementById('paypal-book-modal');

  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'paypal-book-modal';
    modal.className = 'auth-modal';
    modal.innerHTML = `
      <div class="auth-modal-overlay"></div>
      <div class="auth-modal-content" style="max-width: 500px;">
        <button class="auth-modal-close" onclick="closePayPalModal()">&times;</button>
        <h2 style="margin-bottom: 1rem;">Complete Your Purchase</h2>
        <div class="book-summary" style="background: #f5f5f5; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
          <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">Jazz Trumpet Master Class</h3>
          <p style="margin: 0; color: #666; font-size: 0.9rem;">Digital PDF • Instant Download</p>
          <p style="margin: 0.5rem 0 0 0; font-size: 1.5rem; font-weight: bold; color: #1684C9;">€${BOOK_PRICE.toFixed(2)}</p>
        </div>
        <div id="paypal-book-button-container"></div>
        <p style="text-align: center; margin-top: 1rem; font-size: 0.85rem; color: #666;">
          🔒 Secure payment powered by PayPal
        </p>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Show modal
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Render PayPal button
  renderPayPalBookButton();
}

/**
 * Close PayPal modal
 */
window.closePayPalModal = function() {
  const modal = document.getElementById('paypal-book-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
};

/**
 * Render PayPal button for book purchase
 */
function renderPayPalBookButton() {
  const container = document.getElementById('paypal-book-button-container');
  if (!container) return;

  // Check if PayPal SDK is loaded
  if (typeof paypal === 'undefined') {
    container.innerHTML = `
      <div style="text-align: center; padding: 20px; background: #ffebee; border-radius: 5px; color: #d32f2f;">
        <p style="margin: 0;">PayPal SDK not loaded. Please refresh the page.</p>
      </div>
    `;
    return;
  }

  // Clear container
  container.innerHTML = '';

  // Render PayPal button
  paypal.Buttons({
    style: {
      layout: 'vertical',
      color: 'gold',
      shape: 'rect',
      label: 'paypal'
    },

    createOrder: function(data, actions) {
      return actions.order.create({
        purchase_units: [{
          description: 'Jazz Trumpet Master Class - Digital PDF',
          amount: {
            currency_code: BOOK_CURRENCY,
            value: BOOK_PRICE.toFixed(2)
          }
        }]
      });
    },

    onApprove: async function(data, actions) {
      // Capture the payment
      const details = await actions.order.capture();

      // Get current user
      const user = getCurrentUser();

      // Close PayPal modal
      closePayPalModal();

      // Show processing message
      showMessage('Processing your purchase...', 'info');

      // Process book purchase via API
      await processBookPurchase({
        email: user.email,
        name: user.full_name,
        language: 'en', // TODO: Get from user preference or browser
        amount: BOOK_PRICE.toString(),
        currency: BOOK_CURRENCY,
        paypalOrderId: details.id
      });
    },

    onError: function(err) {
      console.error('PayPal error:', err);
      showMessage('Payment failed. Please try again.', 'error');
      closePayPalModal();
    },

    onCancel: function(data) {
      showMessage('Payment canceled.', 'info');
      closePayPalModal();
    }
  }).render('#paypal-book-button-container');
}

/**
 * Process book purchase via API
 */
async function processBookPurchase(purchaseData) {
  try {
    const API_BASE = window.CONFIG?.api.baseUrl || 'https://accordandharmony.org/api';

    const response = await fetch(`${API_BASE}/book-purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(purchaseData)
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Purchase failed');
    }

    // Show success message
    showPurchaseSuccess(data.data);

  } catch (error) {
    console.error('Book purchase error:', error);
    showMessage(error.message || 'Failed to process purchase. Please contact support.', 'error');
  }
}

/**
 * Show purchase success message
 */
function showPurchaseSuccess(purchaseData) {
  const message = `
    <div style="text-align: center;">
      <h3 style="color: #4CAF50; margin-bottom: 1rem;">🎉 Purchase Successful!</h3>
      <p>Receipt Number: <strong>${purchaseData.receiptNumber}</strong></p>
      <p>Check your email for the download link.</p>
      <p style="font-size: 0.9rem; color: #666; margin-top: 1rem;">
        Link expires in 48 hours.
      </p>
    </div>
  `;

  showMessage(message, 'success');

  // Optionally show detailed success modal
  setTimeout(() => {
    alert(`✅ Thank you for your purchase!\n\nReceipt: ${purchaseData.receiptNumber}\n\nA download link has been sent to your email.\n\nThe link is valid for 48 hours.`);
  }, 2000);
}
