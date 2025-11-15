# Accord and Harmony Foundation Website

A modern, responsive website for the Accord and Harmony Foundation based in Sofia, Bulgaria.

## Overview

This website showcases the foundation's mission to support those in need and champion children's education across Bulgaria. Built with clean HTML, CSS, and JavaScript for optimal performance and easy deployment.

## Features

- **Responsive Design**: Fully responsive layout that works seamlessly on desktop, tablet, and mobile devices
- **Modern UI/UX**: Clean, professional design with smooth animations and transitions
- **Fast Loading**: Optimized code with minimal dependencies
- **SEO Friendly**: Proper meta tags and semantic HTML structure
- **Accessible**: Following web accessibility best practices

## Pages

1. **Home (index.html)**: Landing page with hero section, mission overview, and newsletter signup
2. **About Us (about.html)**: Detailed information about the foundation's mission, vision, and values
3. **Gallery (gallery.html)**: Visual showcase of the foundation's programs and impact
4. **Contact Us (contact.html)**: Contact form and foundation information
5. **Donate (donate.html)**: Donation options and ways to support the foundation

## File Structure

```
accordandharmony.org/
├── index.html          # Home page
├── about.html          # About Us page
├── gallery.html        # Gallery page
├── contact.html        # Contact page
├── donate.html         # Donate page
├── styles.css          # Main stylesheet
├── script.js           # JavaScript functionality
├── api/                # Email API handlers (Resend integration)
│   ├── config.php      # Configuration & API key
│   ├── contact.php     # Contact form handler
│   ├── newsletter.php  # Newsletter signup handler
│   └── lib/            # Helper libraries
│       ├── resend.php  # Resend API client
│       ├── csrf.php    # CSRF protection
│       └── ratelimit.php # Rate limiting
├── docs/               # Documentation
│   ├── DNS-SETUP-GUIDE.md        # DNS configuration for Resend
│   ├── RESEND-INTEGRATION.md     # Email integration guide
│   └── MIGRATION-CHECKLIST.md    # Step-by-step migration guide
└── README.md           # This file
```

## Technologies Used

- HTML5
- CSS3 (with CSS Grid and Flexbox)
- JavaScript (ES6+)
- Google Fonts (Poppins & Playfair Display)

## Deployment Instructions

### Option 1: Network Solutions Hosting

1. Log in to your Network Solutions account
2. Navigate to your hosting control panel
3. Access the File Manager or use FTP credentials
4. Upload all files to the `public_html` or `www` directory:
   - index.html
   - about.html
   - gallery.html
   - contact.html
   - donate.html
   - styles.css
   - script.js
5. Ensure file permissions are set correctly (644 for files)
6. Visit https://accordandharmony.org to view your site

### Option 2: FTP Upload

1. Use an FTP client (FileZilla, Cyberduck, etc.)
2. Connect using your Network Solutions FTP credentials:
   - Host: ftp.accordandharmony.org (or provided by Network Solutions)
   - Username: [Your FTP username]
   - Password: [Your FTP password]
3. Navigate to the root web directory
4. Upload all website files
5. Test the website

### Option 3: cPanel File Manager

1. Log in to cPanel (provided by Network Solutions)
2. Click on "File Manager"
3. Navigate to `public_html` directory
4. Click "Upload" and select all website files
5. Wait for upload to complete
6. Set correct permissions if needed

## Customization Guide

### Updating Content

- **Contact Information**: Edit footer sections in each HTML file
- **Colors**: Modify CSS variables in `styles.css` under `:root`
- **Fonts**: Change Google Fonts links in HTML `<head>` sections
- **Images**: Replace placeholder SVGs with actual images in HTML files

### Adding Images

1. Create an `images` folder in your website directory
2. Upload your images to this folder
3. Replace placeholder SVGs in HTML with:
   ```html
   <img src="images/your-image.jpg" alt="Description">
   ```

### Updating Donation Information

Edit the bank transfer section in `donate.html` to include:
- Actual bank name
- IBAN number
- BIC/SWIFT code

### Setting Up Email Integration (Resend)

The website uses **Resend** for email functionality with the subdomain `mail.accordandharmony.org`.

**Complete Setup Guide**: See [`docs/MIGRATION-CHECKLIST.md`](docs/MIGRATION-CHECKLIST.md)

**Quick Start**:
1. Create Resend account at https://resend.com
2. Configure DNS records for `mail.accordandharmony.org` (see [`docs/DNS-SETUP-GUIDE.md`](docs/DNS-SETUP-GUIDE.md))
3. Upload `api/` folder to server
4. Configure API key in `api/config.php`
5. Test forms

**Why Subdomain?**
- Using `mail.accordandharmony.org` for sending emails preserves your main domain's email receiving capabilities
- Improves deliverability and sender reputation
- No disruption to existing email setup at `contact@acchm.org`

**Email Configuration**:
- **Send From**: `noreply@mail.accordandharmony.org`
- **Reply To**: `contact@acchm.org`
- **Receive At**: `contact@acchm.org` (unchanged)

**Features**:
- ✅ Contact form → Sends to admin email
- ✅ Newsletter signup → Sends confirmation email
- ✅ Rate limiting (5 requests/hour per IP)
- ✅ Input sanitization and validation
- ✅ CSRF protection (optional)
- ✅ Error logging

For detailed integration guide, see [`docs/RESEND-INTEGRATION.md`](docs/RESEND-INTEGRATION.md)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Optimization

The website is already optimized for performance:
- Minimal external dependencies
- Efficient CSS with no frameworks
- Optimized JavaScript
- Google Fonts with preconnect

For further optimization:
- Compress images before uploading
- Enable gzip compression on server
- Set up browser caching

## Maintenance

### Regular Updates

- Review and update content quarterly
- Check all forms are working
- Test on different devices and browsers
- Update copyright year in footer

### Security

- Keep hosting platform updated
- Use HTTPS (SSL certificate)
- Regularly backup website files
- Monitor for broken links

## Support & Contact

For technical support or questions about the website:
- Email: contact@acchm.org
- Address: Odrin 95 st, Sofia 1303, Bulgaria

## License

Copyright © 2025 Accord and Harmony Foundation. All rights reserved.

## Changelog

### Version 1.0 (2025)
- Initial website launch
- 5 main pages with responsive design
- Interactive forms and navigation
- Modern UI with animations
