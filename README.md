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

### Setting Up Forms

The contact and donation forms currently show success messages without backend integration. To make them functional:

1. **Option A - Email Service (Formspree, FormSubmit)**
   - Sign up for a service like Formspree
   - Update form `action` attributes with provided endpoints

2. **Option B - Custom Backend**
   - Set up a server-side script (PHP, Node.js, etc.)
   - Update form `action` attributes to point to your script
   - Configure email sending functionality

3. **Option C - Network Solutions Forms**
   - Check if Network Solutions provides form handling
   - Follow their documentation to integrate

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
