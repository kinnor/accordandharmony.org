// Book Preview Modal Functionality
// Handles the preview modal for the Jazz Trumpet Master Class book

(function() {
    'use strict';

    // Configuration
    const PREVIEW_PDF_PATH = 'downloads/books/JAZZ_TRUMPET_Preview.pdf';

    // Get modal elements
    const modal = document.getElementById('book-preview-modal');
    const previewBtn = document.getElementById('preview-book-btn');
    const closeBtn = document.getElementById('close-preview-btn');
    const previewPurchaseBtn = document.getElementById('preview-purchase-btn');
    const pdfFrame = document.getElementById('preview-pdf-frame');
    const downloadLink = document.getElementById('download-preview-link');
    const fallbackDiv = document.querySelector('.preview-fallback');

    // Check if we're on a page with the modal
    if (!modal || !previewBtn) {
        return; // Exit if modal elements don't exist
    }

    /**
     * Opens the preview modal and loads the PDF
     */
    function openPreview() {
        // Set the PDF source
        pdfFrame.src = PREVIEW_PDF_PATH;
        downloadLink.href = PREVIEW_PDF_PATH;

        // Show the modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling

        // Check if PDF loaded successfully after a delay
        setTimeout(checkPDFLoad, 1000);

        // Track event (if analytics is set up)
        if (typeof gtag === 'function') {
            gtag('event', 'book_preview_opened', {
                'event_category': 'engagement',
                'event_label': 'Book Preview'
            });
        }
    }

    /**
     * Closes the preview modal
     */
    function closePreview() {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling

        // Clear the iframe src to stop loading
        pdfFrame.src = '';
    }

    /**
     * Checks if the PDF loaded successfully
     * If not, shows the download fallback
     */
    function checkPDFLoad() {
        // For mobile devices or browsers that don't support PDF in iframe
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
            // Show fallback for mobile devices
            pdfFrame.style.display = 'none';
            fallbackDiv.style.display = 'block';
        }
    }

    /**
     * Scrolls to the purchase section and closes the modal
     */
    function scrollToPurchase() {
        closePreview();

        // Scroll to the book section
        const bookSection = document.getElementById('book-section');
        if (bookSection) {
            bookSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Highlight the purchase button briefly
        const purchaseBtn = document.getElementById('purchase-book-btn');
        if (purchaseBtn) {
            purchaseBtn.style.transform = 'scale(1.05)';
            purchaseBtn.style.boxShadow = '0 8px 30px rgba(46, 157, 216, 0.5)';

            setTimeout(() => {
                purchaseBtn.style.transform = '';
                purchaseBtn.style.boxShadow = '';
            }, 2000);
        }

        // Track event
        if (typeof gtag === 'function') {
            gtag('event', 'preview_to_purchase_click', {
                'event_category': 'conversion',
                'event_label': 'Preview to Purchase'
            });
        }
    }

    // Event Listeners

    // Open modal when preview button is clicked
    previewBtn.addEventListener('click', openPreview);

    // Close modal when close button is clicked
    closeBtn.addEventListener('click', closePreview);

    // Close modal when clicking outside the modal content
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closePreview();
        }
    });

    // Handle purchase button in modal
    previewPurchaseBtn.addEventListener('click', scrollToPurchase);

    // Close modal on ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closePreview();
        }
    });

    // Prevent scrolling inside modal from affecting background
    const modalContent = modal.querySelector('.preview-modal-content');
    if (modalContent) {
        modalContent.addEventListener('wheel', function(e) {
            e.stopPropagation();
        });
    }

})();
