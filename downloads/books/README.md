# Book Preview PDF Directory

This directory contains the preview and full versions of the Jazz Trumpet Master Class book.

## Required Files

### Preview PDF (Required for preview feature)

**File name:** `JAZZ_TRUMPET_PREVIEW.pdf`

**Location:** Place it directly in this directory (`downloads/books/JAZZ_TRUMPET_PREVIEW.pdf`)

**Content:** This should be a sample PDF with a few pages from the book (e.g., pages 1-5 or selected chapters) to give visitors a preview of the content before they purchase.

**Recommended pages to include in preview:**
- Cover page
- Table of contents
- 1-2 sample pages from the "What's Inside" section
- 1-2 sample jazz licks
- Copyright/About page

**File size:** Recommended to keep under 1MB for fast loading

**Format:** Standard PDF (not password-protected)

---

### Full Book PDF (For watermarking after purchase)

**File name:** `JAZZ_TRUMPET_MASTER_CLASS.pdf`

**Location:** Place it directly in this directory (`downloads/books/JAZZ_TRUMPET_MASTER_CLASS.pdf`)

**Content:** The complete 28-page book

**Note:** This file is used by the Cloudflare Worker to generate personalized watermarked copies for purchasers. It should be the master copy without any watermarks.

---

## How the Preview Feature Works

1. **Visitor clicks "Preview Sample Pages" button** on the donate page
2. **Modal opens** displaying the preview PDF (`JAZZ_TRUMPET_PREVIEW.pdf`)
3. **Visitor can read** the sample pages in the browser
4. **If they like it**, they can click "Purchase Full Book" to buy the complete version
5. **After purchase**, they receive a personalized watermarked copy of `JAZZ_TRUMPET_MASTER_CLASS.pdf` via email

---

## Testing the Preview

After you add the preview PDF:

1. Open `donate.html` in your browser
2. Scroll to the "Jazz Trumpet Master Class" section
3. Click the "Preview Sample Pages" button
4. The modal should open showing your preview PDF
5. Test on mobile devices to ensure responsiveness
6. Test the "Purchase Full Book" button - it should close the modal and scroll to the purchase section

---

## File Checklist

- [ ] `JAZZ_TRUMPET_PREVIEW.pdf` - Preview sample (user must add)
- [ ] `JAZZ_TRUMPET_MASTER_CLASS.pdf` - Full book for watermarking (user must add)

---

## Notes

- The preview PDF is loaded directly in the browser using an `<iframe>` element
- For mobile devices that don't support PDF preview in iframes, a download link is provided
- Both files should be uploaded to your web server when deploying
- The preview is free to view; only the full book requires purchase
- Make sure both PDFs are optimized for web (compressed, fonts embedded)

---

## Deployment

When deploying to your web host (accordandharmony.org):

1. Upload the entire `downloads/books/` directory
2. Ensure both PDF files are included
3. Test the preview feature on the live site
4. Check file permissions (should be readable by web server)

---

**Last Updated:** 2025-01-15
**Feature Status:** ✅ Implemented - Awaiting PDF files from user
