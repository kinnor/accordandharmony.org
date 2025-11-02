# Add multilingual support (English, German, French, Bulgarian)

## Summary

Implemented comprehensive multilingual support for the Accord and Harmony Foundation website. Users can now view the entire site in **English, German, French, and Bulgarian** using a language selector in the navigation.

## Changes Made

### New Files
- **translations.js** - Complete translation dictionary for all 4 languages
- **language-switcher.js** - Language switching logic with localStorage persistence

### Modified Files
- **All HTML pages** (index.html, about.html, gallery.html, contact.html, donate.html)
  - Added language selector dropdown to navigation
  - Added `data-i18n` attributes to all translatable content
  - Included translation scripts before main script.js

- **styles.css**
  - Added styling for language selector dropdown
  - Styled to match existing site design with rounded buttons

### Content Updates
- Updated hero section text on homepage to "Empowering Communities, Transforming Lives"
- Removed repetition in hero description

## Features

✅ **4 Languages Supported**: English, German (Deutsch), French (Français), Bulgarian (Български)
✅ **Instant Switching**: Language changes apply immediately without page reload
✅ **Persistent Preference**: User's language choice saved in localStorage
✅ **Comprehensive Coverage**: Navigation, hero sections, mission cards, newsletter, footer all translated
✅ **Accessible**: Proper ARIA labels and semantic HTML

## How It Works

1. User selects language from dropdown in navigation
2. JavaScript loads appropriate translations from translations.js
3. All elements with `data-i18n` attributes update instantly
4. Language preference saved to localStorage for future visits
5. Works across all pages seamlessly

## Testing

- [x] Language selector displays correctly on all pages
- [x] Content switches correctly for all 4 languages
- [x] Language preference persists across page navigation
- [x] Mobile responsive design maintained
- [x] Accessibility maintained with ARIA labels

## Screenshots

The language selector appears in the top navigation on all pages:

```
[Home] [About Us] [Gallery] [Contact Us] [Donate] [🌐 English ▼]
```

When clicked, users can select from:
- English
- Deutsch
- Français
- Български

## Technical Details

**Architecture:**
- Client-side translation using vanilla JavaScript
- No external dependencies or libraries
- Translation keys stored in `translations.js`
- Language switching handled by `language-switcher.js`
- Translations applied via `data-i18n` attributes on HTML elements

**Browser Support:**
- All modern browsers (Chrome, Firefox, Safari, Edge)
- Uses localStorage for persistence
- Falls back to English if preferred language unavailable

## Future Enhancements

Potential additions for future PRs:
- Add more languages (Spanish, Italian, etc.)
- Translate form placeholder text and error messages
- Add language-specific date/time formatting
- Implement server-side rendering for SEO

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
