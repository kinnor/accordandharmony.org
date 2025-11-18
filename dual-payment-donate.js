/**
 * Dual Payment Integration for Donations - PayPal + Stripe
 * Allows donors to choose their preferred payment method
 */

document.addEventListener('DOMContentLoaded', () => {
  initDualPaymentDonations();
});

let currentDonationAmount = null;
let currentDonationCurrency = 'EUR'; // Default to EUR
let currentDonorInfo = {};

// Currency symbols mapping
const CURRENCY_SYMBOLS = {
  'USD': '$',
  'CAD': 'CA$',
  'EUR': '€',
  'GBP': '£'
};

/**
 * Initialize dual payment for donations
 */
function initDualPaymentDonations() {
  // Intercept amount button clicks
  const amountButtons = document.querySelectorAll('.donate-amount-btn');
  amountButtons.forEach(button => {
    button.addEventListener('click', handleAmountSelection);
  });

  // Intercept custom amount input
  const customAmountInput = document.getElementById('customAmount');
  if (customAmountInput) {
    customAmountInput.addEventListener('change', handleCustomAmountSelection);
  }

  // Intercept donation tier card clicks (the colored cards at top)
  const tierCards = document.querySelectorAll('.donation-tier-card');
  tierCards.forEach(card => {
    // Remove existing onclick and add new one
    card.removeAttribute('onclick');
    card.addEventListener('click', handleTierCardClick);
  });
}

/**
 * Handle amount button selection
 */
function handleAmountSelection(e) {
  e.preventDefault();
  const button = e.currentTarget;
  const amount = button.getAttribute('data-amount');

  if (amount === 'other') {
    // Let the custom amount field show
    return;
  }

  currentDonationAmount = amount;
  collectDonorInfo();
}

/**
 * Handle custom amount selection
 */
function handleCustomAmountSelection(e) {
  const amount = e.target.value;
  if (amount && parseFloat(amount) > 0) {
    currentDonationAmount = amount;
    collectDonorInfo();
  }
}

/**
 * Handle donation tier card click
 */
function handleTierCardClick(e) {
  e.stopPropagation();
  const card = e.currentTarget;
  const amount = card.getAttribute('data-amount');
  const currency = card.getAttribute('data-currency') || 'EUR';

  currentDonationAmount = amount;
  currentDonationCurrency = currency;

  collectDonorInfo();
}

/**
 * Collect donor information (optional) before showing payment method
 */
function collectDonorInfo() {
  const donorName = document.getElementById('donorName')?.value || document.getElementById('modalDonorName')?.value || '';
  const donorEmail = document.getElementById('donorEmail')?.value || document.getElementById('modalDonorEmail')?.value || '';
  const recurring = document.getElementById('recurring')?.checked || document.getElementById('modalRecurring')?.checked || false;

  currentDonorInfo = {
    name: donorName,
    email: donorEmail,
    recurring: recurring
  };

  // Show payment method selection
  showPaymentMethodModal();
}

/**
 * Show payment method selection modal
 */
function showPaymentMethodModal() {
  let modal = document.getElementById('donation-payment-method-modal');

  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'donation-payment-method-modal';
    modal.className = 'auth-modal';
    modal.innerHTML = `
      <div class="auth-modal-overlay" onclick="closeDonationPaymentModal()"></div>
      <div class="auth-modal-content" style="max-width: 600px;">
        <button class="auth-modal-close" onclick="closeDonationPaymentModal()">&times;</button>

        <h2 style="margin-bottom: 0.5rem; text-align: center;">Complete Your Donation</h2>
        <p style="text-align: center; color: #666; margin-bottom: 2rem;">Choose your preferred payment method</p>

        <div class="donation-summary" style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; text-align: center;">
          <h3 style="margin: 0 0 0.5rem 0; font-size: 1.2rem; color: #1684C9;">Support Our Mission</h3>
          <p style="margin: 0; color: #555; font-size: 0.95rem;">One-time donation • 100% goes to education programs</p>
          <p style="margin: 1rem 0 0 0; font-size: 2rem; font-weight: bold; color: #1684C9;" id="donation-amount-display">${CURRENCY_SYMBOLS[currentDonationCurrency] || '€'}${parseFloat(currentDonationAmount).toFixed(2)}</p>
        </div>

        <div class="payment-methods" style="display: grid; gap: 1rem;">

          <!-- Stripe Credit/Debit Card Option -->
          <div class="payment-option" style="border: 2px solid #e0e0e0; border-radius: 12px; padding: 1.5rem; cursor: pointer; transition: all 0.3s;" onclick="selectDonationPaymentMethod('stripe')">
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
          <div class="payment-option" style="border: 2px solid #e0e0e0; border-radius: 12px; padding: 1.5rem; cursor: pointer; transition: all 0.3s;" onclick="selectDonationPaymentMethod('paypal')">
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

        <button id="continue-donation-payment-btn" onclick="continueWithSelectedDonationPayment()" disabled style="width: 100%; margin-top: 2rem; padding: 1rem; font-size: 1.1rem; font-weight: 600; border: none; border-radius: 8px; background: #ccc; color: white; cursor: not-allowed; transition: all 0.3s;">
          Continue
        </button>

        <p style="text-align: center; margin-top: 1.5rem; font-size: 0.85rem; color: #666;">
          🔒 Secure payment • 100% supports children's education
        </p>
      </div>
    `;
    document.body.appendChild(modal);

    // Add hover effects
    addDonationPaymentOptionStyles();
  } else {
    // Update amount if modal already exists
    const amountDisplay = document.getElementById('donation-amount-display');
    if (amountDisplay) {
      amountDisplay.textContent = `${CURRENCY_SYMBOLS[currentDonationCurrency] || '€'}${parseFloat(currentDonationAmount).toFixed(2)}`;
    }
  }

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Reset selection
  window.selectedDonationPaymentMethod = null;
  updateDonationPaymentSelection();
}

/**
 * Add styles for payment options
 */
function addDonationPaymentOptionStyles() {
  const styleId = 'donation-payment-option-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    #donation-payment-method-modal .payment-option:hover {
      border-color: #1684C9 !important;
      background: #f8fbff;
    }
    #donation-payment-method-modal .payment-option.selected {
      border-color: #1684C9 !important;
      background: #f0f8ff !important;
    }
    #donation-payment-method-modal .payment-option.selected .radio-indicator {
      border-color: #1684C9 !important;
      background: #1684C9;
      box-shadow: inset 0 0 0 4px white;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Select donation payment method
 */
window.selectDonationPaymentMethod = function(method) {
  window.selectedDonationPaymentMethod = method;
  updateDonationPaymentSelection();
};

/**
 * Update payment selection UI
 */
function updateDonationPaymentSelection() {
  const modal = document.getElementById('donation-payment-method-modal');
  if (!modal) return;

  const options = modal.querySelectorAll('.payment-option');
  const continueBtn = document.getElementById('continue-donation-payment-btn');

  options.forEach(option => {
    option.classList.remove('selected');
  });

  if (window.selectedDonationPaymentMethod) {
    const selectedOption = window.selectedDonationPaymentMethod === 'stripe' ? options[0] : options[1];
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
window.continueWithSelectedDonationPayment = function() {
  if (!window.selectedDonationPaymentMethod) return;

  // Check authentication for Stripe (required by backend)
  if (window.selectedDonationPaymentMethod === 'stripe' && !isAuthenticated()) {
    closeDonationPaymentModal();
    showAuthModal();
    return;
  }

  closeDonationPaymentModal();

  if (window.selectedDonationPaymentMethod === 'stripe') {
    processDonationStripeCheckout();
  } else {
    processDonationPayPalCheckout();
  }
};

/**
 * Process Stripe checkout for donation
 */
async function processDonationStripeCheckout() {
  try {
    showDonationMessage('Redirecting to secure checkout...', 'info');

    const API_BASE = window.CONFIG?.api.baseUrl || 'https://accordandharmony.org/api';

    // Check if user is authenticated
    if (!isAuthenticated()) {
      showAuthModal();
      return;
    }

    const response = await authFetch(`${API_BASE}/checkout/donation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: currentDonationAmount,
        currency: currentDonationCurrency,
        donorName: currentDonorInfo.name || 'Anonymous',
        donorEmail: currentDonorInfo.email || '',
        recurring: currentDonorInfo.recurring || false
      })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to create checkout session');
    }

    // Redirect to Stripe Checkout
    window.location.href = data.data.sessionUrl;

  } catch (error) {
    console.error('Stripe donation checkout error:', error);
    showDonationMessage(error.message || 'Failed to process donation. Please try again.', 'error');
  }
}

/**
 * Process PayPal checkout for donation
 */
function processDonationPayPalCheckout() {
  showDonationPayPalCheckoutModal();
}

/**
 * Show PayPal checkout modal
 */
function showDonationPayPalCheckoutModal() {
  let modal = document.getElementById('donation-paypal-checkout-modal');

  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'donation-paypal-checkout-modal';
    modal.className = 'auth-modal';
    modal.innerHTML = `
      <div class="auth-modal-overlay" onclick="closeDonationPayPalCheckoutModal()"></div>
      <div class="auth-modal-content" style="max-width: 500px;">
        <button class="auth-modal-close" onclick="closeDonationPayPalCheckoutModal()">&times;</button>
        <h2 style="margin-bottom: 1rem; text-align: center;">PayPal Donation</h2>
        <div class="donation-summary" style="background: #f5f5f5; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; text-align: center;">
          <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">Support Our Mission</h3>
          <p style="margin: 0; color: #666; font-size: 0.9rem;">One-time donation</p>
          <p style="margin: 0.5rem 0 0 0; font-size: 1.5rem; font-weight: bold; color: #1684C9;">${CURRENCY_SYMBOLS[currentDonationCurrency] || '€'}${parseFloat(currentDonationAmount).toFixed(2)}</p>
        </div>
        <div id="donation-paypal-checkout-button-container"></div>
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
  renderDonationPayPalButton();
}

/**
 * Render PayPal button for donation
 */
function renderDonationPayPalButton() {
  const container = document.getElementById('donation-paypal-checkout-button-container');
  if (!container) return;

  if (typeof paypal === 'undefined') {
    container.innerHTML = '<p style="text-align: center; padding: 20px; background: #ffebee; border-radius: 5px; color: #d32f2f;">PayPal SDK not loaded. Please refresh the page.</p>';
    return;
  }

  container.innerHTML = '';

  paypal.Buttons({
    style: {
      layout: 'vertical',
      color: 'blue',
      shape: 'rect',
      label: 'donate'
    },

    createOrder: function(data, actions) {
      return actions.order.create({
        purchase_units: [{
          description: 'Donation to Accord and Harmony Foundation',
          amount: {
            currency_code: currentDonationCurrency,
            value: parseFloat(currentDonationAmount).toFixed(2)
          }
        }]
      });
    },

    onApprove: async function(data, actions) {
      const details = await actions.order.capture();

      closeDonationPayPalCheckoutModal();
      showDonationMessage('Processing your donation...', 'info');

      // Send notification to foundation API
      const API_BASE = window.CONFIG?.api.baseUrl || 'https://accordandharmony.org/api';

      try {
        await fetch(`${API_BASE}/donation-notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderID: data.orderID,
            payerName: details.payer.name?.given_name + ' ' + (details.payer.name?.surname || ''),
            payerEmail: details.payer.email_address,
            amount: currentDonationAmount,
            currency: currentDonationCurrency,
            donorName: currentDonorInfo.name || 'Anonymous',
            donorEmail: currentDonorInfo.email || '',
            recurring: currentDonorInfo.recurring || false
          })
        });
      } catch (error) {
        console.error('Donation notification error:', error);
      }

      // Show success message
      showDonationSuccess(details);
    },

    onError: function(err) {
      console.error('PayPal error:', err);
      showDonationMessage('Donation failed. Please try again.', 'error');
      closeDonationPayPalCheckoutModal();
    },

    onCancel: function(data) {
      showDonationMessage('Donation canceled.', 'info');
      closeDonationPayPalCheckoutModal();
    }
  }).render('#donation-paypal-checkout-button-container');
}

/**
 * Show donation success
 */
function showDonationSuccess(details) {
  showDonationMessage(`✅ Thank you for your donation! Redirecting...`, 'success');

  // Extract amount and currency from PayPal details
  const amount = details.purchase_units && details.purchase_units[0] && details.purchase_units[0].amount
    ? details.purchase_units[0].amount.value
    : currentDonationAmount;

  const currency = details.purchase_units && details.purchase_units[0] && details.purchase_units[0].amount
    ? details.purchase_units[0].amount.currency_code
    : currentDonationCurrency;

  // Redirect to success page with amount, currency, and order ID
  setTimeout(() => {
    window.location.href = `donation-success.html?amount=${amount}&currency=${currency}&order=${details.id}`;
  }, 1500);
}

/**
 * Show donation message
 */
function showDonationMessage(message, type) {
  // Use existing showMessage function if available
  if (typeof showMessage === 'function') {
    showMessage(message, type);
  } else {
    alert(message);
  }
}

/**
 * Close payment method modal
 */
window.closeDonationPaymentModal = function() {
  const modal = document.getElementById('donation-payment-method-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
};

/**
 * Close PayPal checkout modal
 */
window.closeDonationPayPalCheckoutModal = function() {
  const modal = document.getElementById('donation-paypal-checkout-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
};
