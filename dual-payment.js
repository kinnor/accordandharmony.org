/**
 * Dual Payment Integration - PayPal + Stripe
 * Allows customers to choose their preferred payment method
 */

const BOOK_PRODUCT_ID = 'jazz-trumpet-masterclass-2025';
const BOOK_PRICE = 25.00;
const BOOK_CURRENCY = 'EUR';

document.addEventListener('DOMContentLoaded', () => {
  initDualPayment();
});

/**
 * Initialize payment button
 */
function initDualPayment() {
  const purchaseBtn = document.getElementById('purchase-book-btn');
  if (!purchaseBtn) return;

  purchaseBtn.addEventListener('click', handlePurchaseClick);
}

/**
 * Handle purchase button click
 */
async function handlePurchaseClick() {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    showAuthModal();
    return;
  }

  // Show payment method selection modal
  showPaymentMethodModal();
}

/**
 * Show payment method selection modal
 */
function showPaymentMethodModal() {
  let modal = document.getElementById('payment-method-modal');

  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'payment-method-modal';
    modal.className = 'auth-modal';
    modal.innerHTML = `
      <div class="auth-modal-overlay" onclick="closePaymentModal()"></div>
      <div class="auth-modal-content" style="max-width: 600px;">
        <button class="auth-modal-close" onclick="closePaymentModal()">&times;</button>

        <h2 style="margin-bottom: 0.5rem; text-align: center;">Complete Your Purchase</h2>
        <p style="text-align: center; color: #666; margin-bottom: 2rem;">Choose your preferred payment method</p>

        <div class="book-summary" style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; text-align: center;">
          <h3 style="margin: 0 0 0.5rem 0; font-size: 1.2rem; color: #1684C9;">Jazz Trumpet Master Class</h3>
          <p style="margin: 0; color: #555; font-size: 0.95rem;">Digital PDF • Instant Download • Tax-Deductible</p>
          <p style="margin: 1rem 0 0 0; font-size: 2rem; font-weight: bold; color: #1684C9;">€${BOOK_PRICE.toFixed(2)}</p>
        </div>

        <div class="payment-methods" style="display: grid; gap: 1rem;">

          <!-- Stripe Credit/Debit Card Option -->
          <div class="payment-option" style="border: 2px solid #e0e0e0; border-radius: 12px; padding: 1.5rem; cursor: pointer; transition: all 0.3s;" onclick="selectPaymentMethod('stripe')">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #635BFF 0%, #4F46E5 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                  </svg>
                </div>
                <div>
                  <h4 style="margin: 0; font-size: 1.1rem;">Credit or Debit Card</h4>
                  <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: #666;">Visa, Mastercard, Amex</p>
                </div>
              </div>
              <div class="radio-indicator" style="width: 24px; height: 24px; border: 2px solid #ccc; border-radius: 50%;"></div>
            </div>
          </div>

          <!-- PayPal Option -->
          <div class="payment-option" style="border: 2px solid #e0e0e0; border-radius: 12px; padding: 1.5rem; cursor: pointer; transition: all 0.3s;" onclick="selectPaymentMethod('paypal')">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #0070BA 0%, #1546A0 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .76-.653h5.555c1.833 0 3.312.308 4.395.916 1.059.594 1.79 1.57 2.125 2.834.166.626.232 1.32.186 2.006-.015.238-.037.48-.067.716-.38 2.998-2.25 4.867-5.28 5.28l-.524.051h-1.964a.642.642 0 0 0-.633.74l-.545 3.465h3.032l-.308 1.95h-2.724a.642.642 0 0 1-.633-.74l.41-2.598c.017-.109-.006-.22-.066-.32a.641.641 0 0 0-.296-.215l-.15-.044c-.228-.07-.47-.1-.71-.09H7.076z"/>
                  </svg>
                </div>
                <div>
                  <h4 style="margin: 0; font-size: 1.1rem;">PayPal</h4>
                  <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: #666;">Pay with your PayPal account</p>
                </div>
              </div>
              <div class="radio-indicator" style="width: 24px; height: 24px; border: 2px solid #ccc; border-radius: 50%;"></div>
            </div>
          </div>

        </div>

        <button id="continue-payment-btn" onclick="continueWithSelectedPayment()" disabled style="width: 100%; margin-top: 2rem; padding: 1rem; font-size: 1.1rem; font-weight: 600; border: none; border-radius: 8px; background: #ccc; color: white; cursor: not-allowed; transition: all 0.3s;">
          Continue
        </button>

        <p style="text-align: center; margin-top: 1.5rem; font-size: 0.85rem; color: #666;">
          🔒 Secure payment • 100% supports children's education
        </p>
      </div>
    `;
    document.body.appendChild(modal);

    // Add hover effects
    addPaymentOptionStyles();
  }

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Reset selection
  window.selectedPaymentMethod = null;
  updatePaymentSelection();
}

/**
 * Add styles for payment options
 */
function addPaymentOptionStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .payment-option:hover {
      border-color: #1684C9 !important;
      background: #f8fbff;
    }
    .payment-option.selected {
      border-color: #1684C9 !important;
      background: #f0f8ff !important;
    }
    .payment-option.selected .radio-indicator {
      border-color: #1684C9 !important;
      background: #1684C9;
      box-shadow: inset 0 0 0 4px white;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Select payment method
 */
window.selectPaymentMethod = function(method) {
  window.selectedPaymentMethod = method;
  updatePaymentSelection();
};

/**
 * Update payment selection UI
 */
function updatePaymentSelection() {
  const options = document.querySelectorAll('.payment-option');
  const continueBtn = document.getElementById('continue-payment-btn');

  options.forEach(option => {
    option.classList.remove('selected');
  });

  if (window.selectedPaymentMethod) {
    const selectedOption = window.selectedPaymentMethod === 'stripe' ? options[0] : options[1];
    selectedOption.classList.add('selected');
    continueBtn.disabled = false;
    continueBtn.style.background = 'linear-gradient(135deg, #1684C9 0%, #2E9DD8 100%)';
    continueBtn.style.cursor = 'pointer';
  } else {
    continueBtn.disabled = true;
    continueBtn.style.background = '#ccc';
    continueBtn.style.cursor = 'not-allowed';
  }
}

/**
 * Continue with selected payment method
 */
window.continueWithSelectedPayment = function() {
  if (!window.selectedPaymentMethod) return;

  closePaymentModal();

  if (window.selectedPaymentMethod === 'stripe') {
    processStripeCheckout();
  } else {
    processPayPalCheckout();
  }
};

/**
 * Process Stripe checkout
 */
async function processStripeCheckout() {
  try {
    showMessage('Redirecting to secure checkout...', 'info');

    const API_BASE = window.CONFIG?.api.baseUrl || 'https://accordandharmony.org/api';
    const user = getCurrentUser();

    const response = await authFetch(`${API_BASE}/checkout/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: BOOK_PRODUCT_ID })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to create checkout session');
    }

    // Redirect to Stripe Checkout
    window.location.href = data.data.sessionUrl;

  } catch (error) {
    console.error('Stripe checkout error:', error);
    showMessage(error.message || 'Failed to process payment. Please try again.', 'error');
  }
}

/**
 * Process PayPal checkout
 */
function processPayPalCheckout() {
  // Reuse existing PayPal modal logic
  showPayPalCheckoutModal();
}

/**
 * Show PayPal checkout modal
 */
function showPayPalCheckoutModal() {
  let modal = document.getElementById('paypal-checkout-modal');

  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'paypal-checkout-modal';
    modal.className = 'auth-modal';
    modal.innerHTML = `
      <div class="auth-modal-overlay" onclick="closePayPalCheckoutModal()"></div>
      <div class="auth-modal-content" style="max-width: 500px;">
        <button class="auth-modal-close" onclick="closePayPalCheckoutModal()">&times;</button>
        <h2 style="margin-bottom: 1rem; text-align: center;">PayPal Checkout</h2>
        <div class="book-summary" style="background: #f5f5f5; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; text-align: center;">
          <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">Jazz Trumpet Master Class</h3>
          <p style="margin: 0; color: #666; font-size: 0.9rem;">Digital PDF • Instant Download</p>
          <p style="margin: 0.5rem 0 0 0; font-size: 1.5rem; font-weight: bold; color: #1684C9;">€${BOOK_PRICE.toFixed(2)}</p>
        </div>
        <div id="paypal-checkout-button-container"></div>
        <p style="text-align: center; margin-top: 1rem; font-size: 0.85rem; color: #666;">
          🔒 Secure payment powered by PayPal
        </p>
      </div>
    `;
    document.body.appendChild(modal);
  }

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Render PayPal button
  renderPayPalButton();
}

/**
 * Render PayPal button
 */
function renderPayPalButton() {
  const container = document.getElementById('paypal-checkout-button-container');
  if (!container) return;

  if (typeof paypal === 'undefined') {
    container.innerHTML = '<p style="text-align: center; padding: 20px; background: #ffebee; border-radius: 5px; color: #d32f2f;">PayPal SDK not loaded. Please refresh the page.</p>';
    return;
  }

  container.innerHTML = '';

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
      const details = await actions.order.capture();
      const user = getCurrentUser();

      closePayPalCheckoutModal();
      showMessage('Processing your purchase...', 'info');

      await processBookPurchase({
        email: user.email,
        name: user.full_name,
        language: 'en',
        amount: BOOK_PRICE.toString(),
        currency: BOOK_CURRENCY,
        paypalOrderId: details.id
      });
    },

    onError: function(err) {
      console.error('PayPal error:', err);
      showMessage('Payment failed. Please try again.', 'error');
      closePayPalCheckoutModal();
    },

    onCancel: function(data) {
      showMessage('Payment canceled.', 'info');
      closePayPalCheckoutModal();
    }
  }).render('#paypal-checkout-button-container');
}

/**
 * Process book purchase via API
 */
async function processBookPurchase(purchaseData) {
  try {
    const API_BASE = window.CONFIG?.api.baseUrl || 'https://accordandharmony.org/api';

    const response = await fetch(`${API_BASE}/book-purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(purchaseData)
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Purchase failed');
    }

    showPurchaseSuccess(data.data);

  } catch (error) {
    console.error('Book purchase error:', error);
    showMessage(error.message || 'Failed to process purchase. Please contact support.', 'error');
  }
}

/**
 * Show purchase success
 */
function showPurchaseSuccess(purchaseData) {
  showMessage(`✅ Purchase successful! Receipt: ${purchaseData.receiptNumber}. Check your email for the download link.`, 'success');

  setTimeout(() => {
    alert(`🎉 Thank you for your purchase!\n\nReceipt: ${purchaseData.receiptNumber}\n\nA download link has been sent to your email.\n\nThe link is valid for 48 hours.`);
  }, 1500);
}

/**
 * Close payment modal
 */
window.closePaymentModal = function() {
  const modal = document.getElementById('payment-method-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
};

/**
 * Close PayPal checkout modal
 */
window.closePayPalCheckoutModal = function() {
  const modal = document.getElementById('paypal-checkout-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
};
