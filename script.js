// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            const isOpen = navMenu.classList.toggle('active');

            // Animate hamburger menu
            this.classList.toggle('active');
            this.setAttribute('aria-expanded', String(isOpen));
        });

        // Close mobile menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav-menu a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            const isClickInsideNav = navMenu.contains(event.target);
            const isClickOnToggle = mobileMenuToggle.contains(event.target);

            if (!isClickInsideNav && !isClickOnToggle && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
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
        const email = emailInput ? emailInput.value.trim() : '';

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

        const nameInput = this.querySelector('#name');
        const emailInput = this.querySelector('#email');
        const subjectInput = this.querySelector('#subject');
        const messageInput = this.querySelector('#message');

        const name = nameInput ? nameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const subject = subjectInput ? subjectInput.value.trim() : '';
        const message = messageInput ? messageInput.value.trim() : '';

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

    amountButtons.forEach(button => {
        button.addEventListener('click', function() {
            amountButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const amount = this.getAttribute('data-amount');

            if (amount === 'other') {
                customAmountGroup.classList.add('is-visible');
                selectedAmount = null;
                customAmountInput.required = true;
                customAmountInput.focus();
            } else {
                customAmountGroup.classList.remove('is-visible');
                selectedAmount = amount;
                customAmountInput.required = false;
                customAmountInput.value = '';
            }
        });
    });

    donationForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const nameInput = this.querySelector('#donorName');
        const emailInput = this.querySelector('#donorEmail');

        const name = nameInput ? nameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        let amount = selectedAmount;

        if (customAmountGroup && customAmountGroup.classList.contains('is-visible')) {
            amount = customAmountInput ? customAmountInput.value : null;
        }

        // Validation
        if (name && email && amount && validateEmail(email) && parseFloat(amount) > 0) {
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

// Add animation style once on page load
if (!document.getElementById('message-animation-style')) {
    const style = document.createElement('style');
    style.id = 'message-animation-style';
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
        @keyframes slideUp {
            from {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            to {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
            }
        }
    `;
    document.head.appendChild(style);
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

    document.body.appendChild(messageDiv);

    // Remove message after 5 seconds
    setTimeout(() => {
        messageDiv.style.animation = 'slideUp 0.3s ease';
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

if (header) {
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll <= 0) {
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
        }

        lastScroll = currentScroll;
    });
}

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
