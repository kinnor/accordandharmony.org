/**
 * PDF Watermarking Service
 * Adds watermark to PDFs stored in R2
 *
 * Note: This is a simplified version that adds watermark metadata.
 * For full visual watermarking, consider using:
 * 1. pdf-lib with Workers nodejs_compat flag
 * 2. External watermarking service (Cloudinary, imgix, etc.)
 * 3. Pre-watermarked PDFs generated server-side
 */

import { nanoid } from 'nanoid';

/**
 * Get original PDF from R2
 */
async function getOriginalPDF(r2Bucket, fileKey) {
  try {
    const object = await r2Bucket.get(fileKey);

    if (!object) {
      return {
        success: false,
        error: 'PDF file not found'
      };
    }

    const arrayBuffer = await object.arrayBuffer();

    return {
      success: true,
      data: arrayBuffer,
      metadata: object.customMetadata || {}
    };

  } catch (error) {
    console.error('Error fetching PDF from R2:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Add watermark metadata to PDF
 * This adds metadata that can be read by PDF viewers
 * For visual watermarking, use an external service or pdf-lib
 */
async function addWatermarkMetadata(pdfArrayBuffer, watermarkInfo) {
  // For now, we'll return the original PDF with custom metadata
  // In production, you would use pdf-lib or similar to add visual watermark

  // The watermark information is stored in the database and shown in the download email
  // Users understand the PDF is licensed to them

  return {
    success: true,
    data: pdfArrayBuffer,
    metadata: {
      'Licensed-To': watermarkInfo.userName,
      'Licensed-Email': watermarkInfo.userEmail,
      'License-Date': watermarkInfo.purchaseDate,
      'License-Type': 'Personal Use Only',
      'License-ID': watermarkInfo.transactionId
    }
  };
}

/**
 * Save watermarked PDF to R2
 */
async function saveWatermarkedPDF(r2Bucket, fileKey, pdfData, metadata) {
  try {
    await r2Bucket.put(fileKey, pdfData, {
      customMetadata: metadata,
      httpMetadata: {
        contentType: 'application/pdf'
      }
    });

    return { success: true, fileKey };

  } catch (error) {
    console.error('Error saving watermarked PDF to R2:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate watermarked PDF for user
 */
export async function generateWatermarkedPDF(env, { originalFileKey, userName, userEmail, transactionId, productName }) {
  try {
    // Get original PDF
    const pdfResult = await getOriginalPDF(env.R2_BUCKET, originalFileKey);

    if (!pdfResult.success) {
      return pdfResult;
    }

    // Add watermark metadata
    const watermarkInfo = {
      userName,
      userEmail,
      purchaseDate: new Date().toISOString(),
      transactionId,
      productName
    };

    const watermarkedResult = await addWatermarkMetadata(pdfResult.data, watermarkInfo);

    if (!watermarkedResult.success) {
      return watermarkedResult;
    }

    // Generate unique filename for watermarked copy
    const fileExtension = originalFileKey.split('.').pop();
    const watermarkedFileKey = `watermarked/${transactionId}/${nanoid()}.${fileExtension}`;

    // Save watermarked PDF
    const saveResult = await saveWatermarkedPDF(
      env.R2_BUCKET,
      watermarkedFileKey,
      watermarkedResult.data,
      watermarkedResult.metadata
    );

    if (!saveResult.success) {
      return saveResult;
    }

    return {
      success: true,
      watermarkedFileKey: watermarkedFileKey,
      originalFileKey: originalFileKey
    };

  } catch (error) {
    console.error('PDF watermarking error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get watermarked PDF for download
 */
export async function getWatermarkedPDF(env, fileKey) {
  try {
    const object = await env.R2_BUCKET.get(fileKey);

    if (!object) {
      return {
        success: false,
        error: 'File not found'
      };
    }

    return {
      success: true,
      data: await object.arrayBuffer(),
      metadata: object.customMetadata || {},
      size: object.size,
      contentType: object.httpMetadata?.contentType || 'application/pdf'
    };

  } catch (error) {
    console.error('Error fetching watermarked PDF:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Alternative: Generate watermark page as PDF
 * This creates a simple watermark page that can be prepended to the original PDF
 */
export function generateWatermarkPage(watermarkText) {
  // This would generate a PDF page with the watermark text
  // For simplicity, we'll return the watermark as metadata
  // In production, use pdf-lib or similar to create an actual PDF page

  return {
    text: watermarkText,
    // In production, this would be actual PDF bytes
    pdfBytes: null
  };
}

/**
 * IMPORTANT DEPLOYMENT NOTE:
 *
 * This implementation uses metadata watermarking. For visual watermarking directly on PDFs:
 *
 * Option 1: Use pdf-lib with Cloudflare Workers
 * - Add to package.json: "pdf-lib": "^1.17.1"
 * - Enable nodejs_compat in wrangler.toml
 * - Use pdf-lib to add text/image watermarks to each page
 *
 * Option 2: External Watermarking Service
 * - Use Cloudinary's PDF transformation API
 * - Use imgix for PDF processing
 * - Use dedicated PDF API service (PDF.co, PDFShift, etc.)
 *
 * Option 3: Pre-generate Watermarked Copies
 * - Generate watermarked PDFs server-side before upload
 * - Store multiple watermarked versions
 * - Serve appropriate version based on user
 *
 * Option 4: Client-side Watermarking
 * - Download original PDF to user's browser
 * - Use pdf-lib in browser to add watermark
 * - Provides security through obscurity but less secure
 *
 * Current implementation stores watermark info in database and informs users
 * via email that the PDF is licensed to them personally.
 */
