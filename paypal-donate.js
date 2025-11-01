/**
 * Simple PayPal Donation Integration
 * Uses PayPal Smart Payment Buttons
 *
 * SETUP: Replace YOUR_PAYPAL_CLIENT_ID in donate.html with your actual Client ID
 * Get it from: https://developer.paypal.com/dashboard/applications/live
 */

document.addEventListener('DOMContentLoaded', function() {
    const donationForm = document.getElementById('donationForm');
    if (!donationForm) return;

    const amountButtons = document.querySelectorAll('.donate-amount-btn');
    const customAmountGroup = document.getElementById('customAmountGroup');
    const customAmountInput = document.getElementById('customAmount');
    const paypalContainer = document.getElementById('paypal-button-container');

    let selectedAmount = null;

    // Handle amount selection
    amountButtons.forEach(button => {
        button.addEventListener('click', function() {
            amountButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const amount = this.getAttribute('data-amount');

            if (amount === 'other') {
                customAmountGroup.classList.add('is-visible');
                selectedAmount = null;
                customAmountInput.focus();
            } else {
                customAmountGroup.classList.remove('is-visible');
                selectedAmount = amount;
                renderPayPalButton();
            }
        });
    });

    // Handle custom amount
    if (customAmountInput) {
        customAmountInput.addEventListener('input', function() {
            if (this.value && parseFloat(this.value) > 0) {
                selectedAmount = this.value;
                renderPayPalButton();
            }
        });
    }

    function renderPayPalButton() {
        if (!selectedAmount || parseFloat(selectedAmount) <= 0) {
            paypalContainer.innerHTML = '<p style="text-align: center; padding: 20px; background: #f0f0f0; border-radius: 5px; color: #666;">👆 Select a donation amount above</p>';
            return;
        }

        // Check if PayPal SDK is loaded
        if (typeof paypal === 'undefined') {
            paypalContainer.innerHTML = '<p style="text-align: center; padding: 20px; background: #ffebee; border-radius: 5px; color: #d32f2f;">PayPal SDK not loaded. Please check your Client ID.</p>';
            return;
        }

        // Clear container
        paypalContainer.innerHTML = '';

        const recurringCheckbox = document.getElementById('recurring');
        const isRecurring = recurringCheckbox ? recurringCheckbox.checked : false;

        // Render PayPal button
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
                        amount: {
                            value: parseFloat(selectedAmount).toFixed(2),
                            currency_code: 'EUR'
                        },
                        description: 'Donation to Accord and Harmony Foundation'
                    }]
                });
            },

            onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {
                    // Send notification email to foundation
                    const donorName = document.getElementById('donorName').value || 'Anonymous';
                    const donorEmail = document.getElementById('donorEmail').value || '';

                    fetch('php/paypal-notify.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            orderID: data.orderID,
                            payerName: details.payer.name.given_name + ' ' + details.payer.name.surname,
                            payerEmail: details.payer.email_address,
                            amount: selectedAmount,
                            currency: 'EUR',
                            donorName: donorName,
                            donorEmail: donorEmail,
                            recurring: isRecurring
                        })
                    });

                    // Redirect to success page
                    window.location.href = 'donation-success.html?amount=' + selectedAmount + '&order=' + data.orderID;
                });
            },

            onError: function(err) {
                alert('An error occurred. Please try again or contact us at contact@acchm.org');
                console.error('PayPal Error:', err);
            }
        }).render('#paypal-button-container');
    }

    // Initial state
    paypalContainer.innerHTML = '<p style="text-align: center; padding: 20px; background: #f0f0f0; border-radius: 5px; color: #666;">👆 Select a donation amount above</p>';
});
