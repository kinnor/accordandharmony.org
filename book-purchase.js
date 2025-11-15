/**
 * Book Purchase Handler
 * Manages book purchase flow with Stripe integration
 */

const PRODUCT_ID = 'jazz-trumpet-masterclass-2025';

document.addEventListener('DOMContentLoaded', () => {
  initBookPurchase();
  handlePurchaseCallback();
});

/**
 * Initialize book purchase button
 */
function initBookPurchase() {
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
    // Listen for successful auth
    window.addEventListener('authSuccess', () => {
      // Retry purchase after auth
      setTimeout(() => processPurchase(), 500);
    }, { once: true });
    return;
  }

  await processPurchase();
}

/**
 * Process book purchase
 */
async function processPurchase() {
  const purchaseBtn = document.getElementById('purchase-book-btn');
  const originalHTML = purchaseBtn.innerHTML;

  try {
    purchaseBtn.disabled = true;
    purchaseBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="spinning">
        <path d="M12 4V2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10h-2c0 4.41-3.59 8-8 8s-8-3.59-8-8 3.59-8 8-8z"/>
      </svg>
      <span>Processing...</span>
    `;

    // Create Stripe checkout session
    const response = await authFetch(`${API_BASE}/checkout/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: PRODUCT_ID })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to create checkout session');
    }

    // Redirect to Stripe Checkout
    window.location.href = data.data.sessionUrl;

  } catch (error) {
    console.error('Purchase error:', error);
    showMessage(error.message || 'Failed to process purchase. Please try again.', 'error');

    purchaseBtn.disabled = false;
    purchaseBtn.innerHTML = originalHTML;
  }
}

/**
 * Handle purchase success/cancel callback
 */
function handlePurchaseCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const purchaseStatus = urlParams.get('purchase');
  const sessionId = urlParams.get('session_id');

  if (purchaseStatus === 'success' && sessionId) {
    handlePurchaseSuccess(sessionId);
  } else if (purchaseStatus === 'canceled') {
    showMessage('Purchase canceled. You can try again anytime.', 'info');
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

/**
 * Handle successful purchase
 */
async function handlePurchaseSuccess(sessionId) {
  try {
    // Show success message immediately
    showPurchaseSuccessModal();

    // Verify payment and get transaction details
    const response = await authFetch(`${API_BASE}/checkout/session/${sessionId}`);
    const data = await response.json();

    if (data.success && data.data.session) {
      const session = data.data.session;

      // Update success modal with details
      updateSuccessModal(session);
    }

    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);

  } catch (error) {
    console.error('Purchase verification error:', error);
    showMessage('Purchase processing. Please check your email for download link.', 'success');
  }
}

/**
 * Show purchase success modal
 */
function showPurchaseSuccessModal() {
  const modal = createSuccessModal();
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
}

/**
 * Create success modal
 */
function createSuccessModal() {
  const modal = document.createElement('div');
  modal.id = 'purchaseSuccessModal';
  modal.className = 'purchase-success-modal';
  modal.innerHTML = `
    <div class="success-modal-overlay"></div>
    <div class="success-modal-content">
      <div class="success-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>

      <h2>Purchase Successful! 🎉</h2>

      <p class="success-message">
        Thank you for supporting the Accord and Harmony Foundation!<br>
        Your purchase makes a real difference.
      </p>

      <div class="success-details" id="successDetails">
        <div class="success-detail-item">
          <strong>📧 Check Your Email</strong>
          <p>We've sent your download link and receipt to your email address.</p>
        </div>

        <div class="success-detail-item">
          <strong>📥 Download Instructions</strong>
          <p>Click the download link in your email. The link is valid for 24 hours and allows up to 5 downloads.</p>
        </div>

        <div class="success-detail-item">
          <strong>📄 Personalized Copy</strong>
          <p>Your PDF is watermarked with your name for personal use only. Sharing is prohibited.</p>
        </div>

        <div class="success-detail-item">
          <strong>🧾 Tax Receipt</strong>
          <p>Your tax-deductible receipt is included in the email for your records.</p>
        </div>
      </div>

      <button class="btn-primary" onclick="closePurchaseSuccessModal()">Got It, Thanks!</button>

      <p class="success-footer">
        Didn't receive the email? Check your spam folder or <a href="contact.html">contact us</a>.
      </p>
    </div>
  `;

  // Close on overlay click
  modal.querySelector('.success-modal-overlay').addEventListener('click', closePurchaseSuccessModal);

  return modal;
}

/**
 * Update success modal with transaction details
 */
function updateSuccessModal(session) {
  // Could update with specific transaction details if needed
  console.log('Purchase session:', session);
}

/**
 * Close purchase success modal
 */
function closePurchaseSuccessModal() {
  const modal = document.getElementById('purchaseSuccessModal');
  if (modal) {
    modal.remove();
    document.body.style.overflow = '';
  }
}

// Make close function available globally
window.closePurchaseSuccessModal = closePurchaseSuccessModal;

// Add spinning animation CSS dynamically
if (!document.getElementById('book-purchase-animations')) {
  const style = document.createElement('style');
  style.id = 'book-purchase-animations';
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .spinning {
      animation: spin 1s linear infinite;
      display: inline-block;
      margin-right: 8px;
    }

    .purchase-success-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .success-modal-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.75);
    }

    .success-modal-content {
      position: relative;
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
    }

    .success-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      background: linear-gradient(135deg, #6BCF7F, #A8E063);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .success-message {
      font-size: 1.1rem;
      color: #666;
      margin: 20px 0;
      line-height: 1.6;
    }

    .success-details {
      text-align: left;
      margin: 30px 0;
    }

    .success-detail-item {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 15px;
      border-left: 4px solid #4A90E2;
    }

    .success-detail-item strong {
      display: block;
      color: #2C3E50;
      margin-bottom: 5px;
      font-size: 1rem;
    }

    .success-detail-item p {
      margin: 0;
      color: #666;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .success-footer {
      margin-top: 20px;
      font-size: 0.9rem;
      color: #999;
    }

    .success-footer a {
      color: #4A90E2;
      text-decoration: none;
    }

    .success-footer a:hover {
      text-decoration: underline;
    }
  `;
  document.head.appendChild(style);
}
