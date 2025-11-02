// Donation Modal Functionality
document.addEventListener('DOMContentLoaded', function() {
    const donationModal = document.getElementById('donationModal');
    const donationTierCards = document.querySelectorAll('.donation-tier-card');
    const modalClose = document.querySelector('.donation-modal-close');
    const modalOverlay = document.querySelector('.donation-modal-overlay');
    const modalImpactImage = document.getElementById('modalImpactImage');
    const modalTitle = document.getElementById('modalTitle');
    const impactBullets = document.getElementById('impactBullets');

    // Donation tier data
    const donationData = {
        50: {
            title: '€50 - School Supplies',
            image: 'images/donation-50-euro.svg',
            impactList: [
                '3 complete backpacks with essentials',
                'Notebooks, pens & art supplies',
                'Core textbooks for all subjects',
                'Calculator & geometry tools',
                'Full semester coverage'
            ]
        },
        100: {
            title: '€100 - Food Package',
            image: 'images/donation-100-euro.svg',
            impactList: [
                'Essential groceries for 30 days',
                'Fresh produce, bread & milk',
                'Rice, pasta & cooking staples',
                'Feeds family of 4 people',
                'Nutritious balanced meals'
            ]
        },
        250: {
            title: '€250 - After-School Tutoring',
            image: 'images/donation-250-euro.svg',
            impactList: [
                '36 professional tutoring sessions',
                'Supports 5 students at once',
                'Math, language & sciences',
                '3 full months of support',
                'Exam preparation included'
            ]
        }
    };

    // Open modal when donation tier card is clicked
    donationTierCards.forEach(card => {
        card.addEventListener('click', function() {
            const amount = this.getAttribute('data-amount');
            const data = donationData[amount];

            if (data) {
                // Update modal content
                modalTitle.textContent = data.title;
                modalImpactImage.src = data.image;
                modalImpactImage.alt = data.title;

                // Populate impact bullets
                impactBullets.innerHTML = '';
                data.impactList.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = item;
                    li.style.marginBottom = '6px';
                    impactBullets.appendChild(li);
                });

                // Show modal
                donationModal.style.display = 'flex';
                document.body.style.overflow = 'hidden'; // Prevent background scrolling

                // Initialize PayPal button in modal with selected amount
                initializeModalPayPalButton(amount);

                // Smooth scroll to top of modal
                setTimeout(() => {
                    donationModal.querySelector('.donation-modal-content').scrollTop = 0;
                }, 100);
            }
        });
    });

    // Close modal function
    function closeModal() {
        donationModal.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling

        // Clear PayPal button
        const paypalContainer = document.getElementById('modal-paypal-button-container');
        if (paypalContainer) {
            paypalContainer.innerHTML = '';
        }
    }

    // Close modal when clicking close button
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    // Close modal when clicking overlay
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeModal);
    }

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && donationModal.style.display === 'flex') {
            closeModal();
        }
    });

    // Initialize PayPal button in modal
    function initializeModalPayPalButton(amount) {
        const container = document.getElementById('modal-paypal-button-container');
        if (!container || !window.paypal) return;

        // Clear existing button
        container.innerHTML = '';

        // Render PayPal button
        paypal.Buttons({
            createOrder: function(data, actions) {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: amount,
                            currency_code: 'EUR'
                        },
                        description: `Donation to Accord and Harmony Foundation - €${amount}`
                    }]
                });
            },
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {
                    // Show success message
                    showDonationSuccessMessage(details);
                });
            },
            onError: function(err) {
                console.error('PayPal Error:', err);
                alert('There was an error processing your donation. Please try again or contact us at contact@acchm.org');
            },
            style: {
                layout: 'vertical',
                color: 'blue',
                shape: 'rect',
                label: 'donate'
            }
        }).render(container);
    }

    // Show success message after donation
    function showDonationSuccessMessage(details) {
        const modalBody = document.querySelector('.donation-modal-body');
        if (!modalBody) return;

        modalBody.innerHTML = `
            <div style="text-align: center; padding: 60px 40px;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #50C878 0%, #3BA55D 100%); border-radius: 50%; margin: 0 auto 30px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 30px rgba(80, 200, 120, 0.3);">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 13L9 17L19 7" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <h2 style="color: #2C1810; margin-bottom: 1rem; font-size: 2rem;">Thank You!</h2>
                <p style="color: #696969; font-size: 1.1rem; line-height: 1.6; margin-bottom: 2rem;">
                    Your generous donation has been successfully processed. You will receive a confirmation email at <strong>${details.payer.email_address || 'your email'}</strong> with your donation receipt.
                </p>
                <p style="color: #6B5B4E; font-size: 1rem; margin-bottom: 2rem;">
                    Transaction ID: <strong>${details.id}</strong>
                </p>
                <div style="background: linear-gradient(135deg, rgba(46, 157, 216, 0.1) 0%, rgba(91, 180, 227, 0.15) 100%); padding: 25px; border-radius: 12px; margin-bottom: 2rem;">
                    <p style="color: #1B76A8; font-size: 1.05rem; line-height: 1.7; margin: 0;">
                        Your contribution makes a real difference in the lives of children and families in Bulgaria. Thank you for being part of our mission to create lasting positive change through education and community support.
                    </p>
                </div>
                <button onclick="document.getElementById('donationModal').style.display='none'; document.body.style.overflow=''; location.reload();" class="btn btn-primary" style="margin-top: 20px;">
                    Close
                </button>
            </div>
        `;
    }
});
