// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');

            // Animate hamburger menu
            this.classList.toggle('active');
        });

        // Close mobile menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav-menu a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            const isClickInsideNav = navMenu.contains(event.target);
            const isClickOnToggle = mobileMenuToggle.contains(event.target);

            if (!isClickInsideNav && !isClickOnToggle && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
            }
        });
    }
});

// Newsletter Form Handling
const newsletterForm = document.getElementById('newsletterForm');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const emailInput = this.querySelector('input[type="email"]');
        const email = emailInput.value;

        // Simple validation
        if (email && validateEmail(email)) {
            // In a real implementation, this would send data to a server
            showMessage('Thank you for subscribing! You will receive our newsletter soon.', 'success');
            emailInput.value = '';
        } else {
            showMessage('Please enter a valid email address.', 'error');
        }
    });
}

// Contact Form Handling
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const name = this.querySelector('#name').value;
        const email = this.querySelector('#email').value;
        const subject = this.querySelector('#subject').value;
        const message = this.querySelector('#message').value;

        // Validation
        if (name && email && subject && message && validateEmail(email)) {
            // In a real implementation, this would send data to a server
            showMessage('Thank you for your message! We will get back to you soon.', 'success');
            contactForm.reset();
        } else {
            showMessage('Please fill in all required fields correctly.', 'error');
        }
    });
}

// Donation Form Handling
const donationForm = document.getElementById('donationForm');
if (donationForm) {
    const amountButtons = document.querySelectorAll('.donate-amount-btn');
    const customAmountGroup = document.getElementById('customAmountGroup');
    const customAmountInput = document.getElementById('customAmount');
    let selectedAmount = null;

    // Add styling for amount buttons
    amountButtons.forEach(button => {
        button.style.cssText = `
            padding: 1rem;
            border: 2px solid #e0e0e0;
            background: white;
            border-radius: 8px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: var(--font-primary);
        `;

        button.addEventListener('click', function() {
            // Remove active class from all buttons
            amountButtons.forEach(btn => {
                btn.style.borderColor = '#e0e0e0';
                btn.style.background = 'white';
                btn.style.color = '#333';
            });

            // Add active class to clicked button
            this.style.borderColor = 'var(--primary-color)';
            this.style.background = 'var(--primary-color)';
            this.style.color = 'white';

            const amount = this.getAttribute('data-amount');

            if (amount === 'other') {
                customAmountGroup.style.display = 'block';
                selectedAmount = null;
                customAmountInput.required = true;
            } else {
                customAmountGroup.style.display = 'none';
                selectedAmount = amount;
                customAmountInput.required = false;
            }
        });
    });

    donationForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const name = this.querySelector('#donorName').value;
        const email = this.querySelector('#donorEmail').value;
        let amount = selectedAmount;

        if (customAmountGroup.style.display !== 'none') {
            amount = customAmountInput.value;
        }

        // Validation
        if (name && email && amount && validateEmail(email)) {
            // In a real implementation, this would redirect to a payment processor
            showMessage(`Thank you for your generous donation of €${amount}! You will be redirected to our secure payment page.`, 'success');

            // Simulate redirect delay
            setTimeout(() => {
                // In production, redirect to payment gateway
                // window.location.href = 'payment-gateway-url';
            }, 2000);
        } else {
            showMessage('Please fill in all required fields and select a donation amount.', 'error');
        }
    });
}

// Email Validation Helper
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Show Message Helper
function showMessage(message, type) {
    // Remove any existing messages
    const existingMessage = document.querySelector('.form-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = 'form-message';
    messageDiv.textContent = message;

    // Style based on type
    const bgColor = type === 'success' ? '#4caf50' : '#f44336';
    messageDiv.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: ${bgColor};
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideDown 0.3s ease;
        max-width: 90%;
        text-align: center;
    `;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(messageDiv);

    // Remove message after 5 seconds
    setTimeout(() => {
        messageDiv.style.animation = 'slideDown 0.3s ease reverse';
        setTimeout(() => {
            messageDiv.remove();
        }, 300);
    }, 5000);
}

// Smooth Scrolling for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href.length > 1) {
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// Add scroll effect to header
let lastScroll = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll <= 0) {
        header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
    }

    lastScroll = currentScroll;
});

// Fade in elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements with fade-in effect
document.addEventListener('DOMContentLoaded', () => {
    const fadeElements = document.querySelectorAll('.mission-card, .about-card, .gallery-item, .welcome-text, .welcome-image');

    fadeElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Print current year in footer if needed
const yearElements = document.querySelectorAll('.current-year');
if (yearElements.length > 0) {
    const currentYear = new Date().getFullYear();
    yearElements.forEach(el => {
        el.textContent = currentYear;
    });
}
