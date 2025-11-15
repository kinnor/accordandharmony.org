// Language Switcher for Accord and Harmony Foundation Website
(function() {
    'use strict';

    // Default language
    const DEFAULT_LANG = 'en';

    // Get current language from localStorage or use default
    let currentLang = localStorage.getItem('preferredLanguage') || DEFAULT_LANG;

    // Initialize language on page load
    function init() {
        // Set the language selector to current language
        const langSelector = document.getElementById('languageSelector');
        if (langSelector) {
            langSelector.value = currentLang;
            langSelector.addEventListener('change', handleLanguageChange);
        }

        // Apply translations
        applyTranslations(currentLang);
    }

    // Handle language change
    function handleLanguageChange(event) {
        const newLang = event.target.value;
        changeLanguage(newLang);
    }

    // Change language
    function changeLanguage(lang) {
        if (translations[lang]) {
            currentLang = lang;
            localStorage.setItem('preferredLanguage', lang);
            applyTranslations(lang);

            // Update HTML lang attribute
            document.documentElement.lang = lang;
        }
    }

    // Apply translations to all elements with data-i18n attribute
    function applyTranslations(lang) {
        const elements = document.querySelectorAll('[data-i18n]');

        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = translations[lang][key];

            if (translation) {
                // Check if element is an input with placeholder
                if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
                    element.placeholder = translation;
                } else {
                    // Use innerHTML to support HTML tags in translations
                    element.innerHTML = translation;
                }
            }
        });

        // Update page title if there's a translation key
        const titleElement = document.querySelector('title');
        if (titleElement && titleElement.hasAttribute('data-i18n')) {
            const titleKey = titleElement.getAttribute('data-i18n');
            const titleTranslation = translations[lang][titleKey];
            if (titleTranslation) {
                titleElement.textContent = titleTranslation;
            }
        }
    }

    // Expose changeLanguage function globally
    window.changeLanguage = changeLanguage;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
