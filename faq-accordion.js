// FAQ Accordion Functionality
// Handles expanding/collapsing FAQ items

(function() {
    'use strict';

    // Get all FAQ items
    const faqItems = document.querySelectorAll('.faq-item');

    if (faqItems.length === 0) {
        return; // Exit if no FAQ items on page
    }

    // Add click event to each FAQ question
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        if (!question) return;

        question.addEventListener('click', function() {
            // Toggle active class on clicked item
            const isActive = item.classList.contains('active');

            // Optional: Close all other FAQs (accordion behavior)
            // Comment out these lines if you want multiple FAQs open at once
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });

            // Toggle the clicked item
            if (isActive) {
                item.classList.remove('active');
            } else {
                item.classList.add('active');
            }

            // Track FAQ interaction (if analytics is set up)
            if (typeof gtag === 'function') {
                const questionText = question.textContent.trim();
                gtag('event', 'faq_interaction', {
                    'event_category': 'engagement',
                    'event_label': questionText,
                    'value': isActive ? 0 : 1 // 0 = closed, 1 = opened
                });
            }
        });
    });

    // Optional: Open first FAQ item by default
    // Uncomment if you want the first FAQ to be open on page load
    // if (faqItems.length > 0) {
    //     faqItems[0].classList.add('active');
    // }

})();
