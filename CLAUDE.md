# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static website for the Accord and Harmony Foundation, a Bulgarian non-profit organization based in Sofia. The website is built with vanilla HTML5, CSS3, and JavaScript (no frameworks) for optimal performance and easy deployment to Network Solutions hosting.

## Technology Stack

- **HTML5**: Semantic markup with accessibility features (skip links, ARIA attributes)
- **CSS3**: Custom properties (CSS variables), Grid, Flexbox
- **JavaScript (ES6+)**: Vanilla JS with no external dependencies
- **Fonts**: Google Fonts (Nunito and Libre Baskerville)

## File Structure

```
accordandharmony.org/
├── index.html       # Home page
├── about.html       # About Us page
├── gallery.html     # Gallery page
├── contact.html     # Contact page
├── donate.html      # Donate page
├── styles.css       # Single stylesheet for all pages
├── script.js        # JavaScript for all interactive features
└── README.md        # Deployment and customization documentation
```

## Code Architecture

### CSS Organization (styles.css)

The stylesheet is organized into clearly commented sections:

1. **Reset & Base Styles** (lines 4-101): CSS reset, CSS variables in `:root`, base element styles
2. **Header & Navigation** (lines 103-200): Sticky header, responsive nav, mobile menu toggle
3. **Hero Section** (lines 202-261): Full-width hero with gradient background
4. **Buttons** (lines 263-306): Reusable button components
5. **Component Sections** (lines 308-502): Welcome, Mission, Newsletter sections
6. **Footer** (lines 504-580): Multi-column footer layout
7. **Page-Specific Styles** (lines 582-922): About, Contact, Gallery, Donate pages
8. **Responsive Design** (lines 924-1014): Mobile-first breakpoints at 768px and 480px

**CSS Variables** (styles.css:10-32): All colors, fonts, spacing, and transitions are defined as CSS custom properties in `:root` for easy theming:
- Primary color: #1684C9 (Blue from original site)
- Secondary color: #96CDD4 (Light blue/cyan from original site)
- Accent color: #1893DF (Bright blue)
- Body font: Nunito (weight 300)
- Heading font: Libre Baskerville (weight 700)

### JavaScript Architecture (script.js)

The JavaScript file handles all interactive functionality across all pages:

1. **Mobile Navigation** (lines 2-37): Hamburger menu toggle with click-outside-to-close
2. **Form Handlers** (lines 39-143):
   - Newsletter form (lines 40-57)
   - Contact form (lines 60-84)
   - Donation form with custom amount toggle (lines 87-143)
3. **Helper Functions** (lines 145-220):
   - `validateEmail()`: Email validation regex
   - `showMessage()`: Toast-style notification system
4. **UI Enhancements** (lines 222-291):
   - Smooth scrolling for anchor links
   - Scroll-based header shadow
   - Intersection Observer for fade-in animations
   - Dynamic year in footer

**Form Architecture**: All forms currently show success messages without backend integration. Forms use `e.preventDefault()` to stop default submission. To make forms functional, update the form action URLs or integrate with a service (see README.md lines 113-125).

### HTML Structure

All HTML pages follow the same structure:
- **Header**: Sticky navigation with mobile-responsive menu
- **Main content**: Semantic sections with BEM-like class naming
- **Footer**: Contact info and quick links (repeated on every page)
- **Script**: `script.js` loaded at end of body for performance

**Shared Components**:
- Navigation menu appears identically in all pages (update in all 5 HTML files if changing)
- Footer content is duplicated in all pages (update in all 5 HTML files if changing)

## Development Workflow

### Testing Changes Locally

Since this is a static site with no build process:
1. Open any HTML file directly in a browser (file:// protocol)
2. Changes to CSS/JS require a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. No local server required, but can use `python -m http.server` or similar for testing

### Making Content Changes

**Navigation Links**: Update in all 5 HTML files (about.html, contact.html, donate.html, gallery.html, index.html) as the navigation is duplicated in each.

**Footer Content**: Update in all 5 HTML files as the footer is duplicated in each. Consider find-and-replace for consistency.

**Color Scheme**: Modify CSS variables in styles.css:10-32. Main colors:
- `--primary-color`: Primary blue (#1684C9)
- `--secondary-color`: Light blue/cyan (#96CDD4)
- `--accent-color`: Bright blue (#1893DF)

**Contact Information**: Currently set to:
- Email: contact@acchm.org
- Phone: +359 (89) 609 7069
- Address: Odrin 95 st, Sofia 1303, BG

### Adding Images

Currently using SVG placeholders. To add real images:
1. Create an `images/` directory
2. Upload images to `images/` folder
3. Replace `<div class="image-placeholder">` or `<div class="gallery-placeholder">` with `<img src="images/filename.jpg" alt="description">`
4. Optimize images before uploading (recommended: compress to <500KB each)

## Deployment

The site is hosted on Network Solutions at https://accordandharmony.org

**Deployment Methods** (see README.md:46-83):
1. Network Solutions File Manager (web interface)
2. FTP upload (credentials from Network Solutions)
3. cPanel File Manager

**Important**: All files must be uploaded to `public_html` or `www` directory with 644 permissions.

## Form Integration

Forms are currently non-functional (show success messages only). To activate:

**Option 1 - Third-party service** (Formspree, FormSubmit):
- Update `<form action="...">` attribute in contact.html and donate.html
- Example: `<form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">`

**Option 2 - PHP backend** (if Network Solutions supports PHP):
- Create PHP handler script (e.g., `contact-handler.php`)
- Update form action to point to PHP script
- Configure email sending in PHP

## Browser Support

Target: Latest versions of Chrome, Firefox, Safari, Edge, and mobile browsers (iOS Safari, Chrome Mobile)

**Key Compatibility Notes**:
- CSS Grid and Flexbox require modern browsers (IE11 not supported)
- IntersectionObserver API used for scroll animations (polyfill not included)
- CSS custom properties (variables) used extensively

## Accessibility Features

- Skip link to main content (styles.css:41-56)
- Semantic HTML5 elements (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`)
- ARIA attributes on mobile menu toggle (script.js:12, 21, 33)
- Form labels properly associated with inputs
- Sufficient color contrast ratios
- Focus states on interactive elements

## Key Considerations When Editing

1. **No Build Process**: This is pure HTML/CSS/JS - changes go live immediately after upload
2. **No Version Control Hooks**: Remember to commit and push changes manually
3. **Duplicate Content**: Navigation and footer exist in all 5 HTML files - update consistently
4. **Responsive Testing**: Always test at mobile (320px), tablet (768px), and desktop (1200px) widths
5. **Form Security**: If adding backend form handling, sanitize all inputs to prevent XSS/injection
6. **Performance**: Keep images optimized, minimize external dependencies, no large JavaScript libraries

## Copyright and Contact

Copyright © 2025 Accord and Harmony Foundation. All rights reserved.
Contact: contact@acchm.org
